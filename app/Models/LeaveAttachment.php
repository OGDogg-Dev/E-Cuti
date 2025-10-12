<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'leave_request_id',
        'filename',
        'mime_type',
        'size',
        'storage_path',
    ];

    public function leaveRequest(): BelongsTo
    {
        return $this->belongsTo(LeaveRequest::class);
    }
}
