<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ExtraAcademicSeeder extends Seeder
{
    public function run(): void
    {
        // Crear asignaturas adicionales si no existen
        $extraSubjects = [
            ['name' => 'Música', 'code' => 'MUS-01', 'description' => 'Formación musical', 'hours_per_week' => 2],
            ['name' => 'Emprendimiento', 'code' => 'EMP-01', 'description' => 'Pensamiento empresarial', 'hours_per_week' => 2],
            ['name' => 'Robótica', 'code' => 'ROB-01', 'description' => 'Robótica educativa', 'hours_per_week' => 2],
            ['name' => 'TIC II', 'code' => 'TIC-02', 'description' => 'Tecnología avanzada', 'hours_per_week' => 2],
            ['name' => 'Proyecto', 'code' => 'PRO-01', 'description' => 'Proyecto transversal', 'hours_per_week' => 3],
        ];

        foreach ($extraSubjects as $s) {
            $exists = DB::table('subjects')->where('code', $s['code'])->exists();
            if (!$exists) {
                DB::table('subjects')->insert(array_merge($s, [
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]));
            }
        }

        // Asignar estas asignaturas a todos los grupos con profesores existentes (round-robin)
        $subjectIds = DB::table('subjects')->whereIn('code', ['MUS-01','EMP-01','ROB-01','TIC-02','PRO-01'])->pluck('id')->all();
        $teacherIds = DB::table('model_has_roles')
            ->where('role_id', function ($q) { $q->select('id')->from('roles')->where('name', 'profesor')->limit(1); })
            ->pluck('model_id')
            ->all();
        $groupIds = DB::table('groups')->pluck('id')->all();

        if (empty($subjectIds) || empty($teacherIds) || empty($groupIds)) {
            return; // nada que hacer
        }

        $ti = 0;
        foreach ($groupIds as $gid) {
            foreach ($subjectIds as $sid) {
                $teacherId = $teacherIds[$ti % count($teacherIds)];
                $ti++;
                // Evitar duplicados
                $exists = DB::table('subject_group')
                    ->where('group_id', $gid)
                    ->where('subject_id', $sid)
                    ->exists();
                if (!$exists) {
                    DB::table('subject_group')->insert([
                        'group_id' => $gid,
                        'subject_id' => $sid,
                        'user_id' => $teacherId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }
}
