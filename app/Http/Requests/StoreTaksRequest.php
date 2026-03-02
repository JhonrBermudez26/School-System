<?php

namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('profesor');
    }

    public function rules(): array
    {
        return [
            'title'         => 'required|string|max:255',
            'description'   => 'nullable|string|max:5000',
            'due_date'      => 'required|date|after:now',
            'max_score'     => 'required|numeric|min:0|max:5',
            'work_type' => 'required|in:individual,pairs,group',
            'subject_id'    => 'required|exists:subjects,id',
            'group_id'      => 'required|exists:groups,id',
            'attachments'   => 'nullable|array|max:5',
            'attachments.*' => [
                'file',
                'max:20480',
                'mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png,gif,zip',
            ],
        ];
    }
}