<?php

use App\Enums\LeaveRequestStatus;
use App\Enums\SignatureStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('leave_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('division_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('leave_type_id')->constrained()->cascadeOnDelete();
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('duration', 8, 2);
            $table->string('reason');
            $table->json('metadata')->nullable();
            $table->string('status')->default(LeaveRequestStatus::DRAFT->value);
            $table->string('document_number')->nullable();
            $table->string('qr_hash')->nullable();
            $table->string('signature_status')->default(SignatureStatus::PENDING->value);
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('finalized_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_requests');
    }
};
