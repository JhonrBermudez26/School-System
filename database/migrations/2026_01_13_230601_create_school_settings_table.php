<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('school_settings', function (Blueprint $table) {
            $table->id();
            
            // Información básica
            $table->string('nombre_colegio')->nullable();
            $table->string('abreviacion')->nullable(); // Nueva: IELPA, CSM, etc.
            $table->string('lema')->nullable();
            $table->string('logo_path')->nullable();
            
            // Ubicación
            $table->string('direccion')->nullable();
            $table->string('ciudad')->nullable();
            $table->string('departamento')->nullable();
            $table->string('pais')->default('Colombia');
            
            // Contacto
            $table->string('telefono')->nullable();
            $table->string('celular')->nullable();
            $table->string('email')->nullable();
            $table->string('sitio_web')->nullable();
            
            // Información administrativa
            $table->string('rector')->nullable();
            $table->string('coordinador')->nullable();
            $table->string('secretario')->nullable();
            
            // Información académica
            $table->enum('calendario', ['A', 'B'])->default('A');
            $table->enum('jornada', ['Mañana', 'Tarde', 'Completa', 'Nocturna'])->default('Completa');
            $table->string('nivel_educativo')->nullable(); // Preescolar, Básica Primaria, Secundaria, Media
            $table->string('caracter')->nullable(); // Mixto, Femenino, Masculino
            
            // Legal
            $table->string('nit')->nullable();
            $table->string('dane')->nullable();
            $table->string('resolucion')->nullable();
            $table->date('fecha_fundacion')->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_settings');
    }
};