<?php

namespace App\Http\Resources\Leave;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\LeaveBalance */
class LeaveBalanceResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'year' => $this->year,
            'remaining' => $this->remaining_balance,
            'opening_balance' => $this->opening_balance,
            'carry_over_balance' => $this->carry_over_balance,
            'used_balance' => $this->used_balance,
            'adjusted_balance' => $this->adjusted_balance,
            'carry_over_expires_at' => optional($this->carry_over_expires_at)->toDateString(),
            'leave_type' => [
                'id' => $this->leaveType?->id,
                'name' => $this->leaveType?->name,
                'code' => $this->leaveType?->code,
            ],
        ];
    }
}
