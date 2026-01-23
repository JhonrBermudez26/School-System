<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->text('body')->nullable();
            $table->enum('type', ['text', 'file', 'call', 'audio'])->default('text');
            $table->string('attachment')->nullable();
            $table->json('read_by')->nullable(); // Array de user_ids que lo leyeron
            $table->timestamps();

            // Índices para mejorar el rendimiento
            $table->index('conversation_id');
            $table->index('user_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};