<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('group_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('group_id')->constrained('groups')->onDelete('cascade');
            $table->timestamps();
            
            // Un estudiante solo puede estar en un grupo a la vez
            $table->unique(['user_id', 'group_id']);
            
            // Índices para optimizar consultas
            $table->index('user_id');
            $table->index('group_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('group_user');
    }
};