<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    use HasFactory;

    protected $fillable = [
        'subject_id',
        'group_id',
        'user_id',
        'type',
        'title',
        'content',
        'due_at',
    ];

    protected $casts = [
        'due_at' => 'datetime',
    ];

    public function attachments()
    {
        return $this->hasMany(PostAttachment::class);
    }
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
