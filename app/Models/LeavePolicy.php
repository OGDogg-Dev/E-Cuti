<?php

namespace App\Models;

use App\Enums\ApprovalFlowType;
use Illuminate\Database\Eloquent\Casts\AsArrayObject;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LeavePolicy extends Model
{
    use HasFactory;

    protected $fillable = [
        'leave_type_id',
        'division_id',
        'approval_matrix',
        'sla_rules',
        'threshold_rules',
        'blackout_rules',
        'additional_constraints',
        'flow_type',
    ];

    protected $casts = [
        'approval_matrix' => AsArrayObject::class,
        'sla_rules' => AsArrayObject::class,
        'threshold_rules' => AsArrayObject::class,
        'blackout_rules' => AsArrayObject::class,
        'additional_constraints' => AsArrayObject::class,
        'flow_type' => ApprovalFlowType::class,
    ];

    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class);
    }

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    public function serviceLevels(): HasMany
    {
        return $this->hasMany(ServiceLevel::class);
    }

    public function allowsSharedQuota(): bool
    {
        return (bool) data_get($this->threshold_rules, 'quotaSharedAcrossTypes')
            || (bool) data_get($this->additional_constraints, 'allowQuotaSharingAcrossTypes');
    }
}
