<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
        'deleted',
        'edited',
        'hidden_by',
    ];

    protected $casts = [
        'read_by' => 'array',
        'deleted' => 'boolean',
        'edited' => 'boolean',
        'hidden_by' => 'array', 
    ];

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Marcar mensaje como leído por un usuario
     */
    public function markAsRead($userId)
    {
        // Asegurar que read_by sea un array
        $readBy = $this->read_by;
        
        // Si es null, string o no es array, convertir a array
        if (!is_array($readBy)) {
            if (is_string($readBy)) {
                $readBy = json_decode($readBy, true) ?? [];
            } else {
                $readBy = [];
            }
        }
        
        if (!in_array($userId, $readBy)) {
            $readBy[] = $userId;
            $this->read_by = $readBy;
            $this->save();
        }
    }

    /**
     * Verificar si un mensaje ha sido leído por un usuario
     */
    public function isReadBy($userId)
    {
        $readBy = $this->read_by;
        
        if (!is_array($readBy)) {
            if (is_string($readBy)) {
                $readBy = json_decode($readBy, true) ?? [];
            } else {
                $readBy = [];
            }
        }
        
        return in_array($userId, $readBy);
    }

    /**
     * Obtener la cantidad de lecturas (excluyendo al autor)
     */
    public function getReadCountAttribute()
    {
        $readBy = $this->read_by;
        
        if (!is_array($readBy)) {
            if (is_string($readBy)) {
                $readBy = json_decode($readBy, true) ?? [];
            } else {
                $readBy = [];
            }
        }
        
        return count(array_filter($readBy, fn($id) => $id !== $this->user_id));
    }
}