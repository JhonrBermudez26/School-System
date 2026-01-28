<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('posts')) {
            Schema::create('posts', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('subject_id');
                $table->unsignedBigInteger('group_id');
                $table->unsignedBigInteger('user_id'); // autor (profesor)
                $table->enum('type', ['post', 'tarea'])->default('post');
                $table->string('title');
                $table->text('content')->nullable();
                $table->timestamp('due_at')->nullable(); // sólo para tareas
                $table->timestamps();
                $table->index(['subject_id', 'group_id']);
            });
        }
    }
    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};