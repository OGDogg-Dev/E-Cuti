<?php

namespace App\Http\Requests\Leave;

use Illuminate\Foundation\Http\FormRequest;

class StoreLeaveRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'max:255'],
            'employee_type' => ['required', 'in:ASN,PPNPN'],
            'full_name' => ['required', 'string', 'max:255'],
            'nip' => ['nullable', 'string', 'max:30', 'required_if:employee_type,ASN'],
            'position' => ['required', 'string', 'max:255'],
            'leave_type_id' => ['required', 'exists:leave_types,id'],
            'policy_id' => ['required', 'exists:leave_policies,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'reason' => ['required', 'string', 'max:500'],
            'address_during_leave' => ['required', 'string', 'max:500'],
            'contact_phone' => ['required', 'string', 'max:30'],
            'attachment' => ['nullable', 'file', 'mimetypes:application/pdf,image/jpeg,image/png', 'max:5120'],
        ];
    }
}
