<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('leave_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('leave_type_id')->constrained()->cascadeOnDelete();
            $table->year('year');
            $table->decimal('opening_balance', 8, 2)->default(0);
            $table->decimal('carry_over_balance', 8, 2)->default(0);
            $table->decimal('used_balance', 8, 2)->default(0);
            $table->decimal('adjusted_balance', 8, 2)->default(0);
            $table->timestamp('carry_over_expires_at')->nullable();
            $table->json('audit_trail')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'leave_type_id', 'year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_balances');
    }
};
