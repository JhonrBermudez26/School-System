<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class PeriodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::user()->hasRole('coordinadora');
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:100',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'year' => 'nullable|integer|min:2000|max:2100',
            'status' => 'nullable|string|in:draft,active,closed,archived',
            'habilitado' => 'nullable|boolean',
            'directrices' => 'nullable|string|max:1000',
            'porcentaje' => 'nullable|numeric|min:0|max:100',
            'password' => 'nullable|string',
        ];
    }
}
