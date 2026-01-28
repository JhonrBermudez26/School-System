<?php
// app/Models/Folder.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Folder extends Model
{
    use HasFactory;

    protected $fillable = [
        'subject_id',
        'group_id',
        'user_id',
        'parent_id',
        'name',
        'description',
    ];

    public function files()
    {
        return $this->hasMany(ClassFile::class);
    }

    public function children()
    {
        return $this->hasMany(Folder::class, 'parent_id');
    }

    public function parent()
    {
        return $this->belongsTo(Folder::class, 'parent_id');
    }

    protected static function boot()
    {
        parent::boot();

        // Al eliminar una carpeta, eliminar todas las subcarpetas y archivos
        static::deleting(function ($folder) {
            foreach ($folder->children as $child) {
                $child->delete();
            }
            foreach ($folder->files as $file) {
                $file->delete();
            }
        });
    }
}
