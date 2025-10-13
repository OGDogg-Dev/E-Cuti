<?php

use App\Enums\ApprovalFlowType;
use App\Enums\LeaveRequestStatus;
use App\Models\Division;
use App\Models\LeaveBalance;
use App\Models\LeavePolicy;
use App\Models\LeaveRequest;
use App\Models\LeaveRequestApproval;
use App\Models\LeaveType;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Carbon;

beforeEach(function () {
    Carbon::setTestNow(Carbon::create(2025, 1, 10, 8));
});

afterEach(function () {
    Carbon::setTestNow();
});

function createLeaveType(): LeaveType
{
    return LeaveType::query()->create([
        'code' => 'TAHUNAN',
        'name' => 'Cuti Tahunan',
        'requires_document' => false,
        'default_quota_days' => 12,
        'allow_half_day' => false,
        'allow_hourly' => false,
        'allow_carry_over' => true,
    ]);
}

function createDivision(string $code, string $name): Division
{
    return Division::query()->create([
        'code' => $code,
        'name' => $name,
    ]);
}

function createPolicy(LeaveType $leaveType, ?Division $division = null): LeavePolicy
{
    return LeavePolicy::query()->create([
        'leave_type_id' => $leaveType->id,
        'division_id' => $division?->id,
        'approval_matrix' => [
            ['stage' => 'KEPALA', 'role' => 'kepala_kantor'],
            ['stage' => 'SDM', 'role' => 'sdm'],
        ],
        'flow_type' => ApprovalFlowType::SERIAL,
    ]);
}

function createEmployeeUser(Division $division): User
{
    $role = Role::query()->firstOrCreate(
        ['name' => 'pegawai'],
        ['display_name' => 'Pegawai', 'description' => null]
    );

    /** @var User $user */
    $user = User::factory()->create([
        'division_id' => $division->id,
    ]);

    $user->roles()->sync([$role->id]);

    return $user;
}

function seedBalance(User $user, LeaveType $leaveType): void
{
    LeaveBalance::query()->create([
        'user_id' => $user->id,
        'leave_type_id' => $leaveType->id,
        'year' => (int) Carbon::now()->year,
        'opening_balance' => 12,
        'carry_over_balance' => 0,
        'used_balance' => 0,
        'adjusted_balance' => 0,
    ]);
}

function leavePayload(LeaveType $leaveType, LeavePolicy $policy, array $overrides = []): array
{
    $defaults = [
        'leave_type_id' => $leaveType->id,
        'policy_id' => $policy->id,
        'start_date' => Carbon::now()->toDateString(),
        'end_date' => Carbon::now()->addDays(2)->toDateString(),
        'reason' => 'Pengajuan cuti untuk pengujian.',
    ];

    return array_merge($defaults, $overrides);
}

test('pegawai cannot submit leave with a policy outside their division', function () {
    $divisionA = createDivision('SDM', 'SDM');
    $divisionB = createDivision('KEUANGAN', 'Keuangan');
    $leaveType = createLeaveType();

    $foreignPolicy = createPolicy($leaveType, $divisionB);
    $validPolicy = createPolicy($leaveType, $divisionA);

    $user = createEmployeeUser($divisionA);
    seedBalance($user, $leaveType);

    $this->actingAs($user, 'sanctum');

    $response = $this->postJson('/api/leave-requests', leavePayload($leaveType, $foreignPolicy));

    $response->assertStatus(422)->assertJsonValidationErrors('policy_id');

    expect(LeaveRequestApproval::count())->toBe(0);

    // Ensure a valid submission still works afterwards.
    $secondResponse = $this->postJson('/api/leave-requests', leavePayload($leaveType, $validPolicy));
    $secondResponse->assertCreated();
});

test('serial workflows honour the first stage when seeding approvals', function () {
    $division = createDivision('SDM', 'SDM');
    $leaveType = createLeaveType();
    $policy = createPolicy($leaveType, $division);

    $user = createEmployeeUser($division);
    seedBalance($user, $leaveType);

    $this->actingAs($user, 'sanctum');

    $response = $this->postJson('/api/leave-requests', leavePayload($leaveType, $policy));

    $response->assertCreated();

    $request = $user->leaveRequests()->latest()->first();
    expect($request)->not->toBeNull();
    expect($request->status)->toBe(LeaveRequestStatus::WAITING_APPROVAL_KEPALA);

    $stages = LeaveRequestApproval::query()
        ->where('leave_request_id', $request->id)
        ->pluck('stage');

    expect($stages)->toHaveCount(2)
        ->and($stages->all())->toBe(['KEPALA', 'SDM']);
});

test('threshold evaluation counts the candidate submission against minimum presence', function () {
    $division = createDivision('KEUANGAN', 'Keuangan');
    $leaveType = createLeaveType();

    LeavePolicy::query()->create([
        'leave_type_id' => $leaveType->id,
        'division_id' => $division->id,
        'approval_matrix' => [
            ['stage' => 'KEPALA', 'role' => 'kepala_kantor'],
        ],
        'threshold_rules' => [[
            'min_presence' => 0.5,
            'window' => [
                'start' => Carbon::now()->toDateString(),
                'end' => Carbon::now()->addDays(1)->toDateString(),
            ],
        ]],
        'flow_type' => ApprovalFlowType::SERIAL,
    ]);

    $firstEmployee = createEmployeeUser($division);
    $secondEmployee = createEmployeeUser($division);

    LeaveRequest::query()->create([
        'user_id' => $secondEmployee->id,
        'division_id' => $division->id,
        'leave_type_id' => $leaveType->id,
        'start_date' => Carbon::now()->toDateString(),
        'end_date' => Carbon::now()->addDays(1)->toDateString(),
        'duration' => 2,
        'reason' => 'Sudah mengambil cuti',
        'status' => LeaveRequestStatus::WAITING_APPROVAL_KEPALA,
    ]);

    $candidate = LeaveRequest::make([
        'user_id' => $firstEmployee->id,
        'division_id' => $division->id,
        'leave_type_id' => $leaveType->id,
        'start_date' => Carbon::now()->toDateString(),
        'end_date' => Carbon::now()->addDays(1)->toDateString(),
        'duration' => 2,
        'reason' => 'Pengajuan baru',
        'status' => LeaveRequestStatus::DRAFT,
    ]);

    $evaluator = app(\App\Services\Leave\ThresholdEvaluator::class);

    $ratio = $evaluator->calculatePresenceRatio($candidate, [
        'start' => Carbon::now()->toDateString(),
        'end' => Carbon::now()->addDays(1)->toDateString(),
    ]);

    expect($ratio)->toBe(0.0);
    expect($evaluator->violatesThreshold($candidate))->toBeTrue();
});
