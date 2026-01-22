<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'conversation_id',
        'user_id',
        'body',
        'type',
        'attachment',
        'read_by',
    ];

    protected $casts = [
        'read_by' => 'array',
    ];

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Marcar como leído por un usuario
    public function markAsRead($userId)
    {
        $readBy = $this->read_by ?? [];
        if (!in_array($userId, $readBy)) {
            $readBy[] = $userId;
            $this->read_by = $readBy;
            $this->save();
        }
    }

    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($message) {
            if ($message->attachment && $message->type === 'file') {
                Storage::disk('public')->delete($message->attachment);
            }
        });
    }
}