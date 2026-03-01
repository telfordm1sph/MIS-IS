<?php

namespace App\Repositories;

use App\Models\Hardware;
use App\Models\Part;

class DashboardRepository
{
    // ── Hardware ──────────────────────────────────────────────

    public function getHardwareCountPerCategoryAndStatus()
    {
        return Hardware::select('category', 'status')
            ->selectRaw('COUNT(*) as total')
            ->groupBy('category', 'status')
            ->orderBy('category')
            ->get();
    }

    public function getActiveHardwareCount(): array
    {
        $active    = Hardware::where('status', '1')->count();
        $new       = Hardware::where('status', '2')->count();
        $inactive  = Hardware::where('status', '3')->count();
        $defective = Hardware::where('status', '4')->count();

        return compact('active', 'new', 'inactive', 'defective');
    }

    // ── Parts ─────────────────────────────────────────────────

    public function getPartCountPerType()
    {
        return Part::select('parts.part_type')
            ->selectRaw('SUM(part_inventory.quantity) as total')
            ->join('part_inventory', 'parts.id', '=', 'part_inventory.part_id')
            ->groupBy('parts.part_type')
            ->orderBy('parts.part_type')
            ->get();
    }

    public function getPartCountPerTypeAndCondition()
    {
        return Part::select('parts.part_type', 'part_inventory.condition')
            ->selectRaw('SUM(part_inventory.quantity) as total')
            ->join('part_inventory', 'parts.id', '=', 'part_inventory.part_id')
            ->groupBy('parts.part_type', 'part_inventory.condition')
            ->orderBy('parts.part_type')
            ->get();
    }
}
