<?php

namespace Database\Seeders;

use App\Enums\ApprovalFlowType;
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
        $leaveTypes = LeaveType::all();

        foreach ($leaveTypes as $leaveType) {
            $policy = LeavePolicy::updateOrCreate(
                [
                    'leave_type_id' => $leaveType->id,
                    'division_id' => null,
                ],
                [
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
                        'maxDurationDays' => 12,
                        'quotaSharedAcrossTypes' => true,
                        'requiresDocument' => (bool) $leaveType->requires_document,
                    ],
                    'blackout_rules' => [
                        'appliesTo' => [],
                        'allowOverride' => false,
                    ],
                    'additional_constraints' => [
                        'allowQuotaSharingAcrossTypes' => true,
                        'respectSharedQuota' => true,
                    ],
                ],
            );

            $serviceLevels = [
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
            ];

            $policy->serviceLevels()
                ->whereNotIn('stage', collect($serviceLevels)->pluck('stage'))
                ->delete();

            foreach ($serviceLevels as $serviceLevel) {
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
