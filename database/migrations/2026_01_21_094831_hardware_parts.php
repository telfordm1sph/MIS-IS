<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('hardware_parts', function (Blueprint $table) {
            $table->id();
            $table->string('hardware_id'); // hostname reference
            $table->string('part_type');
            $table->string('brand');
            $table->string('model')->nullable();
            $table->text('specifications')->nullable();
            $table->string('serial_number')->nullable(); // only if installed
            $table->string('slot_position')->nullable(); // DIMM1, PCIe1
            $table->integer('quantity')->default(1);
            $table->enum('status', ['installed', 'spare', 'removed'])->default('installed');
            $table->date('installed_date')->nullable();
            $table->date('removed_date')->nullable();
            $table->foreignId('source_inventory_id')->nullable()->constrained('part_inventory')->onDelete('set null');
            $table->text('remarks')->nullable();
            $table->string('created_by')->nullable();
            $table->string('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('hardware_id')->references('hostname')->on('hardware')->onDelete('cascade');
            $table->index(['hardware_id', 'status']);
            $table->index('part_type');
            $table->index('serial_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hardware_parts');
    }
};
