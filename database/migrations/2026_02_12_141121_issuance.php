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
        Schema::create('issuance', function (Blueprint $table) {
            $table->id();

            // Issuance identification
            $table->string('issuance_number', 50)->unique();
            $table->tinyInteger('issuance_type')->default(1)
                ->comment('1=Whole Unit, 2=Component Maintenance');

            // Reference information
            $table->string('request_number', 100)->nullable()
                ->comment('Request number for whole unit issuance');

            // Hardware information
            $table->string('hostname', 100);
            $table->unsignedBigInteger('hardware_id')->nullable();

            // Issuance details
            $table->string('issued_to', 50);
            $table->string('location', 255)->nullable();
            $table->text('remarks')->nullable();

            // Audit fields
            $table->string('created_by', 50);
            $table->timestamp('created_at')->useCurrent();

            // Indexes
            $table->index('issuance_number');
            $table->index('issuance_type');
            $table->index('request_number');
            $table->index('hostname');
            $table->index('hardware_id');
            $table->index('issued_to');
            $table->index('created_by');
            $table->index('created_at');

            // Foreign keys (optional - uncomment if you want FK constraints)
            // $table->foreign('hardware_id')->references('id')->on('hardware')->onDelete('set null');
            // $table->foreign('issued_to')->references('EMPLOYID')->on('masterlist')->onDelete('restrict');
            // $table->foreign('created_by')->references('EMPLOYID')->on('masterlist')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('issuance');
    }
};
