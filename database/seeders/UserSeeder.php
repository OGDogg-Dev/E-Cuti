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

        $users = [
            [
                'name' => 'Raka Aditya',
                'email' => 'admin@ecuti.test',
                'employee_number' => 'EMP-0001',
                'division' => 'SDM',
                'password' => 'password',
                'roles' => ['admin', 'sdm'],
                'balances' => [
                    [
                        'leave_type' => 'AL',
                        'opening_balance' => 14,
                        'carry_over_balance' => 3,
                        'used_balance' => 2,
                        'adjusted_balance' => 0,
                        'carry_over_expires_at' => Carbon::create($currentYear, 3, 31),
                    ],
                ],
            ],
            [
                'name' => 'Dewi Maharani',
                'email' => 'dewi@ecuti.test',
                'employee_number' => 'EMP-0112',
                'division' => 'OPS',
                'password' => 'password',
                'roles' => ['kepala_kantor'],
                'balances' => [
                    [
                        'leave_type' => 'AL',
                        'opening_balance' => 12,
                        'carry_over_balance' => 1.5,
                        'used_balance' => 4,
                        'adjusted_balance' => 0,
                        'carry_over_expires_at' => Carbon::create($currentYear, 4, 30),
                    ],
                    [
                        'leave_type' => 'SL',
                        'opening_balance' => 14,
                        'carry_over_balance' => 0,
                        'used_balance' => 1,
                        'adjusted_balance' => 0,
                        'carry_over_expires_at' => null,
                    ],
                ],
            ],
            [
                'name' => 'Farhan Pratama',
                'email' => 'farhan@ecuti.test',
                'employee_number' => 'EMP-0234',
                'division' => 'ITS',
                'password' => 'password',
                'roles' => ['pegawai'],
                'balances' => [
                    [
                        'leave_type' => 'AL',
                        'opening_balance' => 12,
                        'carry_over_balance' => 2,
                        'used_balance' => 6,
                        'adjusted_balance' => 0,
                        'carry_over_expires_at' => Carbon::create($currentYear, 3, 31),
                    ],
                    [
                        'leave_type' => 'SL',
                        'opening_balance' => 14,
                        'carry_over_balance' => 0,
                        'used_balance' => 2,
                        'adjusted_balance' => 0,
                        'carry_over_expires_at' => null,
                    ],
                ],
            ],
            [
                'name' => 'Siti Rahma',
                'email' => 'siti@ecuti.test',
                'employee_number' => 'EMP-0321',
                'division' => 'SDM',
                'password' => 'password',
                'roles' => ['pegawai'],
                'balances' => [
                    [
                        'leave_type' => 'AL',
                        'opening_balance' => 12,
                        'carry_over_balance' => 1,
                        'used_balance' => 3,
                        'adjusted_balance' => 0,
                        'carry_over_expires_at' => Carbon::create($currentYear, 4, 30),
                    ],
                    [
                        'leave_type' => 'SL',
                        'opening_balance' => 14,
                        'carry_over_balance' => 0,
                        'used_balance' => 0,
                        'adjusted_balance' => 0,
                        'carry_over_expires_at' => null,
                    ],
                    [
                        'leave_type' => 'UP',
                        'opening_balance' => 0,
                        'carry_over_balance' => 0,
                        'used_balance' => 0,
                        'adjusted_balance' => 0,
                        'carry_over_expires_at' => null,
                    ],
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

            foreach ($userData['balances'] as $balance) {
                $leaveTypeId = $leaveTypes[$balance['leave_type']] ?? null;
                if (! $leaveTypeId) {
                    continue;
                }

                LeaveBalance::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'leave_type_id' => $leaveTypeId,
                        'year' => $currentYear,
                    ],
                    [
                        'opening_balance' => $balance['opening_balance'],
                        'carry_over_balance' => $balance['carry_over_balance'],
                        'used_balance' => $balance['used_balance'],
                        'adjusted_balance' => $balance['adjusted_balance'],
                        'carry_over_expires_at' => $balance['carry_over_expires_at'],
                        'audit_trail' => [
                            'seeded_at' => Carbon::now()->toDateTimeString(),
                            'notes' => 'Data awal sistem e-Cuti',
                        ],
                    ],
                );
            }
        }
    }
}
