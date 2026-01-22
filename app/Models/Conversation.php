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

    public function participants()
    {
        return $this->hasMany(Participant::class);
    }

    public function messages()
    {
        return $this->hasMany(Message::class)->orderBy('created_at', 'asc');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Método para agregar participante
    public function addParticipant($userId)
    {
        return $this->participants()->create([
            'user_id' => $userId,
        ]);
    }

    // Actualizar último mensaje
    public function updateLastMessage()
    {
        $this->last_message_at = now();
        $this->save();
    }
}