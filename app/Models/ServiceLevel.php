<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceLevel extends Model
{
    use HasFactory;

    protected $fillable = [
        'leave_policy_id',
        'stage',
        'response_time_hours',
        'escalation_time_hours',
        'escalate_to_role_id',
    ];

    public function policy(): BelongsTo
    {
        return $this->belongsTo(LeavePolicy::class, 'leave_policy_id');
    }

    public function escalateToRole(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'escalate_to_role_id');
    }
}
