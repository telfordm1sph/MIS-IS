<?php

namespace App\Http\Controllers;

use App\Services\SystemStatusService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SystemStatusController extends Controller
{
    public function __construct(
        protected SystemStatusService $service
    ) {}

    /**
     * Set system back to online (admin only — emp_id 1705).
     */
    public function setOnline(Request $request)
    {
        $empId = session('emp_data.emp_id');

        if ($empId != 1705) {
            abort(403, 'Unauthorized');
        }

        $this->service->setOnline();

        return redirect()->route('dashboard');
    }

    /**
     * Set system to maintenance mode (admin only — emp_id 1705).
     */
    public function setMaintenance(Request $request)
    {
        $empId = session('emp_data.emp_id');

        if ($empId != 1705) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'message' => 'nullable|string|max:500',
        ]);

        $this->service->setMaintenance(
            $validated['message'] ?? 'System is currently under maintenance.'
        );

        return back();
    }
}
