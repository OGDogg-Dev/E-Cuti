<?php

namespace Database\Seeders;

use App\Enums\ApprovalFlowType;
use App\Models\Division;
use App\Models\LeavePolicy;
use App\Models\LeaveType;
use App\Models\Role;
use App\Models\ServiceLevel;
use Illuminate\Database\Seeder;

class LeavePolicySeeder extends Seeder
{
    public function run(): void
    {
        $roles = Role::pluck('id', 'name');
        $divisions = Division::pluck('id', 'code');
        $leaveTypes = LeaveType::pluck('id', 'code');

        $policies = [
            [
                'leave_type' => 'AL',
                'division' => null,
                'flow_type' => ApprovalFlowType::SERIAL,
                'approval_matrix' => [
                    [
                        'stage' => 'Verifikasi Kepala Divisi',
                        'role' => 'division_head',
                        'fallback_role' => 'hr_manager',
                        'action' => 'APPROVAL',
                    ],
                    [
                        'stage' => 'Validasi SDM',
                        'role' => 'hr_manager',
                        'fallback_role' => 'super_admin',
                        'action' => 'FINAL_APPROVAL',
                    ],
                ],
                'sla_rules' => [
                    [
                        'stage' => 'Verifikasi Kepala Divisi',
                        'response_hours' => 24,
                        'escalation_hours' => 48,
                    ],
                    [
                        'stage' => 'Validasi SDM',
                        'response_hours' => 24,
                        'escalation_hours' => 36,
                    ],
                ],
                'threshold_rules' => [
                    'maxConcurrentPercentage' => 0.3,
                    'minNoticeDays' => 3,
                    'respectBlackout' => true,
                ],
                'blackout_rules' => [
                    'appliesTo' => 'all',
                    'allowOverride' => false,
                ],
                'additional_constraints' => [
                    'requiresBackupPlan' => true,
                    'autoAssignDelegate' => true,
                ],
                'service_levels' => [
                    [
                        'stage' => 'Verifikasi Kepala Divisi',
                        'response_time_hours' => 24,
                        'escalation_time_hours' => 48,
                        'escalate_to_role' => 'hr_manager',
                    ],
                    [
                        'stage' => 'Validasi SDM',
                        'response_time_hours' => 24,
                        'escalation_time_hours' => 36,
                        'escalate_to_role' => 'super_admin',
                    ],
                ],
            ],
            [
                'leave_type' => 'SL',
                'division' => null,
                'flow_type' => ApprovalFlowType::PARALLEL_AND,
                'approval_matrix' => [
                    [
                        'stage' => 'Review Kepala Divisi',
                        'role' => 'division_head',
                        'fallback_role' => null,
                        'action' => 'VALIDATE',
                    ],
                    [
                        'stage' => 'Review SDM',
                        'role' => 'hr_manager',
                        'fallback_role' => null,
                        'action' => 'VALIDATE',
                    ],
                ],
                'sla_rules' => [
                    [
                        'stage' => 'Review Kepala Divisi',
                        'response_hours' => 12,
                        'escalation_hours' => 24,
                    ],
                    [
                        'stage' => 'Review SDM',
                        'response_hours' => 12,
                        'escalation_hours' => 24,
                    ],
                ],
                'threshold_rules' => [
                    'requiresMedicalDocument' => true,
                    'backdateLimitDays' => 3,
                ],
                'blackout_rules' => [
                    'appliesTo' => 'none',
                ],
                'additional_constraints' => [
                    'autoApproveUnderTwoDays' => false,
                ],
                'service_levels' => [
                    [
                        'stage' => 'Review Kepala Divisi',
                        'response_time_hours' => 12,
                        'escalation_time_hours' => 24,
                        'escalate_to_role' => 'hr_manager',
                    ],
                    [
                        'stage' => 'Review SDM',
                        'response_time_hours' => 12,
                        'escalation_time_hours' => 24,
                        'escalate_to_role' => 'super_admin',
                    ],
                ],
            ],
            [
                'leave_type' => 'UP',
                'division' => 'OPS',
                'flow_type' => ApprovalFlowType::SERIAL,
                'approval_matrix' => [
                    [
                        'stage' => 'Kepala Operasional',
                        'role' => 'division_head',
                        'fallback_role' => 'hr_manager',
                        'action' => 'REVIEW',
                    ],
                    [
                        'stage' => 'SDM',
                        'role' => 'hr_manager',
                        'fallback_role' => 'super_admin',
                        'action' => 'APPROVAL',
                    ],
                    [
                        'stage' => 'Direktur',
                        'role' => 'super_admin',
                        'fallback_role' => null,
                        'action' => 'FINAL_APPROVAL',
                    ],
                ],
                'sla_rules' => [
                    [
                        'stage' => 'Kepala Operasional',
                        'response_hours' => 24,
                        'escalation_hours' => 48,
                    ],
                    [
                        'stage' => 'SDM',
                        'response_hours' => 24,
                        'escalation_hours' => 48,
                    ],
                    [
                        'stage' => 'Direktur',
                        'response_hours' => 24,
                        'escalation_hours' => null,
                    ],
                ],
                'threshold_rules' => [
                    'maxDurationDays' => 30,
                    'requiresSuccessionPlan' => true,
                    'minNoticeDays' => 10,
                ],
                'blackout_rules' => [
                    'appliesTo' => ['Lebaran', 'Audit Tahunan'],
                    'allowOverride' => true,
                ],
                'additional_constraints' => [
                    'requiresDirectorMemo' => true,
                ],
                'service_levels' => [
                    [
                        'stage' => 'Kepala Operasional',
                        'response_time_hours' => 24,
                        'escalation_time_hours' => 48,
                        'escalate_to_role' => 'hr_manager',
                    ],
                    [
                        'stage' => 'SDM',
                        'response_time_hours' => 24,
                        'escalation_time_hours' => 48,
                        'escalate_to_role' => 'super_admin',
                    ],
                    [
                        'stage' => 'Direktur',
                        'response_time_hours' => 24,
                        'escalation_time_hours' => null,
                        'escalate_to_role' => null,
                    ],
                ],
            ],
        ];

        foreach ($policies as $policyData) {
            $leaveTypeId = $leaveTypes[$policyData['leave_type']] ?? null;
            if (! $leaveTypeId) {
                continue;
            }

            $divisionId = $policyData['division'] ? ($divisions[$policyData['division']] ?? null) : null;

            $policy = LeavePolicy::updateOrCreate(
                [
                    'leave_type_id' => $leaveTypeId,
                    'division_id' => $divisionId,
                ],
                [
                    'flow_type' => $policyData['flow_type'],
                    'approval_matrix' => $policyData['approval_matrix'],
                    'sla_rules' => $policyData['sla_rules'],
                    'threshold_rules' => $policyData['threshold_rules'],
                    'blackout_rules' => $policyData['blackout_rules'],
                    'additional_constraints' => $policyData['additional_constraints'],
                ],
            );

            foreach ($policyData['service_levels'] as $serviceLevel) {
                $escalateToRoleId = $serviceLevel['escalate_to_role']
                    ? ($roles[$serviceLevel['escalate_to_role']] ?? null)
                    : null;

                ServiceLevel::updateOrCreate(
                    [
                        'leave_policy_id' => $policy->id,
                        'stage' => $serviceLevel['stage'],
                    ],
                    [
                        'response_time_hours' => $serviceLevel['response_time_hours'],
                        'escalation_time_hours' => $serviceLevel['escalation_time_hours'],
                        'escalate_to_role_id' => $escalateToRoleId,
                    ],
                );
            }
        }
    }
}
