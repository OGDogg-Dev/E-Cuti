<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('leave_request_approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('leave_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('approver_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('delegated_from_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('stage');
            $table->timestamp('assigned_at');
            $table->timestamp('acted_at')->nullable();
            $table->string('action')->nullable();
            $table->text('notes')->nullable();
            $table->json('sla_snapshot')->nullable();
            $table->timestamps();
            $table->index(['leave_request_id', 'stage']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_request_approvals');
    }
};
