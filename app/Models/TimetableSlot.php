<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TimetableSlot extends Model
{
    protected $fillable = [
        'timetable_id','time_slot_id','day','subject_id','user_id'
    ];

    public function timeSlot() {
        return $this->belongsTo(TimeSlot::class);
    }

    public function timetable() {
        return $this->belongsTo(Timetable::class);
    }
}
