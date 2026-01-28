<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'name',
        'created_by',
        'last_message_at',
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
    ];

    public function participants()
    {
        return $this->hasMany(Participant::class);
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Agregar participante a la conversación
     */
    public function addParticipant($userId)
    {
        // Verificar que no exista ya
        if (!$this->participants()->where('user_id', $userId)->exists()) {
            return $this->participants()->create([
                'user_id' => $userId,
            ]);
        }
        
        return null;
    }

    /**
     * Actualizar timestamp del último mensaje
     */
    public function updateLastMessage()
    {
        $this->last_message_at = now();
        $this->save();
    }

    /**
     * Obtener mensajes no leídos para un usuario
     */
    public function unreadMessagesFor($userId)
    {
        return $this->messages()
            ->where('user_id', '!=', $userId)
            ->whereJsonDoesntContain('read_by', $userId)
            ->count();
    }

    /**
     * Scope para ordenar por actividad reciente
     */
    public function scopeRecentActivity($query)
    {
        return $query->orderByDesc('last_message_at');
    }
}