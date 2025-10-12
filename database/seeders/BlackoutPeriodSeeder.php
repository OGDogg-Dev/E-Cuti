<?php

namespace Database\Seeders;

use App\Models\BlackoutPeriod;
use App\Models\Division;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class BlackoutPeriodSeeder extends Seeder
{
    public function run(): void
    {
        $divisions = Division::pluck('id', 'code');

        $periods = [
            [
                'division' => null,
                'start_date' => '2025-04-25',
                'end_date' => '2025-05-05',
                'reason' => 'Fokus layanan Lebaran dan arus mudik',
                'is_global' => true,
            ],
            [
                'division' => 'OPS',
                'start_date' => '2025-12-01',
                'end_date' => '2025-12-31',
                'reason' => 'Inventarisasi akhir tahun dan audit operasional',
                'is_global' => false,
            ],
            [
                'division' => 'ITS',
                'start_date' => '2025-08-10',
                'end_date' => '2025-08-20',
                'reason' => 'Cut-over data center dan upgrade jaringan',
                'is_global' => false,
            ],
        ];

        foreach ($periods as $period) {
            $divisionId = $period['division'] ? ($divisions[$period['division']] ?? null) : null;

            BlackoutPeriod::updateOrCreate(
                [
                    'division_id' => $divisionId,
                    'start_date' => Carbon::parse($period['start_date'])->toDateString(),
                    'end_date' => Carbon::parse($period['end_date'])->toDateString(),
                ],
                [
                    'reason' => $period['reason'],
                    'is_global' => $period['is_global'],
                ],
            );
        }
    }
}
