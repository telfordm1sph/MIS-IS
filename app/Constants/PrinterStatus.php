<?php

namespace App\Constants;

class PrinterStatus
{
    // Status constants
    public const ACTIVE = 1;
    public const INACTIVE = 2;


    // Labels mapping
    public const LABELS = [
        self::ACTIVE => 'Active',
        self::INACTIVE => 'Inactive',

    ];

    // Colors mapping
    public const COLORS = [
        self::ACTIVE => 'green',
        self::INACTIVE => 'red',
    ];

    /**
     * Get status label by value
     */
    public static function getLabel(int $status): string
    {
        return self::LABELS[$status] ?? 'Unknown';
    }

    /**
     * Get status color by value
     */
    public static function getColor(int $status): string
    {
        return self::COLORS[$status] ?? 'default';
    }

    /**
     * Get status value by label
     */
    public static function getValue(string $label): ?int
    {
        $flipped = array_flip(self::LABELS);
        return $flipped[$label] ?? null;
    }

    /**
     * Get all status options for select dropdowns
     */
    public static function getOptions(): array
    {
        return collect(self::LABELS)->map(function ($label, $value) {
            return [
                'value' => $value,
                'label' => $label,
                'color' => self::COLORS[$value] ?? 'default',
            ];
        })->values()->toArray();
    }
}
