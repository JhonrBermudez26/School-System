<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    /**
     * ✅ Solo título y mensaje.
     *
     * REMOVIDOS del fillable original:
     * - 'user_id'  → se asigna explícitamente en el controller
     * - 'is_read'  → controlado por markAsRead()
     */
    protected $fillable = [
        'title',
        'message',
    ];

    public function markAsRead(): bool
    {
        $this->is_read = true;
        return $this->save();
    }

    public function user() { return $this->belongsTo(User::class); }
}