<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('acknowledgements', function (Blueprint $table) {
            $table->id();

            // Reference to what is being acknowledged
            $table->tinyInteger('reference_type')
                ->comment('1=Issuance (whole unit or component), 2=Issuance Item (if used)');
            $table->unsignedBigInteger('reference_id')
                ->comment('ID from issuance or issuance_items table');

            // Acknowledgement details
            $table->string('acknowledged_by', 50)
                ->comment('Employee ID who needs to acknowledge');
            $table->tinyInteger('status')->default(0)
                ->comment('0=Pending, 1=Acknowledged, 2=Rejected');
            $table->timestamp('acknowledged_at')->nullable()
                ->comment('When the acknowledgement was made');

            // Additional information
            $table->text('remarks')->nullable();

            // Digital signature/proof (optional)
            $table->text('signature_data')->nullable()
                ->comment('Base64 signature or file path');
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();

            // Timestamps
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            // Indexes
            $table->index(['reference_type', 'reference_id']);
            $table->index('acknowledged_by');
            $table->index('status');
            $table->index('acknowledged_at');
            $table->index('created_at');

            // Foreign keys (optional - uncomment if you want FK constraints)
            // $table->foreign('acknowledged_by')->references('EMPLOYID')->on('masterlist')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('acknowledgements');
    }
};
