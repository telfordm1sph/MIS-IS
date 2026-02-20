<?php

namespace App\Repositories;

use App\Models\Issuance;
use App\Models\Acknowledgement;
use App\Models\ComponentIssuanceDetail;
use App\Models\HardwareUsers;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class IssuanceRepository
{
    /**
     * Get unified issuances table (type 1 + type 2)
     */
    public function getIssuancesTable(array $filters): array
    {
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
                );
            },
            'hardware:id,hostname,serial_number,location',
            'hardware.hardwareUsers:id,hardware_id,user_id,date_assigned,remarks',
            'componentDetails:id,issuance_id,operation_type,component_type,old_component_id,old_component_condition,old_component_data,new_component_id,new_component_condition,new_component_data,reason,remarks',
        ]);

        // FILTER: employee_id
        if (!empty($filters['employee_id'])) {
            $employeeId = $filters['employee_id'];
            $query->where(function ($q) use ($employeeId) {
                $q->where('created_by', $employeeId)
                    ->orWhereHas('acknowledgement', function ($ackQuery) use ($employeeId) {
                        $ackQuery->where('acknowledged_by', $employeeId);
                    })
                    ->orWhereHas('hardware.hardwareUsers', function ($huQuery) use ($employeeId) {
                        $huQuery->where('user_id', $employeeId);
                    });
            });
        }

        // FILTER: issuance_type
        if (isset($filters['issuance_type']) && $filters['issuance_type'] !== '') {
            $query->where('issuance_type', $filters['issuance_type']);
        }

        // FILTER: search
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('issuance_number', 'like', "%{$search}%")
                    ->orWhere('request_number', 'like', "%{$search}%")
                    ->orWhere('hostname', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%")
                    ->orWhere('remarks', 'like', "%{$search}%");
            });
        }

        // FILTER: status
        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->whereHas('acknowledgement', function ($q) use ($filters) {
                $q->where('status', $filters['status']);
            });
        }

        // FILTER: date range
        if (!empty($filters['dateFrom']) && !empty($filters['dateTo'])) {
            $query->whereBetween('created_at', [
                $filters['dateFrom'] . ' 00:00:00',
                $filters['dateTo'] . ' 23:59:59',
            ]);
        }

        // SORTING
        $sortField = $this->mapIssuanceSortField($filters['sortField'] ?? 'created_at');
        $sortOrder = in_array(strtolower($filters['sortOrder'] ?? 'desc'), ['asc', 'desc'])
            ? strtolower($filters['sortOrder'])
            : 'desc';
        $query->orderBy($sortField, $sortOrder);

        // PAGINATION
        $page     = max(1, (int)($filters['page'] ?? 1));
        $pageSize = max(1, min(100, (int)($filters['pageSize'] ?? 10)));
        $offset   = ($page - 1) * $pageSize;

        $totalRecords = $query->count();
        $data         = $query->skip($offset)->take($pageSize)->get();

        $data = $this->resolveEmployees($data);

        return [
            'success'    => true,
            'data'       => $data,
            'filters'    => $filters,
            'pagination' => [
                'current_page'  => $page,
                'total_pages'   => $totalRecords > 0 ? ceil($totalRecords / $pageSize) : 1,
                'total_records' => $totalRecords,
                'page_size'     => $pageSize,
            ],
        ];
    }

    /**
     * Resolve cross-connection employees for a collection of issuances
     */
    private function resolveEmployees(Collection $data): Collection
    {
        $employeeIds = collect();

        $data->each(function ($issuance) use (&$employeeIds) {
            if ($issuance->created_by) {
                $employeeIds->push($issuance->created_by);
            }
            if ($issuance->acknowledgement?->acknowledged_by) {
                $employeeIds->push($issuance->acknowledgement->acknowledged_by);
            }
            if ($issuance->hardware) {
                $issuance->hardware->hardwareUsers->each(function ($hu) use (&$employeeIds) {
                    if ($hu->user_id) $employeeIds->push($hu->user_id);
                });
            }
        });

        $employees = User::whereIn('EMPLOYID', $employeeIds->unique()->filter()->values()->all())
            ->select('EMPLOYID', 'EMPNAME')
            ->get()
            ->keyBy('EMPLOYID');

        $data->each(function ($issuance) use ($employees) {
            $issuance->setRelation('creator', $employees->get($issuance->created_by));

            if ($issuance->acknowledgement?->acknowledged_by) {
                $issuance->acknowledgement->setRelation(
                    'acknowledgedByEmployee',
                    $employees->get($issuance->acknowledgement->acknowledged_by)
                );
            }

            if ($issuance->hardware) {
                $issuance->hardware->hardwareUsers->each(function ($hu) use ($employees) {
                    $hu->setRelation('user', $employees->get($hu->user_id));
                });
            }
        });

        return $data;
    }

    /**
     * Find acknowledgement by issuance ID
     */
    public function findAcknowledgementByIssuance(int $issuanceId): ?Acknowledgement
    {
        $issuance = Issuance::select('id', 'hardware_id', 'created_by', 'issuance_number')
            ->with('acknowledgement')
            ->find($issuanceId);

        if (!$issuance || !$issuance->acknowledgement) {
            return null;
        }

        $issuance->acknowledgement->setRelation('issuance', $issuance);

        return $issuance->acknowledgement;
    }

    /**
     * Update acknowledgement
     */
    public function updateAcknowledgement(int $id, array $data): ?Acknowledgement
    {
        $acknowledgement = Acknowledgement::find($id);

        if ($acknowledgement) {
            $acknowledgement->update($data);
            return $acknowledgement->fresh(['acknowledgedByEmployee', 'issuance']);
        }

        return null;
    }

    /**
     * Check if employee is assigned to hardware
     */
    public function isEmployeeAssignedToHardware(int $hardwareId, int $employeeId): bool
    {
        return HardwareUsers::where('hardware_id', $hardwareId)
            ->where('user_id', $employeeId)
            ->exists();
    }

    /**
     * Create whole unit issuance
     */
    public function createWholeUnitIssuance(array $issuanceData, array $acknowledgementData): array
    {
        return DB::transaction(function () use ($issuanceData, $acknowledgementData) {
            $issuance = Issuance::create($issuanceData);

            $acknowledgementData['reference_id'] = $issuance->id;
            $acknowledgement = Acknowledgement::create($acknowledgementData);

            return [
                'issuance'        => $issuance,
                'acknowledgement' => $acknowledgement,
            ];
        });
    }

    /**
     * Create component maintenance issuance
     */
    public function createComponentMaintenanceIssuance(array $issuanceData, array $componentDetailsData, array $acknowledgementData): array
    {
        return DB::transaction(function () use ($issuanceData, $componentDetailsData, $acknowledgementData) {
            $issuance = Issuance::create($issuanceData);

            $componentDetails = [];
            foreach ($componentDetailsData as $detailData) {
                $detailData['issuance_id'] = $issuance->id;
                $componentDetails[] = ComponentIssuanceDetail::create($detailData);
            }

            $acknowledgementData['reference_id'] = $issuance->id;
            $acknowledgement = Acknowledgement::create($acknowledgementData);

            return [
                'issuance'           => $issuance,
                'component_details'  => $componentDetails,
                'acknowledgement'    => $acknowledgement,
            ];
        });
    }

    /**
     * Get last issuance number
     */
    public function getLastIssuanceNumber(): ?Issuance
    {
        return Issuance::where('issuance_number', 'like', 'ISS-' . date('Y') . '-%')
            ->orderBy('id', 'desc')
            ->first();
    }

    /**
     * Map sort field
     */
    private function mapIssuanceSortField(string $field): string
    {
        return match ($field) {
            'id'             => 'id',
            'request_number' => 'request_number',
            'issuance_number' => 'issuance_number',
            'hostname'       => 'hostname',
            'location'       => 'location',
            default          => 'created_at',
        };
    }
}
