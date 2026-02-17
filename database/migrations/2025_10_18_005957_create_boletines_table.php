<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('boletines', function (Blueprint $table) {
            $table->id();
            
            // Relaciones - referencian a 'users' no 'students'
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('academic_period_id');
            $table->unsignedBigInteger('group_id');
            
            // Información académica
            $table->decimal('promedio_general', 3, 2)->nullable();
            $table->integer('puesto_grupo')->nullable();
            $table->integer('total_estudiantes_grupo')->nullable();
            
            // Asistencia
            $table->integer('dias_asistidos')->default(0);
            $table->integer('dias_totales')->default(0);
            $table->decimal('porcentaje_asistencia', 5, 2)->default(0);
            
            // Convivencia
            $table->text('observaciones_convivencia')->nullable();
            $table->text('observaciones_academicas')->nullable();
            $table->text('recomendaciones')->nullable();
            
            // Director de grupo
            $table->unsignedBigInteger('director_grupo_id')->nullable();
            $table->text('observaciones_director')->nullable();
            
            // Control de generación
            $table->enum('estado', ['pendiente', 'generado', 'enviado'])->default('pendiente');
            $table->timestamp('fecha_generacion')->nullable();
            $table->string('archivo_path')->nullable();
            
            $table->timestamps();
            
            // Índices
            $table->unique(['student_id', 'academic_period_id']);
            $table->index('estado');
            
            // Llaves foráneas
            $table->foreign('student_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');
                
            $table->foreign('director_grupo_id')
                ->references('id')
                ->on('users')
                ->onDelete('set null');
            
            $table->foreign('academic_period_id')
                ->references('id')
                ->on('academic_periods')
                ->onDelete('cascade');
            
            $table->foreign('group_id')
                ->references('id')
                ->on('groups')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('boletines');
    }
};