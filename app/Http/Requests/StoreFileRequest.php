<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class StoreFileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('profesor');
    }

    public function rules(): array
    {
        return [
            'subject_id' => 'required|integer',
            'group_id'   => 'required|integer',
            'folder_id'  => 'nullable|integer|exists:folders,id', // ← nullable, no requerido
            'files'      => 'required|array|min:1',
            'files.*'    => [
                'required',
                'file',
                'max:20480',
                'mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,gif,zip,mp4,mp3,txt',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'files.required'  => 'Debes seleccionar al menos un archivo.',
            'files.*.mimes'   => 'Tipo de archivo no permitido.',
            'files.*.max'     => 'El archivo no puede superar 20 MB.',
        ];
    }
}