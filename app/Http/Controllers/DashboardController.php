<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __construct(
        protected DashboardService $dashboardService
    ) {}

    // ── Page ──────────────────────────────────────────────────

    public function index(): Response
    {
        return Inertia::render('Dashboard/index');
    }

    // ── Hardware ──────────────────────────────────────────────

    public function hardwareChartData(): JsonResponse
    {
        return response()->json($this->dashboardService->getHardwareChartData());
    }

    public function hardwareCounts(): JsonResponse
    {
        return response()->json($this->dashboardService->getActiveHardwareCount());
    }

    // ── Parts ─────────────────────────────────────────────────

    public function partsChartData(): JsonResponse
    {
        return response()->json($this->dashboardService->getPartChartData());
    }

    public function partsCounts(): JsonResponse
    {
        return response()->json($this->dashboardService->getPartCountPerType());
    }
}
