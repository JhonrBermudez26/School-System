<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class ClassFile extends Model
{
    use HasFactory;

    protected $fillable = [
        'subject_id',
        'group_id',
        'folder_id',
        'user_id',
        'filename',
        'path',
        'mime',
        'size',
    ];

    public function folder()
    {
        return $this->belongsTo(Folder::class);
    }

    protected static function boot()
    {
        parent::boot();

        // Al eliminar un archivo, eliminarlo también del almacenamiento
        static::deleting(function ($file) {
            if ($file->path && Storage::disk('public')->exists($file->path)) {
                Storage::disk('public')->delete($file->path);
            }
        });
    }
}