<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('approval_delegations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('approver_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('delegate_id')->constrained('users')->cascadeOnDelete();
            $table->date('start_date');
            $table->date('end_date');
            $table->json('stages')->nullable();
            $table->boolean('auto_assign')->default(true);
            $table->timestamps();
            $table->index(['approver_id', 'delegate_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_delegations');
    }
};
