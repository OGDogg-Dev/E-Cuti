<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\AsArrayObject;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveBalance extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'leave_type_id',
        'year',
        'opening_balance',
        'carry_over_balance',
        'used_balance',
        'adjusted_balance',
        'carry_over_expires_at',
        'audit_trail',
    ];

    protected $casts = [
        'carry_over_expires_at' => 'datetime',
        'audit_trail' => AsArrayObject::class,
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class);
    }

    public function getRemainingBalanceAttribute(): float
    {
        return max(0, ($this->opening_balance + $this->carry_over_balance + $this->adjusted_balance) - $this->used_balance);
    }
}
