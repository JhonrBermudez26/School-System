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
            $table->unsignedBigInteger('student_id')->nullable();
            $table->unsignedBigInteger('period_id')->nullable();
            $table->string('status')->default('generado');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('boletines');
    }
};
