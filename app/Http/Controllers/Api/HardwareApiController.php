<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

class HardwareApiController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => [
                ['id' => 1, 'hostname' => 'PC-001'],
                ['id' => 2, 'hostname' => 'PC-002'],
            ]
        ]);
    }
}
