<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Timetable extends Model
{
    protected $fillable = ['group_id'];

    public function slots() {
        return $this->hasMany(TimetableSlot::class);
    }
}
