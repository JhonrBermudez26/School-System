<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DisciplineRecordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id' => 'required|exists:users,id',
            'type' => 'required|in:observation,minor_fault,serious_fault,very_serious_fault',
            'description' => 'required|string|max:1000',
            'date' => 'nullable|date',
            'severity' => 'required|in:low,medium,high,critical',
            'sanction' => 'nullable|string|max:500',
            'status' => 'nullable|in:open,closed',
        ];
    }

    public function messages(): array
    {
        return [
            'student_id.required' => 'Debe seleccionar un estudiante',
            'student_id.exists' => 'El estudiante seleccionado no existe',
            'type.required' => 'Debe seleccionar un tipo de falta',
            'type.in' => 'El tipo de falta no es válido',
            'description.required' => 'La descripción es obligatoria',
            'description.max' => 'La descripción no puede exceder 1000 caracteres',
            'severity.required' => 'Debe seleccionar una severidad',
            'severity.in' => 'La severidad no es válida',
            'sanction.max' => 'La sanción no puede exceder 500 caracteres',
        ];
    }

    
}