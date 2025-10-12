<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BlackoutPeriod extends Model
{
    use HasFactory;

    protected $fillable = [
        'division_id',
        'start_date',
        'end_date',
        'reason',
        'is_global',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_global' => 'bool',
    ];

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }
}
