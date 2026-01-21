<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('hardware', function (Blueprint $table) {
            $table->id();
            $table->string('hostname')->unique();
            $table->enum('category', ['Desktop', 'Laptop', 'Monitor', 'Printer', 'Server', 'Network Device', 'Other']);
            $table->string('brand')->nullable();
            $table->string('model')->nullable();
            $table->string('serial_number')->nullable();
            $table->string('processor')->nullable();
            $table->string('motherboard')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('wifi_mac', 17)->nullable();
            $table->string('lan_mac', 17)->nullable();
            $table->text('remarks')->nullable();
            $table->enum('status', ['active', 'spare', 'defective', 'disposed', 'in_repair', 'retired'])->default('active');
            $table->string('location')->nullable();
            $table->string('department')->nullable();
            $table->string('issued_to')->nullable(); // EMPLOYID
            $table->string('installed_by')->nullable();
            $table->date('date_issued')->nullable();
            $table->string('created_by')->nullable();
            $table->string('updated_by')->nullable();
            $table->timestamps();

            $table->index('hostname');
            $table->index('status');
            $table->index('issued_to');
            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hardware');
    }
};
