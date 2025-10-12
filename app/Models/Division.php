<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\AsArrayObject;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Division extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'service_thresholds',
        'on_call_rules',
    ];

    protected $casts = [
        'service_thresholds' => AsArrayObject::class,
        'on_call_rules' => AsArrayObject::class,
    ];

    public function policies(): HasMany
    {
        return $this->hasMany(LeavePolicy::class);
    }

    public function blackoutPeriods(): HasMany
    {
        return $this->hasMany(BlackoutPeriod::class);
    }

    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }
}
