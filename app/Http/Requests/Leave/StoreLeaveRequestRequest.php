<?php

namespace App\Http\Requests\Leave;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLeaveRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'leave_type_id' => ['required', 'exists:leave_types,id'],
            'policy_id' => ['required', 'exists:leave_policies,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'reason' => ['required', 'string', 'max:500'],
            'email' => ['nullable', 'email', 'max:255'],
            'employee_type' => ['nullable', Rule::in(['ASN', 'PPNPN'])],
            'full_name' => ['nullable', 'string', 'max:255'],
            'nip' => ['nullable', 'string', 'max:30', Rule::requiredIf(fn () => $this->filled('employee_type') && $this->string('employee_type')->toString() === 'ASN')],
            'position' => ['nullable', 'string', 'max:255'],
            'address_during_leave' => ['nullable', 'string', 'max:500'],
            'contact_phone' => ['nullable', 'string', 'max:30'],
            'attachment' => ['nullable', 'file', 'mimetypes:application/pdf,image/jpeg,image/png', 'max:5120'],
        ];
    }
}
