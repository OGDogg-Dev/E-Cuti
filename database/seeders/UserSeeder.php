<?php

namespace Database\Seeders;

use App\Models\Division;
use App\Models\LeaveBalance;
use App\Models\LeaveType;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $divisions = Division::pluck('id', 'code');
        $roles = Role::pluck('id', 'name');
        $leaveTypes = LeaveType::pluck('id', 'code');
        $currentYear = Carbon::now()->year;

        $sharedQuotaAnchorCode = 'AL';

        $users = [
            [
                'name' => 'Raka Aditya',
                'email' => 'admin@ecuti.test',
                'employee_number' => 'EMP-0001',
                'division' => 'SDM',
                'password' => 'password',
                'roles' => ['admin', 'sdm'],
                'balance_overrides' => [
                    'AL' => ['used_balance' => 2, 'carry_over_balance' => 2, 'carry_over_expires_at' => Carbon::create($currentYear, 3, 31)],
                    'SL' => ['used_balance' => 1],
                ],
            ],
            [
                'name' => 'Dewi Maharani',
                'email' => 'dewi@ecuti.test',
                'employee_number' => 'EMP-0112',
                'division' => 'OPS',
                'password' => 'password',
                'roles' => ['kepala_kantor'],
                'balance_overrides' => [
                    'AL' => ['used_balance' => 4, 'carry_over_balance' => 1, 'carry_over_expires_at' => Carbon::create($currentYear, 4, 30)],
                    'SL' => ['used_balance' => 1],
                ],
            ],
            [
                'name' => 'Farhan Pratama',
                'email' => 'farhan@ecuti.test',
                'employee_number' => 'EMP-0234',
                'division' => 'ITS',
                'password' => 'password',
                'roles' => ['pegawai'],
                'balance_overrides' => [
                    'AL' => ['used_balance' => 5, 'carry_over_balance' => 1, 'carry_over_expires_at' => Carbon::create($currentYear, 3, 31)],
                    'UP' => ['used_balance' => 1],
                ],
            ],
            [
                'name' => 'Siti Rahma',
                'email' => 'siti@ecuti.test',
                'employee_number' => 'EMP-0321',
                'division' => 'SDM',
                'password' => 'password',
                'roles' => ['pegawai'],
                'balance_overrides' => [
                    'AL' => ['used_balance' => 3, 'carry_over_balance' => 1, 'carry_over_expires_at' => Carbon::create($currentYear, 4, 30)],
                    'SL' => ['used_balance' => 0],
                    'MT' => ['used_balance' => 0],
                    'UP' => ['used_balance' => 0],
                ],
            ],
        ];

        foreach ($users as $userData) {
            $divisionId = $userData['division'] ? ($divisions[$userData['division']] ?? null) : null;

            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'employee_number' => $userData['employee_number'],
                    'division_id' => $divisionId,
                    'password' => Hash::make($userData['password']),
                    'email_verified_at' => Carbon::now(),
                ],
            );

            $roleIds = collect($userData['roles'])
                ->map(fn (string $roleName) => $roles[$roleName] ?? null)
                ->filter()
                ->values()
                ->all();

            $user->roles()->sync($roleIds);

            foreach ($leaveTypes as $code => $leaveTypeId) {
                $overrides = $userData['balance_overrides'][$code] ?? [];

                $carryOverExpiry = $overrides['carry_over_expires_at'] ?? ($code === $sharedQuotaAnchorCode
                    ? Carbon::create($currentYear, 3, 31)
                    : null);

                $openingBalance = $overrides['opening_balance'] ?? ($code === $sharedQuotaAnchorCode ? 12 : 0);
                $carryOverBalance = $overrides['carry_over_balance'] ?? 0;

                LeaveBalance::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'leave_type_id' => $leaveTypeId,
                        'year' => $currentYear,
                    ],
                    [
                        'opening_balance' => $openingBalance,
                        'carry_over_balance' => $carryOverBalance,
                        'used_balance' => $overrides['used_balance'] ?? 0,
                        'adjusted_balance' => $overrides['adjusted_balance'] ?? 0,
                        'carry_over_expires_at' => $carryOverExpiry,
                        'audit_trail' => [
                            'seeded_at' => Carbon::now()->toDateTimeString(),
                            'notes' => $code === $sharedQuotaAnchorCode
                                ? 'Saldo awal e-Cuti lintas jenis 12 hari'
                                : 'Menggunakan kuota cuti bersama lintas jenis',
                        ],
                    ],
                );
            }
        }
    }
}
