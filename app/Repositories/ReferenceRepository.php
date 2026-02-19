<?php

namespace App\Repositories;

use App\Models\Departments;
use App\Models\Locations;
use App\Models\Prodlines;
use App\Models\Stations;

class ReferenceRepository
{
    public function getDepartmentsByIds(array $ids)
    {
        return Departments::on('masterlist')
            ->whereIn('DEPTID', $ids)
            ->get()
            ->keyBy('DEPTID');
    }

    public function getLocationsByIds(array $ids)
    {
        return Locations::whereIn('id', $ids)
            ->get()
            ->keyBy('id');
    }

    public function getStationsByIds(array $ids)
    {
        return Stations::whereIn('STATIONID', $ids)
            ->get()
            ->keyBy('STATIONID');
    }

    public function getProdlinesByIds(array $ids)
    {
        return Prodlines::whereIn('PLID', $ids)
            ->get()
            ->keyBy('PLID');
    }
}
