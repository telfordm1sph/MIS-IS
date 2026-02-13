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
        Schema::create('component_issuance_details', function (Blueprint $table) {
            $table->id();

            // Reference to parent issuance
            $table->unsignedBigInteger('issuance_id');

            // Operation details
            $table->enum('operation_type', ['add', 'replace', 'remove', 'edit']);
            $table->enum('component_type', ['part', 'software'])->nullable();

            // Old component (for replace/remove operations)
            $table->unsignedBigInteger('old_component_id')->nullable()
                ->comment('ID from hardware_parts or hardware_software');
            $table->string('old_component_condition', 50)->nullable()
                ->comment('working, faulty, defective, damaged');
            $table->json('old_component_data')->nullable()
                ->comment('Snapshot of component before change');

            // New component (for add/replace operations)
            $table->unsignedBigInteger('new_component_id')->nullable()
                ->comment('ID from hardware_parts or hardware_software after installation');
            $table->string('new_component_condition', 50)->nullable()
                ->default('working');
            $table->json('new_component_data')->nullable()
                ->comment('Snapshot of component after change');

            // Hardware edit (for edit operation only)
            $table->json('hardware_changes')->nullable()
                ->comment('Before/after hardware info for edit operations');

            // Additional information
            $table->string('reason', 500)->nullable()
                ->comment('Reason for the operation');
            $table->text('remarks')->nullable()
                ->comment('Additional notes');

            // Timestamps
            $table->timestamps();

            // Foreign keys
            $table->foreign('issuance_id')
                ->references('id')
                ->on('issuance')
                ->onDelete('cascade');

            // Indexes
            $table->index('issuance_id');
            $table->index('operation_type');
            $table->index(['component_type', 'old_component_id']);
            $table->index(['component_type', 'new_component_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('component_issuance_details');
    }
};
