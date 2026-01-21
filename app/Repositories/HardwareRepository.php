<?php

namespace App\Repositories;

use App\Constants\Status;
use App\Models\Hardware;

class HardwareRepository
{
    public function query()
    {
        return Hardware::with([
            'parts',
            'software' => function ($q) {
                // select only software table columns you need
                $q->select('id', 'hardware_id', 'software_inventory_id', 'software_license_id', 'installation_date', 'status');

                // eager-load software inventory with only selected columns
                $q->with([
                    'softwareInventory:id,software_name,software_type,version',
                    'softwareLicense:id,license_key,account_user'
                ]);
            }
        ]);
    }



    public function getHardwareStatusCounts($query): array
    {
        $statusCounts = $query->clone()
            ->groupBy('status')
            ->selectRaw('status, COUNT(*) as count')
            ->pluck('count', 'status')
            ->toArray();

        $result = [];
        $total = array_sum($statusCounts);

        $result['All'] = [
            'count' => $total,
            'color' => 'default',
        ];

        foreach (Status::LABELS as $value => $label) {
            $result[$label] = [
                'count' => $statusCounts[$value] ?? 0,
                'color' => Status::COLORS[$value] ?? 'default',
            ];
        }

        return $result;
    }
}
