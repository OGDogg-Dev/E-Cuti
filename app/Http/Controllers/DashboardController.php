<?php

namespace App\Http\Controllers;

use App\Services\Dashboard\DashboardService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function __construct(private readonly DashboardService $dashboardService)
    {
    }

    public function leadership(): array
    {
        return [
            'heatmap' => $this->dashboardService->organizationHeatmap(),
            'sla' => $this->dashboardService->slaPerformance(),
            'balance_summary' => $this->dashboardService->balanceSummary(),
        ];
    }

    public function division(Request $request)
    {
        $divisionId = $request->integer('division_id') ?? Auth::user()?->division_id;

        return $this->dashboardService->divisionStaffingOverview($divisionId);
    }
}
