<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Meeting extends Model
{
    use HasFactory;

    protected $fillable = [
        'subject_id',
        'group_id',
        'user_id',
        'room_name',
        'url',
        'is_active',
        'ended_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'ended_at' => 'datetime',
    ];
}