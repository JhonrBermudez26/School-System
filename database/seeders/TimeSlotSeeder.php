<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TimeSlotSeeder extends Seeder
{
    public function run(): void
    {
        $slots = [
            ['start_time' => '06:45', 'end_time' => '07:45'],
            ['start_time' => '07:45', 'end_time' => '08:45'],
            ['start_time' => '08:45', 'end_time' => '09:45'],
            // Recreo 09:45 - 10:15 (no se inserta como slot)
            ['start_time' => '10:15', 'end_time' => '11:15'],
            ['start_time' => '11:15', 'end_time' => '12:15'],
        ];

        foreach ($slots as $s) {
            $exists = DB::table('time_slots')
                ->where('start_time', $s['start_time'])
                ->where('end_time', $s['end_time'])
                ->exists();
            if (!$exists) {
                DB::table('time_slots')->insert([
                    'start_time' => $s['start_time'],
                    'end_time' => $s['end_time'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}
