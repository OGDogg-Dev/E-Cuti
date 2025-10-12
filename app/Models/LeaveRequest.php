<?php

namespace App\Models;

use App\Enums\LeaveRequestStatus;
use App\Enums\SignatureStatus;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Casts\AsArrayObject;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Carbon;

class LeaveRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'division_id',
        'leave_type_id',
        'start_date',
        'end_date',
        'duration',
        'reason',
        'metadata',
        'status',
        'document_number',
        'qr_hash',
        'signature_status',
        'submitted_at',
        'finalized_at',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'metadata' => AsArrayObject::class,
        'duration' => 'float',
        'status' => LeaveRequestStatus::class,
        'signature_status' => SignatureStatus::class,
        'submitted_at' => 'datetime',
        'finalized_at' => 'datetime',
    ];

    protected $appends = [
        'is_pending',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(LeaveAttachment::class);
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(LeaveRequestApproval::class);
    }

    public function auditLogs(): MorphMany
    {
        return $this->morphMany(AuditLog::class, 'auditable');
    }

    protected function isPending(): Attribute
    {
        return Attribute::get(fn (): bool => $this->status === LeaveRequestStatus::SUBMITTED
            || str_starts_with($this->status->value, 'WAITING_APPROVAL'));
    }

    public function durationInDays(): float
    {
        return (float) $this->duration;
    }

    public function submittedOn(): ?Carbon
    {
        return $this->submitted_at;
    }
}
