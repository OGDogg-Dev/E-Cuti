<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\AsArrayObject;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveRequestApproval extends Model
{
    use HasFactory;

    protected $fillable = [
        'leave_request_id',
        'approver_id',
        'delegated_from_id',
        'stage',
        'assigned_at',
        'acted_at',
        'action',
        'notes',
        'sla_snapshot',
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
        'acted_at' => 'datetime',
        'sla_snapshot' => AsArrayObject::class,
    ];

    public function leaveRequest(): BelongsTo
    {
        return $this->belongsTo(LeaveRequest::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }

    public function delegatedFrom(): BelongsTo
    {
        return $this->belongsTo(User::class, 'delegated_from_id');
    }
}
