<?php

namespace App\Http\Controllers;

use App\Services\UserRoleService;
use Illuminate\Http\Request;

class UserController extends Controller
{
    protected UserRoleService $userRoleService;

    public function __construct(UserRoleService $userRoleService)
    {
        $this->userRoleService = $userRoleService;
    }

    public function getEmployees()
    {
        try {
            $employees = $this->userRoleService->getEmployees();

            return response()->json([
                'success' => true,
                'employees' => $employees,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }
    public function getDepartments()
    {
        try {
            $departments = $this->userRoleService->getDepartmentOptions();

            return response()->json([
                'success' => true,
                'departments' => $departments,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }
    public function getLocationList()
    {
        try {
            $locations = $this->userRoleService->getLocationList();

            return response()->json([
                'success' => true,
                'locations' => $locations,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }
    public function getProdlineOptions()
    {
        try {
            $prodlines = $this->userRoleService->getProdlineOptions();

            return response()->json([
                'success' => true,
                'prodlines' => $prodlines,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }
    public function getStationOptions()
    {
        try {
            $stations = $this->userRoleService->getStationOptions();

            return response()->json([
                'success' => true,
                'stations' => $stations,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
