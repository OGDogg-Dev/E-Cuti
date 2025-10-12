<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('leave_policies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('leave_type_id')->constrained()->cascadeOnDelete();
            $table->foreignId('division_id')->nullable()->constrained()->nullOnDelete();
            $table->string('flow_type')->default('SERIAL');
            $table->json('approval_matrix');
            $table->json('sla_rules')->nullable();
            $table->json('threshold_rules')->nullable();
            $table->json('blackout_rules')->nullable();
            $table->json('additional_constraints')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_policies');
    }
};
