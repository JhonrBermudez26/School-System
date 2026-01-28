<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // Modificar el tipo ENUM para incluir 'system'
        DB::statement("ALTER TABLE messages MODIFY COLUMN type ENUM('text', 'file', 'call', 'audio', 'system') NOT NULL DEFAULT 'text'");
    }

    public function down()
    {
        DB::statement("ALTER TABLE messages MODIFY COLUMN type ENUM('text', 'file', 'call', 'audio') NOT NULL DEFAULT 'text'");
    }
};