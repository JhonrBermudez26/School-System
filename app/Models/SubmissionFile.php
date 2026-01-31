<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubmissionFile extends Model
{
    use HasFactory;

    protected $fillable = [
        'submission_id',
        'file_name',
        'file_path',
        'file_type',
        'file_size',
    ];

    public function submission()
    {
        return $this->belongsTo(TaskSubmission::class);
    }
}
