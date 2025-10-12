<?php

namespace App\Services\Leave;

use App\Models\BlackoutPeriod;
use App\Models\Holiday;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class WorkingDayCalculator
{
    /**
     * Calculate working day duration between two dates excluding weekends and configured holidays.
     */
    public function calculateDuration(Carbon $start, Carbon $end): float
    {
        if ($end->lessThan($start)) {
            return 0.0;
        }

        $holidays = Holiday::query()
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->pluck('date')
            ->map(fn ($date) => Carbon::parse($date)->toDateString())
            ->all();

        $workingDays = 0;
        $cursor = $start->copy();
        while ($cursor->lessThanOrEqualTo($end)) {
            if (! $this->isWeekend($cursor) && ! in_array($cursor->toDateString(), $holidays, true)) {
                $workingDays++;
            }
            $cursor->addDay();
        }

        return (float) $workingDays;
    }

    public function suggestAlternativeDates(Carbon $start, Carbon $end, callable $validator, int $maxIterations = 10): ?array
    {
        $candidateStart = $start->copy();
        $duration = $start->diffInDays($end);
        for ($i = 0; $i < $maxIterations; $i++) {
            $candidateEnd = $candidateStart->copy()->addDays($duration);
            if ($validator($candidateStart, $candidateEnd)) {
                return [$candidateStart, $candidateEnd];
            }
            $candidateStart->addDay();
        }

        return null;
    }

    public function blackoutConflicts(Carbon $start, Carbon $end, ?int $divisionId = null): Collection
    {
        return BlackoutPeriod::query()
            ->when($divisionId, function ($query) use ($divisionId) {
                $query->where(function ($inner) use ($divisionId) {
                    $inner->where('division_id', $divisionId)
                        ->orWhere('is_global', true);
                });
            }, fn ($query) => $query->where('is_global', true))
            ->where(function ($query) use ($start, $end) {
                $query->whereBetween('start_date', [$start, $end])
                    ->orWhereBetween('end_date', [$start, $end])
                    ->orWhere(function ($q) use ($start, $end) {
                        $q->where('start_date', '<=', $start)
                            ->where('end_date', '>=', $end);
                    });
            })
            ->get();
    }

    private function isWeekend(Carbon $date): bool
    {
        return $date->isSaturday() || $date->isSunday();
    }
}
