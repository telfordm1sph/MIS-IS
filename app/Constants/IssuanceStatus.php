<?php

namespace App\Constants;

class IssuanceStatus
{
    // Status values
    const PENDING = 0;
    const ACKNOWLEDGED = 1;



    // Status labels
    const LABELS = [
        self::PENDING => 'Pending',
        self::ACKNOWLEDGED => 'Acknowledged',


    ];

    // Status colors for UI
    const COLORS = [
        self::PENDING  => 'blue',
        self::ACKNOWLEDGED   => 'lime',
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
