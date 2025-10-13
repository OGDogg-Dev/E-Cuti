<?php

namespace Database\Seeders;

use App\Enums\LeaveRequestStatus;
use App\Enums\SignatureStatus;
use App\Models\Division;
use App\Models\LeaveRequest;
use App\Models\LeaveRequestApproval;
use App\Models\LeaveType;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class LeaveRequestSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::whereIn('email', [
            'admin@ecuti.test',
            'dewi@ecuti.test',
            'farhan@ecuti.test',
            'siti@ecuti.test',
        ])->get()->keyBy('email');

        $leaveTypes = LeaveType::pluck('id', 'code');
        $divisions = Division::pluck('id', 'code');

        $requests = [
            [
                'employee' => 'farhan@ecuti.test',
                'leave_type' => 'AL',
                'division' => 'ITS',
                'start_date' => Carbon::parse('2025-06-17'),
                'end_date' => Carbon::parse('2025-06-19'),
                'duration' => 3,
                'reason' => 'Liburan keluarga ke Yogyakarta dan serah terima tugas ke tim piket.',
                'metadata' => [
                    'email' => 'farhan@ecuti.test',
                    'employee_type' => 'ASN',
                    'full_name' => 'Farhan Pratama',
                    'nip' => '198903112020011003',
                    'position' => 'Analis Infrastruktur TI',
                    'address_during_leave' => 'Jl. Cendana No. 12, Sleman, DIY',
                    'contact_phone' => '0812-1111-2233',
                    'handover' => 'Shift malam di-cover oleh tim NOC',
                    'submitted_via' => 'portal',
                ],
                'status' => LeaveRequestStatus::FINALIZED,
                'document_number' => 'EC-AL-2025-0001',
                'signature_status' => SignatureStatus::SIGNED,
                'submitted_at' => Carbon::now()->subDays(20),
                'finalized_at' => Carbon::now()->subDays(15),
                'approvals' => [
                    [
                        'approver' => 'admin@ecuti.test',
                        'stage' => 'Validasi SDM',
                        'assigned_at' => Carbon::now()->subDays(20)->addHours(1),
                        'acted_at' => Carbon::now()->subDays(19)->addHours(2),
                        'action' => 'APPROVED',
                        'notes' => 'Saldo cuti lintas jenis masih tersisa 7 hari.',
                        'sla_snapshot' => [
                            'response_hours' => 24,
                            'escalation_hours' => 36,
                        ],
                    ],
                    [
                        'approver' => 'dewi@ecuti.test',
                        'stage' => 'Persetujuan Kepala Kantor',
                        'assigned_at' => Carbon::now()->subDays(19)->addHours(3),
                        'acted_at' => Carbon::now()->subDays(18)->addHours(6),
                        'action' => 'APPROVED',
                        'notes' => 'Backup sudah siap dan tidak melewati kuota.',
                        'sla_snapshot' => [
                            'response_hours' => 24,
                            'escalation_hours' => 48,
                        ],
                    ],
                ],
            ],
            [
                'employee' => 'siti@ecuti.test',
                'leave_type' => 'SL',
                'division' => 'SDM',
                'start_date' => Carbon::parse('2025-05-12'),
                'end_date' => Carbon::parse('2025-05-13'),
                'duration' => 2,
                'reason' => 'Pemulihan pasca tindakan medis dengan lampiran surat dokter.',
                'metadata' => [
                    'email' => 'siti@ecuti.test',
                    'employee_type' => 'PPNPN',
                    'full_name' => 'Siti Rahma',
                    'nip' => 'PPNPN-0321',
                    'position' => 'Staf Administrasi SDM',
                    'address_during_leave' => 'Jl. Melati No. 8, Jakarta Selatan',
                    'contact_phone' => '0813-4444-5566',
                    'medical_document' => 'Surat dokter RS Sentosa',
                    'submitted_via' => 'mobile',
                ],
                'status' => LeaveRequestStatus::WAITING_APPROVAL_BOTH,
                'document_number' => 'EC-SL-2025-0003',
                'signature_status' => SignatureStatus::PENDING,
                'submitted_at' => Carbon::now()->subDays(5),
                'finalized_at' => null,
                'approvals' => [
                    [
                        'approver' => 'admin@ecuti.test',
                        'stage' => 'Validasi SDM',
                        'assigned_at' => Carbon::now()->subDays(5)->addHours(1),
                        'acted_at' => null,
                        'action' => null,
                        'notes' => null,
                        'sla_snapshot' => [
                            'response_hours' => 12,
                            'escalation_hours' => 24,
                        ],
                    ],
                    [
                        'approver' => 'dewi@ecuti.test',
                        'stage' => 'Persetujuan Kepala Kantor',
                        'assigned_at' => Carbon::now()->subDays(5)->addMinutes(15),
                        'acted_at' => Carbon::now()->subDays(4)->addHours(2),
                        'action' => 'APPROVED',
                        'notes' => 'Disetujui, operasional tetap terjaga.',
                        'sla_snapshot' => [
                            'response_hours' => 12,
                            'escalation_hours' => 24,
                        ],
                    ],
                ],
            ],
        ];

        foreach ($requests as $requestData) {
            $employee = $users[$requestData['employee']] ?? null;
            if (! $employee) {
                continue;
            }

            $leaveTypeId = $leaveTypes[$requestData['leave_type']] ?? null;
            $divisionId = $requestData['division'] ? ($divisions[$requestData['division']] ?? null) : null;

            if (! $leaveTypeId) {
                continue;
            }

            $request = LeaveRequest::updateOrCreate(
                [
                    'document_number' => $requestData['document_number'],
                ],
                [
                    'user_id' => $employee->id,
                    'division_id' => $divisionId,
                    'leave_type_id' => $leaveTypeId,
                    'start_date' => $requestData['start_date'],
                    'end_date' => $requestData['end_date'],
                    'duration' => $requestData['duration'],
                    'reason' => $requestData['reason'],
                    'metadata' => $requestData['metadata'],
                    'status' => $requestData['status'],
                    'qr_hash' => hash('sha256', $requestData['document_number'].$employee->email),
                    'signature_status' => $requestData['signature_status'],
                    'submitted_at' => $requestData['submitted_at'],
                    'finalized_at' => $requestData['finalized_at'],
                ],
            );

            $request->approvals()->delete();

            foreach ($requestData['approvals'] as $approval) {
                $approver = $users[$approval['approver']] ?? null;
                if (! $approver) {
                    continue;
                }

                LeaveRequestApproval::create([
                    'leave_request_id' => $request->id,
                    'approver_id' => $approver->id,
                    'stage' => $approval['stage'],
                    'assigned_at' => $approval['assigned_at'],
                    'acted_at' => $approval['acted_at'],
                    'action' => $approval['action'],
                    'notes' => $approval['notes'],
                    'sla_snapshot' => $approval['sla_snapshot'],
                ]);
            }
        }
    }
}
