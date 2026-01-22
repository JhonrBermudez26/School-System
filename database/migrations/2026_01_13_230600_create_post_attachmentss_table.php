<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('post_attachments')) {
            Schema::create('post_attachments', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('post_id');
                $table->enum('type', ['image', 'file', 'link'])->default('file');
                $table->string('filename')->nullable();
                $table->string('path')->nullable();
                $table->string('url')->nullable();
                $table->string('mime')->nullable();
                $table->unsignedBigInteger('size')->nullable();
                $table->timestamps();
                $table->index('post_id');
            });
        }
    }
    public function down(): void
    {
        Schema::dropIfExists('post_attachments');
    }
};