<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'name' => 'super_admin',
                'display_name' => 'Administrator Sistem',
                'description' => 'Mengatur konfigurasi global, pengelolaan data master, dan audit.',
            ],
            [
                'name' => 'hr_manager',
                'display_name' => 'SDM',
                'description' => 'Mengelola kebijakan cuti, SLA persetujuan, dan monitoring keseimbangan cuti.',
            ],
            [
                'name' => 'division_head',
                'display_name' => 'Kepala Divisi',
                'description' => 'Menyetujui permohonan cuti untuk anggota divisi dan memonitor kapasitas tim.',
            ],
            [
                'name' => 'employee',
                'display_name' => 'Karyawan',
                'description' => 'Mengajukan permohonan cuti dan memantau status persetujuan.',
            ],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(
                ['name' => $role['name']],
                [
                    'display_name' => $role['display_name'],
                    'description' => $role['description'],
                ],
            );
        }
    }
}
