<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('service_levels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('leave_policy_id')->constrained()->cascadeOnDelete();
            $table->string('stage');
            $table->unsignedInteger('response_time_hours');
            $table->unsignedInteger('escalation_time_hours')->nullable();
            $table->foreignId('escalate_to_role_id')->nullable()->constrained('roles')->nullOnDelete();
            $table->timestamps();
            $table->unique(['leave_policy_id', 'stage']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_levels');
    }
};
