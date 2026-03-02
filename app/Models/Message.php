<?php
// app/Models/Message.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    use HasFactory;

    /**
     * ✅ Solo el contenido del mensaje que el usuario puede escribir.
     *
     */
    protected $fillable = [
        'conversation_id',
        'body',
        'type',
        'attachment',
        'read_by',
        'deleted',
        'edited',
        'hidden_by',
        'created_at',
        'updated_at',
        'deleted_at',
        'conversation_id',
        'user_id',
    ];

    protected $casts = [
        'read_by'  => 'array',
        'deleted'  => 'boolean',
        'edited'   => 'boolean',
        'hidden_by'=> 'array',
    ];

    /* =====================================================
     |  MÉTODOS CONTROLADOS
     ===================================================== */

    public function markAsRead($userId): void
    {
        $readBy = is_array($this->read_by) ? $this->read_by : [];
        if (!in_array($userId, $readBy)) {
            $readBy[] = $userId;
            $this->read_by = $readBy;
            $this->save();
        }
    }

    public function isReadBy($userId): bool
    {
        $readBy = is_array($this->read_by) ? $this->read_by : [];
        return in_array($userId, $readBy);
    }

    /**
     * Editar mensaje — solo el autor puede llamar esto.
     */
    public function edit(string $newBody): bool
    {
        $this->body   = $newBody;
        $this->edited = true;
        return $this->save();
    }

    /**
     * Eliminar lógicamente — solo el autor o admin.
     */
    public function softDelete(): bool
    {
        $this->deleted = true;
        return $this->save();
    }

    /**
     * Ocultar para un usuario específico.
     */
    public function hideFor(int $userId): bool
    {
        $hiddenBy   = is_array($this->hidden_by) ? $this->hidden_by : [];
        $hiddenBy[] = $userId;
        $this->hidden_by = array_unique($hiddenBy);
        return $this->save();
    }

    public function getReadCountAttribute(): int
    {
        $readBy = is_array($this->read_by) ? $this->read_by : [];
        return count(array_filter($readBy, fn($id) => $id !== $this->user_id));
    }

    public function conversation() { return $this->belongsTo(Conversation::class); }
    public function user()         { return $this->belongsTo(User::class); }
}