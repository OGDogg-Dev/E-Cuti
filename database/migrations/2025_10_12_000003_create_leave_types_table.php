<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('leave_types', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->boolean('requires_document')->default(false);
            $table->unsignedInteger('default_quota_days')->nullable();
            $table->boolean('allow_half_day')->default(false);
            $table->boolean('allow_hourly')->default(false);
            $table->boolean('allow_carry_over')->default(false);
            $table->unsignedInteger('carry_over_expiry_months')->nullable();
            $table->json('prorate_rules')->nullable();
            $table->json('applicable_roles')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_types');
    }
};
