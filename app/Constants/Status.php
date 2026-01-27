<?php

namespace App\Constants;

class Status
{
    // Status constants
    public const ACTIVE = 1;
    public const NEW = 2;
    public const INACTIVE = 3;
    public const DEFECTIVE = 4;

    // Labels mapping
    public const LABELS = [
        self::ACTIVE => 'Active',
        self::NEW => 'New',
        self::INACTIVE => 'Inactive',
        self::DEFECTIVE => 'Defective',
    ];

    // Colors mapping
    public const COLORS = [
        self::ACTIVE => 'green',
        self::NEW => 'blue',
        self::INACTIVE => 'gray',
        self::DEFECTIVE => 'red',
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
