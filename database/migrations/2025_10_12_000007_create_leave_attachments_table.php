<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('leave_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('leave_request_id')->constrained()->cascadeOnDelete();
            $table->string('filename');
            $table->string('mime_type');
            $table->unsignedBigInteger('size');
            $table->string('storage_path');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_attachments');
    }
};
