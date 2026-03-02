<?php

// app/Observers/ClassFileObserver.php
namespace App\Observers;
use App\Models\ClassFile;
use App\Models\ActivityLog;
use Illuminate\Support\Str;

class ClassFileObserver
{
    public function deleted(ClassFile $file): void
    {
        ActivityLog::record(
            userId: auth()->id() ?? 0,
            action: 'deleted',
            model: $file,
            oldValues: [
                'name'        => $file->name,
                'folder_id'   => $file->folder_id,
                'uploaded_by' => $file->uploaded_by,
                'size'        => $file->size,
            ],
            newValues: []
        );
    }
      /**
     * Auto-generar UUID al crear un ClassFile.
     * Esto garantiza que NINGÚN archivo se crea sin UUID,
     * independientemente de dónde se llame ClassFile::create().
     */
    public function creating(ClassFile $file): void
    {
        if (empty($file->uuid)) {
            $file->uuid = (string) Str::uuid();
        }
    }
}