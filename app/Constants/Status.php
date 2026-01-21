<?php

namespace App\Constants;

class Status
{
    // Status values
    const ACTIVE = 1;
    const INACTIVE = 2;
    const DEFECTIVE = 3;


    // Status labels
    const LABELS = [
        self::ACTIVE => 'Active',
        self::INACTIVE => 'Inactive',
        self::DEFECTIVE => 'Defective',

    ];

    // Status colors for UI
    const COLORS = [
        self::ACTIVE      => 'gold',
        self::INACTIVE     => 'lime',
        self::DEFECTIVE      => 'blue',

    ];


    /**
     * Get status label by value
     *
     * @param int $status
     * @return string
     */
    public static function getLabel(int $status): string
    {
        return self::LABELS[$status] ?? 'Unknown';
    }


    public static function getColor(int $status): string
    {
        return self::COLORS[$status] ?? 'default';
    }

    /**
     * Get status value by label
     *
     * @param string $label
     * @return int|null
     */
    public static function getValueByLabel(string $label): ?int
    {
        $flipped = array_flip(self::LABELS);
        return $flipped[$label] ?? null;
    }
}
