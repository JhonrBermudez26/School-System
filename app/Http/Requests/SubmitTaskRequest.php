<?php

namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class SubmitTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('estudiante');
    }

    public function rules(): array
    {
        return [
            'task_id'   => 'required|exists:tasks,id',
            'comment'   => 'nullable|string|max:2000',
            'files'     => 'nullable|array|max:5',
            'files.*'   => [
                'file',
                'max:20480',
                'mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png,gif,zip',
            ],
            'members'   => 'nullable|array',
            'members.*' => 'exists:users,id',
        ];
    }
}