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
                'default_quota_days' => 12,
                'allow_half_day' => true,
                'allow_hourly' => false,
                'allow_carry_over' => true,
                'carry_over_expiry_months' => 3,
                'prorate_rules' => [
                    'probation' => 0.5,
                    'lessThanSixMonths' => 0.5,
                    'sixToTwelveMonths' => 1.0,
                ],
                'applicable_roles' => ['employee', 'division_head'],
            ],
            [
                'code' => 'SL',
                'name' => 'Cuti Sakit',
                'requires_document' => true,
                'default_quota_days' => 14,
                'allow_half_day' => false,
                'allow_hourly' => false,
                'allow_carry_over' => false,
                'carry_over_expiry_months' => null,
                'prorate_rules' => null,
                'applicable_roles' => ['employee', 'division_head', 'hr_manager'],
            ],
            [
                'code' => 'MT',
                'name' => 'Cuti Melahirkan',
                'requires_document' => true,
                'default_quota_days' => 90,
                'allow_half_day' => false,
                'allow_hourly' => false,
                'allow_carry_over' => false,
                'carry_over_expiry_months' => null,
                'prorate_rules' => ['preLeaveBriefing' => true],
                'applicable_roles' => ['employee'],
            ],
            [
                'code' => 'UP',
                'name' => 'Cuti Tidak Dibayar',
                'requires_document' => false,
                'default_quota_days' => null,
                'allow_half_day' => true,
                'allow_hourly' => true,
                'allow_carry_over' => false,
                'carry_over_expiry_months' => null,
                'prorate_rules' => ['approvalThreshold' => 'director'],
                'applicable_roles' => ['employee', 'division_head'],
            ],
        ];

        foreach ($types as $type) {
            LeaveType::updateOrCreate(
                ['code' => $type['code']],
                [
                    'name' => $type['name'],
                    'requires_document' => $type['requires_document'],
                    'default_quota_days' => $type['default_quota_days'],
                    'allow_half_day' => $type['allow_half_day'],
                    'allow_hourly' => $type['allow_hourly'],
                    'allow_carry_over' => $type['allow_carry_over'],
                    'carry_over_expiry_months' => $type['carry_over_expiry_months'],
                    'prorate_rules' => $type['prorate_rules'],
                    'applicable_roles' => $type['applicable_roles'],
                ],
            );
        }
    }
}
