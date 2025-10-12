<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\AsArrayObject;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LeaveType extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'requires_document',
        'default_quota_days',
        'allow_half_day',
        'allow_hourly',
        'allow_carry_over',
        'carry_over_expiry_months',
        'prorate_rules',
        'applicable_roles',
    ];

    protected $casts = [
        'requires_document' => 'bool',
        'allow_half_day' => 'bool',
        'allow_hourly' => 'bool',
        'allow_carry_over' => 'bool',
        'prorate_rules' => AsArrayObject::class,
        'applicable_roles' => AsArrayObject::class,
    ];

    public function policies(): HasMany
    {
        return $this->hasMany(LeavePolicy::class);
    }

    public function balances(): HasMany
    {
        return $this->hasMany(LeaveBalance::class);
    }

    public function requests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }
}
