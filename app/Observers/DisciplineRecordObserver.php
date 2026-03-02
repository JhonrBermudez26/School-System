<?php

namespace App\Observers;

use App\Models\DisciplineRecord;
use Illuminate\Support\Str;

class DisciplineRecordObserver
{
    /**
     * Auto-generar UUID al crear un DisciplineRecord.
     */
    public function creating(DisciplineRecord $record): void
    {
        if (empty($record->uuid)) {
            $record->uuid = (string) Str::uuid();
        }
    }
}