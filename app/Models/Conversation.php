<?php
// app/Models/Conversation.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    use HasFactory;

    /**
     * ✅ Solo tipo y nombre (para grupos).
     *
    */
    protected $fillable = [
        'type',
        'name',
        'created_by',
        'last_message_at',
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
    ];

    public function addParticipant($userId)
    {
        if (!$this->participants()->where('user_id', $userId)->exists()) {
            return $this->participants()->create(['user_id' => $userId]);
        }
        return null;
    }

    public function updateLastMessage(): void
    {
        $this->last_message_at = now();
        $this->save();
    }

    public function unreadMessagesFor($userId): int
    {
        return $this->messages()
            ->where('user_id', '!=', $userId)
            ->whereJsonDoesntContain('read_by', $userId)
            ->count();
    }

    public function scopeRecentActivity($query)
    {
        return $query->orderByDesc('last_message_at');
    }

    public function participants() { return $this->hasMany(Participant::class); }
    public function messages()     { return $this->hasMany(Message::class); }
    public function creator()      { return $this->belongsTo(User::class, 'created_by'); }
}