<?php

namespace App\Repositories;

use App\Models\Issuance;
use App\Models\IssuanceItem;
use App\Models\Acknowledgement;
use App\Models\ComponentIssuanceDetail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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
    // public function itemQuery()
    // {
    //     return IssuanceItem::with([
    //         'acknowledgement.acknowledgedByEmployee:EMPNAME,EMPLOYID',
    //         'hardware:id,hostname,serial_number,location',
    //         'creator:EMPLOYID,EMPNAME'
    //     ]);
    // }

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
        Log::info('Filters: ' . json_encode($filters));

        // Base query with eager loading for all related models
        $query = Issuance::with([
            'acknowledgement' => function ($q) {
                $q->select(
                    'id',
                    'reference_type',
                    'reference_id',
                    'acknowledged_by',
                    'status',
                    'acknowledged_at',
                    'remarks',
                    'created_at'
                )->with('acknowledgedByEmployee:EMPLOYID,EMPNAME');
            },
            'recipient:EMPLOYID,EMPNAME',
            'creator:EMPLOYID,EMPNAME',
            'hardware:id,hostname,serial_number,location',
        ]);

        // -----------------------------
        // FILTER: employee_id (optional)
        // -----------------------------
        if (!empty($filters['employee_id'])) {
            $employeeId = $filters['employee_id'];
            $query->where(function ($q) use ($employeeId) {
                $q->where('issued_to', $employeeId)
                    ->orWhere('created_by', $employeeId)
                    ->orWhereHas('acknowledgement', function ($ackQuery) use ($employeeId) {
                        $ackQuery->where('acknowledged_by', $employeeId);
                    });
            });
        }

        // -----------------------------
        // FILTER: search (optional)
        // -----------------------------
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('request_number', 'like', "%{$search}%")
                    ->orWhere('hostname', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%")
                    ->orWhere('remarks', 'like', "%{$search}%")
                    ->orWhereHas('recipient', function ($subQuery) use ($search) {
                        $subQuery->where('EMPNAME', 'like', "%{$search}%");
                    });
            });
        }

        // -----------------------------
        // FILTER: status (optional)
        // -----------------------------
        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->whereHas('acknowledgement', function ($q) use ($filters) {
                $q->where('status', $filters['status']);
            });
        }

        // -----------------------------
        // FILTER: date range (optional)
        // -----------------------------
        if (!empty($filters['dateFrom']) && !empty($filters['dateTo'])) {
            $query->whereBetween('created_at', [
                $filters['dateFrom'] . ' 00:00:00',
                $filters['dateTo'] . ' 23:59:59'
            ]);
        }

        // -----------------------------
        // SORTING
        // -----------------------------
        $sortField = $this->mapIssuanceSortField($filters['sortField'] ?? 'created_at');
        $sortOrder = in_array(strtolower($filters['sortOrder'] ?? 'desc'), ['asc', 'desc'])
            ? strtolower($filters['sortOrder'])
            : 'desc';
        $query->orderBy($sortField, $sortOrder);

        // -----------------------------
        // PAGINATION
        // -----------------------------
        $page = max(1, (int)($filters['page'] ?? 1));
        $pageSize = max(1, min(100, (int)($filters['pageSize'] ?? 10)));
        $offset = ($page - 1) * $pageSize;

        $totalRecords = $query->count();
        $data = $query->skip($offset)->take($pageSize)->get();

        return [
            'success' => true,
            'data' => $data,
            'filters' => $filters,
            'pagination' => [
                'current_page' => $page,
                'total_pages' => $totalRecords > 0 ? ceil($totalRecords / $pageSize) : 1,
                'total_records' => $totalRecords,
                'page_size' => $pageSize,
            ],
        ];
    }


    /**
     * Get individual item issuances table
     */
    // public function getIndividualItemIssuancesTable(array $filters)
    // {
    //     $query = $this->itemQuery()
    //         ->whereNull('issuance_id')
    //         ->with(['acknowledgement' => function ($q) {
    //             $q->select('id', 'reference_type', 'reference_id', 'acknowledged_by', 'status', 'acknowledged_at', 'remarks', 'created_at');
    //         }]);

    //     // Apply search
    //     if (!empty($filters['search'])) {
    //         $search = $filters['search'];
    //         $query->where(function ($q) use ($search) {
    //             $q->where('item_name', 'like', "%{$search}%")
    //                 ->orWhere('description', 'like', "%{$search}%")
    //                 ->orWhere('serial_number', 'like', "%{$search}%")
    //                 ->orWhere('remarks', 'like', "%{$search}%")
    //                 ->orWhereHas('hardware', function ($subQuery) use ($search) {
    //                     $subQuery->where('hostname', 'like', "%{$search}%");
    //                 });
    //         });
    //     }

    //     // Apply status filter via acknowledgement
    //     if ($filters['status'] !== '') {
    //         $query->whereHas('acknowledgement', function ($q) use ($filters) {
    //             $q->where('status', $filters['status']);
    //         });
    //     }

    //     // Apply item type filter
    //     if (!empty($filters['itemType'])) {
    //         $query->where('item_type', $filters['itemType']);
    //     }

    //     // Apply date range filter
    //     if (!empty($filters['dateFrom']) && !empty($filters['dateTo'])) {
    //         $query->whereBetween('created_at', [
    //             $filters['dateFrom'] . ' 00:00:00',
    //             $filters['dateTo'] . ' 23:59:59'
    //         ]);
    //     }

    //     // Get total count
    //     $totalRecords = $query->count();

    //     // Apply sorting
    //     $sortField = $this->mapIssuanceItemSortField($filters['sortField']);
    //     $sortOrder = in_array(strtolower($filters['sortOrder']), ['asc', 'desc'])
    //         ? $filters['sortOrder']
    //         : 'desc';

    //     $query->orderBy($sortField, $sortOrder);

    //     // Apply pagination
    //     $page = max(1, $filters['page']);
    //     $pageSize = max(1, min(100, $filters['pageSize']));
    //     $offset = ($page - 1) * $pageSize;

    //     $data = $query->skip($offset)->take($pageSize)->get();

    //     return [
    //         'data' => $data,
    //         'pagination' => [
    //             'current_page' => $page,
    //             'total_pages' => ceil($totalRecords / $pageSize),
    //             'total_records' => $totalRecords,
    //             'page_size' => $pageSize,
    //         ],
    //     ];
    // }

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
    // public function createIssuanceItem(array $data)
    // {
    //     return IssuanceItem::create($data);
    // }

    /**
     * Create acknowledgement
     */
    public function createAcknowledgement(array $data)
    {
        return Acknowledgement::create($data);
    }
    /**
     * Get last issuance number
     */
    public function getLastIssuanceNumber()
    {
        return Issuance::where('issuance_number', 'like', 'ISS-' . date('Y') . '-%')
            ->orderBy('id', 'desc')
            ->first();
    }

    /**
     * Create component maintenance issuance with all related records
     */
    public function createComponentMaintenanceIssuance(array $issuanceData, array $componentDetailsData, array $acknowledgementData)
    {
        return DB::transaction(function () use ($issuanceData, $componentDetailsData, $acknowledgementData) {
            // Create issuance
            $issuance = Issuance::create($issuanceData);

            // Create component details
            $componentDetails = [];
            foreach ($componentDetailsData as $detailData) {
                $detailData['issuance_id'] = $issuance->id;
                $componentDetails[] = ComponentIssuanceDetail::create($detailData);
            }

            // Create acknowledgement
            $acknowledgementData['reference_id'] = $issuance->id;
            $acknowledgement = Acknowledgement::create($acknowledgementData);

            return [
                'issuance' => $issuance,
                'component_details' => $componentDetails,
                'acknowledgement' => $acknowledgement,
            ];
        });
    }

    /**
     * Find issuance with acknowledgement
     */
    public function findIssuanceWithAcknowledgement(int $issuanceId)
    {
        return Issuance::with('acknowledgement')
            ->where('id', $issuanceId)
            ->first();
    }

    /**
     * Get component maintenance issuances table
     */
    public function getComponentMaintenanceIssuancesTable(array $filters)
    {
        $query = Issuance::with([
            'acknowledgement.acknowledgedByEmployee:EMPLOYID,EMPNAME',
            'componentDetails',
            'hardware:id,hostname,serial_number,location',
            'recipient:EMPLOYID,EMPNAME',
            'creator:EMPLOYID,EMPNAME'
        ])->where('issuance_type', 2); // Component Maintenance

        // Apply search filter
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('issuance_number', 'like', "%{$search}%")
                    ->orWhere('hostname', 'like', "%{$search}%")
                    ->orWhereHas('hardware', function ($subQuery) use ($search) {
                        $subQuery->where('hostname', 'like', "%{$search}%");
                    });
            });
        }

        // Apply status filter
        if (isset($filters['status']) && $filters['status'] !== '') {
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

        // Apply sorting
        $sortField = $this->mapIssuanceSortField($filters['sortField'] ?? 'created_at');
        $sortOrder = in_array(strtolower($filters['sortOrder'] ?? 'desc'), ['asc', 'desc'])
            ? strtolower($filters['sortOrder'])
            : 'desc';
        $query->orderBy($sortField, $sortOrder);

        // Pagination
        $page = max(1, (int)($filters['page'] ?? 1));
        $pageSize = max(1, min(100, (int)($filters['pageSize'] ?? 10)));
        $offset = ($page - 1) * $pageSize;

        $totalRecords = $query->count();
        $data = $query->skip($offset)->take($pageSize)->get();

        return [
            'data' => $data,
            'pagination' => [
                'current_page' => $page,
                'total_pages' => $totalRecords > 0 ? ceil($totalRecords / $pageSize) : 1,
                'total_records' => $totalRecords,
                'page_size' => $pageSize,
            ],
        ];
    }

    /**
     * Create whole unit issuance
     */
    public function createWholeUnitIssuance(array $issuanceData, array $acknowledgementData)
    {
        return DB::transaction(function () use ($issuanceData, $acknowledgementData) {
            // Create issuance
            $issuance = Issuance::create($issuanceData);

            // Create acknowledgement
            $acknowledgementData['reference_id'] = $issuance->id;
            $acknowledgement = Acknowledgement::create($acknowledgementData);

            return [
                'issuance' => $issuance,
                'acknowledgement' => $acknowledgement,
            ];
        });
    }
}
