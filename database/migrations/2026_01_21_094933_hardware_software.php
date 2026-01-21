<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('hardware_software', function (Blueprint $table) {
            $table->id();
            $table->string('hardware_id'); // hostname reference
            $table->foreignId('software_inventory_id')->constrained('software_inventory')->onDelete('cascade');
            $table->foreignId('software_license_id')->nullable()->constrained('software_licenses')->onDelete('set null');
            $table->date('installation_date')->nullable();
            $table->string('installed_by')->nullable(); // EMPLOYID
            $table->enum('status', ['active', 'uninstalled', 'pending'])->default('active');
            $table->date('uninstall_date')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->foreign('hardware_id')->references('hostname')->on('hardware')->onDelete('cascade');
            $table->unique(['hardware_id', 'software_inventory_id', 'status'], 'unique_install');
            $table->index('hardware_id');
            $table->index('software_inventory_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hardware_software');
    }
};
