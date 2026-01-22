<?php

namespace App\Repositories;


use App\Models\PartInventory;
use App\Models\SoftwareInventory;

class SoftwareRepository
{
    public function query()
    {
        return SoftwareInventory::query();
    }
}
