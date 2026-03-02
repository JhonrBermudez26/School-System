<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Participant extends Model
{
    use HasFactory;

    /**
     * ✅ Solo la referencia a la conversación.
     *
     * REMOVIDOS del fillable original:
     * - 'user_id'   → se asigna explícitamente, nunca desde request
     * - 'joined_at' → se asigna automáticamente en addParticipant()
     * - 'hidden_at' → controlado por hide()
     */
    protected $fillable = [
        'conversation_id',
        'user_id',
        'joined_at',
        'hidden_at',
    ];

    protected $casts = [
        'joined_at' => 'datetime',
        'hidden_at' => 'datetime',
    ];

    public function hide(): bool
    {
        $this->hidden_at = now();
        return $this->save();
    }

    public function conversation() { return $this->belongsTo(Conversation::class); }
    public function user()         { return $this->belongsTo(User::class); }
}