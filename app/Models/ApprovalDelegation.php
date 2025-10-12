<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\AsArrayObject;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApprovalDelegation extends Model
{
    use HasFactory;

    protected $fillable = [
        'approver_id',
        'delegate_id',
        'start_date',
        'end_date',
        'stages',
        'auto_assign',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'stages' => AsArrayObject::class,
        'auto_assign' => 'bool',
    ];

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }

    public function delegate(): BelongsTo
    {
        return $this->belongsTo(User::class, 'delegate_id');
    }
}
