<?php

namespace App\Services;

use App\Constants\Status;
use App\Repositories\DashboardRepository;

class DashboardService
{
    public function __construct(
        protected DashboardRepository $dashboardRepository
    ) {}

    // ── Hardware ──────────────────────────────────────────────

    public function getHardwareChartData(): array
    {
        $rows = $this->dashboardRepository->getHardwareCountPerCategoryAndStatus();

        $statuses = collect(Status::LABELS)
            ->mapWithKeys(fn($label, $value) => [$value => strtolower($label)])
            ->toArray();

        $grouped = [];

        foreach ($rows as $row) {
            $cat       = $row->category;
            $statusKey = $statuses[(int) $row->status] ?? 'unknown';

            if (!isset($grouped[$cat])) {
                $grouped[$cat] = array_merge(
                    ['category' => $cat],
                    array_fill_keys(array_values($statuses), 0)
                );
            }

            $grouped[$cat][$statusKey] += $row->total;
        }

        return array_values($grouped);
    }

    public function getActiveHardwareCount(): array
    {
        return $this->dashboardRepository->getActiveHardwareCount();
    }

    // ── Parts ─────────────────────────────────────────────────

    public function getPartCountPerType(): array
    {
        return $this->dashboardRepository
            ->getPartCountPerType()
            ->pluck('total', 'part_type')
            ->toArray();
    }

    public function getPartChartData(): array
    {
        $rows          = $this->dashboardRepository->getPartCountPerTypeAndCondition();
        $allConditions = $rows->pluck('condition')->unique()->values()->toArray();
        $grouped       = [];

        foreach ($rows as $row) {
            $type = $row->part_type;

            if (!isset($grouped[$type])) {
                $grouped[$type] = array_merge(
                    ['part_type' => $type],
                    array_fill_keys($allConditions, 0)
                );
            }

            $grouped[$type][$row->condition] += $row->total;
        }

        return array_values($grouped);
    }
}
