<?php

namespace Database\Seeders;

use App\Models\Division;
use Illuminate\Database\Seeder;

class DivisionSeeder extends Seeder
{
    public function run(): void
    {
        $divisions = [
            [
                'code' => 'SDM',
                'name' => 'Divisi SDM & Umum',
                'service_thresholds' => [
                    'maxConcurrentLeaves' => 0.35,
                    'minimumStaffingPercent' => 0.65,
                    'criticalRoles' => ['Payroll', 'Pengembangan Organisasi'],
                ],
                'on_call_rules' => [
                    'type' => 'rotation',
                    'rotationDays' => 7,
                    'notes' => 'Staf SDM siaga untuk permintaan mendadak selama musim puncak.',
                ],
            ],
            [
                'code' => 'OPS',
                'name' => 'Divisi Operasional',
                'service_thresholds' => [
                    'maxConcurrentLeaves' => 0.25,
                    'minimumStaffingPercent' => 0.75,
                    'criticalPeriods' => ['Ramadhan', 'Lebaran'],
                ],
                'on_call_rules' => [
                    'type' => 'escalation',
                    'escalateTo' => 'Koordinator Lapangan',
                    'notes' => 'Petugas lapangan wajib menyiapkan pengganti sebelum cuti.',
                ],
            ],
            [
                'code' => 'ITS',
                'name' => 'Divisi Teknologi Informasi',
                'service_thresholds' => [
                    'maxConcurrentLeaves' => 0.3,
                    'minimumStaffingPercent' => 0.6,
                    'systemGuardians' => ['Infra', 'Keamanan Informasi'],
                ],
                'on_call_rules' => [
                    'type' => 'follow-the-sun',
                    'handoverTime' => '09:00',
                    'notes' => 'Tim NOC mengambil alih dukungan saat permohonan cuti disetujui.',
                ],
            ],
        ];

        foreach ($divisions as $division) {
            Division::updateOrCreate(
                ['code' => $division['code']],
                [
                    'name' => $division['name'],
                    'service_thresholds' => $division['service_thresholds'],
                    'on_call_rules' => $division['on_call_rules'],
                ],
            );
        }
    }
}
