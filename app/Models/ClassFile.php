<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ClassFile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'subject_id',
        'group_id',
        'folder_id',
        'filename',
        'path',    // ← agregar
        'mime',    // ← agregar
        'size',    // ← agregar
    ];

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    public function folder()
    {
        return $this->belongsTo(Folder::class);
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($file) {
            if (empty($file->uuid)) {
                $file->uuid = Str::uuid();
            }
        });

        static::deleting(function ($file) {
            if ($file->path && Storage::disk('private')->exists($file->path)) {
                Storage::disk('private')->delete($file->path);
            }
        });
    }
}