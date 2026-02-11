<?php

namespace App\Repositories;

use App\Models\Issuance;
use App\Models\IssuanceItem;
use App\Models\Acknowledgement;
use Illuminate\Support\Facades\DB;

class IssuanceRepository
{
    /**
     * Base query for Issuance with relationships
     */
    public function query()
    {
        return Issuance::with([
            'acknowledgement',
            'hardware:id,hostname,serial_number,location',
            'recipient:EMPLOYID,EMPNAME',
            'creator:EMPLOYID,EMPNAME'
        ]);
    }

    /**
     * Base query for IssuanceItem with relationships
     */
    public function itemQuery()
    {
        return IssuanceItem::with([
            'acknowledgement.acknowledgedByEmployee:EMPNAME,EMPLOYID',
            'hardware:id,hostname,serial_number,location',
            'creator:EMPLOYID,EMPNAME'
        ]);
    }

    /**
     * Base query for Acknowledgement with relationships
     */
    public function acknowledgementQuery()
    {
        return Acknowledgement::with([
            'acknowledgedByEmployee:EMPLOYID,EMPNAME'
        ]);
    }

    /**
     * Get whole unit issuances table
     */
    public function getWholeUnitIssuancesTable(array $filters)
    {
        $query = $this->query()
            ->with(['acknowledgement' => function ($q) {
                $q->select('id', 'reference_type', 'reference_id', 'acknowledged_by', 'status', 'acknowledged_at', 'remarks', 'created_at');
            }]);

        // Apply search
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('request_number', 'like', "%{$search}%")
                    ->orWhere('hostname', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%")
                    ->orWhere('remarks', 'like', "%{$search}%")
                    ->orWhereHas('recipient', function ($subQuery) use ($search) {
                        $subQuery->whereRaw("CONCAT(fname, ' ', COALESCE(mname, ''), ' ', lname) LIKE ?", ["%{$search}%"]);
                    });
            });
        }

        // Apply status filter via acknowledgement
        if ($filters['status'] !== '') {
            $query->whereHas('acknowledgement', function ($q) use ($filters) {
                $q->where('status', $filters['status']);
            });
        }

        // Apply date range filter
        if (!empty($filters['dateFrom']) && !empty($filters['dateTo'])) {
            $query->whereBetween('created_at', [
                $filters['dateFrom'] . ' 00:00:00',
                $filters['dateTo'] . ' 23:59:59'
            ]);
        }

        // Get total count
        $totalRecords = $query->count();

        // Apply sorting
        $sortField = $this->mapIssuanceSortField($filters['sortField']);
        $sortOrder = in_array(strtolower($filters['sortOrder']), ['asc', 'desc'])
            ? $filters['sortOrder']
            : 'desc';

        $query->orderBy($sortField, $sortOrder);

        // Apply pagination
        $page = max(1, $filters['page']);
        $pageSize = max(1, min(100, $filters['pageSize']));
        $offset = ($page - 1) * $pageSize;

        $data = $query->skip($offset)->take($pageSize)->get();

        return [
            'data' => $data,
            'pagination' => [
                'current_page' => $page,
                'total_pages' => ceil($totalRecords / $pageSize),
                'total_records' => $totalRecords,
                'page_size' => $pageSize,
            ],
        ];
    }

    /**
     * Get individual item issuances table
     */
    public function getIndividualItemIssuancesTable(array $filters)
    {
        $query = $this->itemQuery()
            ->whereNull('issuance_id')
            ->with(['acknowledgement' => function ($q) {
                $q->select('id', 'reference_type', 'reference_id', 'acknowledged_by', 'status', 'acknowledged_at', 'remarks', 'created_at');
            }]);

        // Apply search
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('item_name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('serial_number', 'like', "%{$search}%")
                    ->orWhere('remarks', 'like', "%{$search}%")
                    ->orWhereHas('hardware', function ($subQuery) use ($search) {
                        $subQuery->where('hostname', 'like', "%{$search}%");
                    });
            });
        }

        // Apply status filter via acknowledgement
        if ($filters['status'] !== '') {
            $query->whereHas('acknowledgement', function ($q) use ($filters) {
                $q->where('status', $filters['status']);
            });
        }

        // Apply item type filter
        if (!empty($filters['itemType'])) {
            $query->where('item_type', $filters['itemType']);
        }

        // Apply date range filter
        if (!empty($filters['dateFrom']) && !empty($filters['dateTo'])) {
            $query->whereBetween('created_at', [
                $filters['dateFrom'] . ' 00:00:00',
                $filters['dateTo'] . ' 23:59:59'
            ]);
        }

        // Get total count
        $totalRecords = $query->count();

        // Apply sorting
        $sortField = $this->mapIssuanceItemSortField($filters['sortField']);
        $sortOrder = in_array(strtolower($filters['sortOrder']), ['asc', 'desc'])
            ? $filters['sortOrder']
            : 'desc';

        $query->orderBy($sortField, $sortOrder);

        // Apply pagination
        $page = max(1, $filters['page']);
        $pageSize = max(1, min(100, $filters['pageSize']));
        $offset = ($page - 1) * $pageSize;

        $data = $query->skip($offset)->take($pageSize)->get();

        return [
            'data' => $data,
            'pagination' => [
                'current_page' => $page,
                'total_pages' => ceil($totalRecords / $pageSize),
                'total_records' => $totalRecords,
                'page_size' => $pageSize,
            ],
        ];
    }

    /**
     * Map sort field for issuances
     */
    private function mapIssuanceSortField($field)
    {
        $fields = [
            'id' => 'id',
            'request_number' => 'request_number',
            'hostname' => 'hostname',
            'location' => 'location',
            'created_at' => 'created_at',
        ];

        return $fields[$field] ?? 'created_at';
    }

    /**
     * Map sort field for issuance items
     */
    private function mapIssuanceItemSortField($field)
    {
        $fields = [
            'id' => 'id',
            'item_name' => 'item_name',
            'item_type' => 'item_type',
            'quantity' => 'quantity',
            'created_at' => 'created_at',
        ];

        return $fields[$field] ?? 'created_at';
    }

    /**
     * Find acknowledgement by ID with relationships
     */
    public function findAcknowledgement($id)
    {
        return $this->acknowledgementQuery()
            ->with([
                'issuance' => function ($q) {
                    $q->with(['hardware', 'recipient', 'creator']);
                },
                'issuanceItem' => function ($q) {
                    $q->with(['hardware', 'creator']);
                }
            ])
            ->find($id);
    }

    /**
     * Update acknowledgement
     */
    public function updateAcknowledgement($id, array $data)
    {
        $acknowledgement = Acknowledgement::find($id);

        if ($acknowledgement) {
            $acknowledgement->update($data);

            // Include both possible relationships when refreshing
            return $acknowledgement->fresh([
                'acknowledgedByEmployee',
                'issuance',
                'issuanceItem'
            ]);
        }

        return null;
    }


    /**
     * Create a new issuance record
     */
    public function createIssuance(array $data)
    {
        return Issuance::create($data);
    }

    /**
     * Create issuance item
     */
    public function createIssuanceItem(array $data)
    {
        return IssuanceItem::create($data);
    }

    /**
     * Create acknowledgement
     */
    public function createAcknowledgement(array $data)
    {
        return Acknowledgement::create($data);
    }
}
