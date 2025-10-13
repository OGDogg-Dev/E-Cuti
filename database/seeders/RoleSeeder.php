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
                'name' => 'admin',
                'display_name' => 'Administrator Sistem',
                'description' => 'Mengatur konfigurasi global, pengelolaan data master, dan audit.',
            ],
            [
                'name' => 'sdm',
                'display_name' => 'SDM',
                'description' => 'Mengelola kebijakan cuti, SLA persetujuan, dan monitoring keseimbangan cuti.',
            ],
            [
                'name' => 'kepala_kantor',
                'display_name' => 'Kepala Kantor',
                'description' => 'Menyetujui permohonan cuti dan menandatangani keputusan final bagi seluruh pegawai.',
            ],
            [
                'name' => 'pegawai',
                'display_name' => 'Pegawai',
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
