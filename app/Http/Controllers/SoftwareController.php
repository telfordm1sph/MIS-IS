<?php

namespace App\Http\Controllers;

use App\Services\SoftwareService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SoftwareController extends Controller
{
    protected SoftwareService $softwareService;

    public function __construct(SoftwareService $softwareService,)
    {
        $this->softwareService = $softwareService;
    }
    public function getSoftwareTable(Request $request)
    {
        $empData = session('emp_data');
        // Decode base64 filters
        $filters = $this->decodeFilters($request->input('f', ''));
        // dd($filters);
        // Validate and set defaults
        $filters = [
            'page' => (int) ($filters['page'] ?? 1),
            'pageSize' => (int) ($filters['pageSize'] ?? 10),
            'search' => trim($filters['search'] ?? ''),
            'sortField' => $filters['sortField'] ?? 'created_at',
            'sortOrder' => $filters['sortOrder'] ?? 'desc',
            'status' => $filters['status'] ?? '',
        ];
        // dd($empData);
        $result = $this->softwareService->getSoftwareTable($filters, $empData);
        // dd($result);
        return Inertia::render('Inventory/SoftwareTable', [
            'softwares' => $result['data'],
            'pagination' => $result['pagination'],
            // 'statusCounts' => $result['statusCounts'],
            'filters' => $result['filters'],
        ]);
    }
    protected function decodeFilters(string $encoded): array
    {
        $decoded = base64_decode($encoded);
        return $decoded ? json_decode($decoded, true) : [];
    }
}
