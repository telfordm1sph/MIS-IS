<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\HardwareDetailService;
use Illuminate\Http\Request;

class HardwareDetailController extends Controller
{
    protected HardwareDetailService $hardwareDetailService;

    public function __construct(HardwareDetailService $hardwareDetailService)
    {
        $this->hardwareDetailService = $hardwareDetailService;
    }

    public function fullDetails(string $hardwareId)
    {
        $hardware = $this->hardwareDetailService->getHardwareInfo($hardwareId);
        return response()->json($hardware);
    }

    /**
     * Get parts inventory with quantities
     */
    public function partsInventory(?string $filters = null)
    {
        $filters = $this->decodeFilters($filters);
        $inventory = $this->hardwareDetailService->getPartsWithInventory($filters);
        return response()->json($inventory);
    }

    /**
     * Get cascading parts options (TYPE → BRAND → MODEL → SPEC)
     */
    public function partsOptions(?string $filters = null)
    {
        $filters = $this->decodeFilters($filters);
        $options = $this->hardwareDetailService->getPartsOptions($filters);
        return response()->json($options);
    }

    /**
     * Get hardware parts list
     */
    public function parts($hardwareId)
    {
        $parts = $this->hardwareDetailService->getFormattedHardwareParts($hardwareId);
        return response()->json($parts);
    }

    /**
     * Get cascading software options (NAME → TYPE → VERSION → LICENSE)
     */
    public function softwareOptions(?string $filters = null)
    {
        $filters = $this->decodeFilters($filters);
        $options = $this->hardwareDetailService->getSoftwareOptions($filters);
        return response()->json($options);
    }

    /**
     * Get software licenses with activation info
     */
    public function softwareLicenses(?string $filters = null)
    {
        $filters = $this->decodeFilters($filters);
        $licenses = $this->hardwareDetailService->getSoftwareLicenses($filters);
        return response()->json($licenses);
    }

    /**
     * Get hardware software list
     */
    public function software($hardwareId)
    {
        $software = $this->hardwareDetailService->getFormattedHardwareSoftware($hardwareId);
        return response()->json($software);
    }

    /**
     * Get all software inventory options for dropdown
     */
    public function softwareInventoryOptions()
    {
        $software = $this->hardwareDetailService->getSoftwareInventoryOptions();
        return response()->json($software);
    }

    // ============================================================
    // NEW ENDPOINTS FOR TABLE-BASED SELECTION
    // ============================================================

    /**
     * Get available parts for replacement (filtered by part_type)
     * Shows only parts with available inventory grouped by serial numbers
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function availableParts(Request $request)
    {
        $filters = [
            'part_type' => $request->query('part_type'),
            'brand' => $request->query('brand'),
            'model' => $request->query('model'),
            'condition' => $request->query('condition'),
        ];

        $parts = $this->hardwareDetailService->getAvailablePartsForSelection($filters);
        return response()->json($parts);
    }

    /**
     * Get all available parts (no filters) for ADD operation
     * Shows complete inventory with all part types
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function allAvailableParts(Request $request)
    {
        // dd($request->all());
        $filters = [
            'part_type' => $request->query('part_type'),
            'selected_type' => $request->query('selected_type'),
            'brand' => $request->query('brand'),
            'condition' => $request->query('condition'),
            'search' => $request->query('search'),
        ];

        $page = $request->query('page', 1);
        $pageSize = $request->query('page_size', 5);
        $sortField = $request->query('sort_field', 'brand');
        $sortOrder = $request->query('sort_order', 'asc');

        $result = $this->hardwareDetailService->getAllAvailablePartsPaginated(
            $filters,
            $page,
            $pageSize,
            $sortField,
            $sortOrder
        );

        return response()->json($result);
    }


    /**
     * Get available software for replacement (filtered by name and type)
     * Shows only software with available license activations
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function availableSoftware(Request $request)
    {

        $filters = [
            'software_name' => $request->query('software_name'),
            'software_type' => $request->query('software_type'),
            'version' => $request->query('version'),
        ];

        $software = $this->hardwareDetailService->getAvailableSoftwareForSelection($filters);
        return response()->json($software);
    }

    /**
     * Get all available software (no filters) for ADD operation
     * Shows complete software inventory with available licenses
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function allAvailableSoftware(Request $request)
    {
        // dd($request->all());
        $filters = [
            'software_name' => $request->query('software_name'),
            'software_type' => $request->query('software_type'),
            'selected_type' => $request->query('selected_type'),
            'search' => $request->query('search'),
        ];

        $page = $request->query('page', 1);
        $pageSize = $request->query('page_size', 5);
        $sortField = $request->query('sort_field', 'software_name');
        $sortOrder = $request->query('sort_order', 'asc');

        $result = $this->hardwareDetailService->getAllAvailableSoftwarePaginated(
            $filters,
            $page,
            $pageSize,
            $sortField,
            $sortOrder
        );

        return response()->json($result);
    }
}
