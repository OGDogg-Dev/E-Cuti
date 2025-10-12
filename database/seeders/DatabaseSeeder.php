<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            DivisionSeeder::class,
            LeaveTypeSeeder::class,
            LeavePolicySeeder::class,
            HolidaySeeder::class,
            BlackoutPeriodSeeder::class,
            UserSeeder::class,
            LeaveRequestSeeder::class,
        ]);
    }
}
