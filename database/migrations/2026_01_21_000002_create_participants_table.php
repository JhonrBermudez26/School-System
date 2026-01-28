<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamp('hidden_at')->nullable();
            $table->timestamps();
            
            $table->unique(['conversation_id', 'user_id']);
            $table->index(['user_id', 'hidden_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('participants');
    }
};