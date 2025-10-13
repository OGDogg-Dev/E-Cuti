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
                        'stage' => 'Validasi SDM',
                        'role' => 'sdm',
                        'fallback_role' => 'admin',
                        'action' => 'APPROVAL',
                    ],
                    [
                        'stage' => 'Persetujuan Kepala Kantor',
                        'role' => 'kepala_kantor',
                        'fallback_role' => 'admin',
                        'action' => 'FINAL_APPROVAL',
                    ],
                ],
                'sla_rules' => [
                    [
                        'stage' => 'Validasi SDM',
                        'response_hours' => 24,
                        'escalation_hours' => 36,
                    ],
                    [
                        'stage' => 'Persetujuan Kepala Kantor',
                        'response_hours' => 24,
                        'escalation_hours' => 48,
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
                        'stage' => 'Validasi SDM',
                        'response_time_hours' => 24,
                        'escalation_time_hours' => 36,
                        'escalate_to_role' => 'kepala_kantor',
                    ],
                    [
                        'stage' => 'Persetujuan Kepala Kantor',
                        'response_time_hours' => 24,
                        'escalation_time_hours' => 48,
                        'escalate_to_role' => 'admin',
                    ],
                ],
            ],
            [
                'leave_type' => 'SL',
                'division' => null,
                'flow_type' => ApprovalFlowType::PARALLEL_AND,
                'approval_matrix' => [
                    [
                        'stage' => 'Validasi SDM',
                        'role' => 'sdm',
                        'fallback_role' => 'admin',
                        'action' => 'VALIDATE',
                    ],
                    [
                        'stage' => 'Persetujuan Kepala Kantor',
                        'role' => 'kepala_kantor',
                        'fallback_role' => null,
                        'action' => 'VALIDATE',
                    ],
                ],
                'sla_rules' => [
                    [
                        'stage' => 'Validasi SDM',
                        'response_hours' => 12,
                        'escalation_hours' => 24,
                    ],
                    [
                        'stage' => 'Persetujuan Kepala Kantor',
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
                        'stage' => 'Validasi SDM',
                        'response_time_hours' => 12,
                        'escalation_time_hours' => 24,
                        'escalate_to_role' => 'kepala_kantor',
                    ],
                    [
                        'stage' => 'Persetujuan Kepala Kantor',
                        'response_time_hours' => 12,
                        'escalation_time_hours' => 24,
                        'escalate_to_role' => 'admin',
                    ],
                ],
            ],
            [
                'leave_type' => 'UP',
                'division' => 'OPS',
                'flow_type' => ApprovalFlowType::SERIAL,
                'approval_matrix' => [
                    [
                        'stage' => 'Validasi SDM',
                        'role' => 'sdm',
                        'fallback_role' => 'admin',
                        'action' => 'REVIEW',
                    ],
                    [
                        'stage' => 'Persetujuan Kepala Kantor',
                        'role' => 'kepala_kantor',
                        'fallback_role' => 'admin',
                        'action' => 'FINAL_APPROVAL',
                    ],
                ],
                'sla_rules' => [
                    [
                        'stage' => 'Validasi SDM',
                        'response_hours' => 24,
                        'escalation_hours' => 48,
                    ],
                    [
                        'stage' => 'Persetujuan Kepala Kantor',
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
                        'stage' => 'Validasi SDM',
                        'response_time_hours' => 24,
                        'escalation_time_hours' => 48,
                        'escalate_to_role' => 'kepala_kantor',
                    ],
                    [
                        'stage' => 'Persetujuan Kepala Kantor',
                        'response_time_hours' => 24,
                        'escalation_time_hours' => null,
                        'escalate_to_role' => 'admin',
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
