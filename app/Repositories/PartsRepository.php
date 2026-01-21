<?php

namespace App\Repositories;

use App\Constants\Status;
use App\Models\PartInventory;

class PartsRepository
{
    public function query()
    {
        return PartInventory::query();
    }

    // public function getPartsStatusCount($query): array
    // {
    //     $statusCounts = $query->clone()
    //         ->groupBy('status')
    //         ->selectRaw('status, COUNT(*) as count')
    //         ->pluck('count', 'status')
    //         ->toArray();

    //     $result = [];
    //     $total = array_sum($statusCounts);

    //     $result['All'] = [
    //         'count' => $total,
    //         'color' => 'default',
    //     ];

    //     foreach (Status::LABELS as $value => $label) {
    //         $result[$label] = [
    //             'count' => $statusCounts[$value] ?? 0,
    //             'color' => Status::COLORS[$value] ?? 'default',
    //         ];
    //     }

    //     return $result;
    // }
}
