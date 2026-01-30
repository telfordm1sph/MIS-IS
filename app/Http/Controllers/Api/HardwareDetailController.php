<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\HardwareDetailService;

class HardwareDetailController extends Controller
{
    protected HardwareDetailService $hardwareDetailService;

    public function __construct(HardwareDetailService $hardwareDetailService)
    {
        $this->hardwareDetailService = $hardwareDetailService;
    }

    /**
     * Get parts inventory with quantities
     * REQUEST: Handle HTTP request, decode filters
     * RETURNS: JSON response with parts inventory
     */
    public function partsInventory(?string $filters = null)
    {
        $filters = $this->decodeFilters($filters);

        // BUSINESS LOGIC: Delegate to service
        $inventory = $this->hardwareDetailService->getPartsWithInventory($filters);

        return response()->json($inventory);
    }

    /**
     * Get cascading parts options (TYPE → BRAND → MODEL → SPEC)
     * Only show options where inventory quantity > 0
     * REQUEST: Handle HTTP request, decode filters
     * RETURNS: JSON response with available options
     */
    public function partsOptions(?string $filters = null)
    {
        $filters = $this->decodeFilters($filters);
        // dd($filters);
        // BUSINESS LOGIC: Delegate to service
        $options = $this->hardwareDetailService->getPartsOptions($filters);

        return response()->json($options);
    }

    /**
     * Get hardware parts list
     * REQUEST: Handle HTTP request
     * RETURNS: JSON response with hardware parts
     */
    public function parts($hardwareId)
    {
        // BUSINESS LOGIC: Delegate to service
        $parts = $this->hardwareDetailService->getFormattedHardwareParts($hardwareId);

        return response()->json($parts);
    }

    /**
     * Get cascading software options (NAME → TYPE → VERSION → LICENSE)
     * Only show software with available license activations
     * REQUEST: Handle HTTP request, decode filters
     * RETURNS: JSON response with available options
     */
    public function softwareOptions(?string $filters = null)
    {
        $filters = $this->decodeFilters($filters);

        // BUSINESS LOGIC: Delegate to service
        $options = $this->hardwareDetailService->getSoftwareOptions($filters);

        return response()->json($options);
    }

    /**
     * Get software licenses with activation info
     * REQUEST: Handle HTTP request, decode filters
     * RETURNS: JSON response with available licenses
     */
    public function softwareLicenses(?string $filters = null)
    {
        $filters = $this->decodeFilters($filters);

        // BUSINESS LOGIC: Delegate to service
        $licenses = $this->hardwareDetailService->getSoftwareLicenses($filters);

        return response()->json($licenses);
    }

    /**
     * Get hardware software list
     * REQUEST: Handle HTTP request
     * RETURNS: JSON response with hardware software
     */
    public function software($hardwareId)
    {
        // BUSINESS LOGIC: Delegate to service
        $software = $this->hardwareDetailService->getFormattedHardwareSoftware($hardwareId);

        return response()->json($software);
    }

    /**
     * Get all software inventory options for dropdown
     * REQUEST: Handle HTTP request
     * RETURNS: JSON response with software options
     */
    public function softwareInventoryOptions()
    {
        // BUSINESS LOGIC: Delegate to service
        $software = $this->hardwareDetailService->getSoftwareInventoryOptions();

        return response()->json($software);
    }
}
