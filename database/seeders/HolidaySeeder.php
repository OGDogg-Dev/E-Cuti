<?php

namespace Database\Seeders;

use App\Models\Holiday;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class HolidaySeeder extends Seeder
{
    public function run(): void
    {
        $holidays = [
            ['date' => '2025-01-01', 'name' => 'Tahun Baru 2025', 'is_collective_leave' => false],
            ['date' => '2025-03-31', 'name' => 'Nyepi', 'is_collective_leave' => false],
            ['date' => '2025-04-18', 'name' => 'Wafat Isa Almasih', 'is_collective_leave' => false],
            ['date' => '2025-04-29', 'name' => 'Idul Fitri 1446 H', 'is_collective_leave' => true],
            ['date' => '2025-04-30', 'name' => 'Cuti Bersama Idul Fitri', 'is_collective_leave' => true],
            ['date' => '2025-05-01', 'name' => 'Hari Buruh Internasional', 'is_collective_leave' => false],
            ['date' => '2025-05-29', 'name' => 'Kenaikan Isa Almasih', 'is_collective_leave' => false],
            ['date' => '2025-06-01', 'name' => 'Hari Lahir Pancasila', 'is_collective_leave' => false],
            ['date' => '2025-06-07', 'name' => 'Idul Adha 1446 H', 'is_collective_leave' => false],
            ['date' => '2025-08-17', 'name' => 'Hari Kemerdekaan', 'is_collective_leave' => false],
            ['date' => '2025-12-25', 'name' => 'Hari Natal', 'is_collective_leave' => false],
            ['date' => '2025-12-26', 'name' => 'Cuti Bersama Natal', 'is_collective_leave' => true],
        ];

        foreach ($holidays as $holiday) {
            Holiday::updateOrCreate(
                ['date' => Carbon::parse($holiday['date'])->toDateString()],
                [
                    'name' => $holiday['name'],
                    'is_collective_leave' => $holiday['is_collective_leave'],
                ],
            );
        }
    }
}
