<?php

namespace Database\Seeders;

use App\Models\LeaveType;
use Illuminate\Database\Seeder;

class LeaveTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            [
                'code' => 'AL',
                'name' => 'Cuti Tahunan',
                'requires_document' => false,
                'allow_half_day' => true,
                'allow_carry_over' => true,
            ],
            [
                'code' => 'SL',
                'name' => 'Cuti Sakit',
                'requires_document' => true,
                'allow_half_day' => false,
                'allow_carry_over' => false,
            ],
            [
                'code' => 'MT',
                'name' => 'Cuti Melahirkan',
                'requires_document' => true,
                'allow_half_day' => false,
                'allow_carry_over' => false,
            ],
            [
                'code' => 'UP',
                'name' => 'Cuti Alasan Penting',
                'requires_document' => true,
                'allow_half_day' => false,
                'allow_carry_over' => false,
            ],
        ];

        foreach ($types as $type) {
            LeaveType::updateOrCreate(
                ['code' => $type['code']],
                [
                    'name' => $type['name'],
                    'requires_document' => $type['requires_document'],
                    'default_quota_days' => 12,
                    'allow_half_day' => $type['allow_half_day'],
                    'allow_hourly' => false,
                    'allow_carry_over' => $type['allow_carry_over'],
                    'carry_over_expiry_months' => $type['allow_carry_over'] ? 3 : null,
                    'prorate_rules' => null,
                    'applicable_roles' => ['pegawai', 'sdm', 'kepala_kantor', 'admin'],
                ],
            );
        }
    }
}
