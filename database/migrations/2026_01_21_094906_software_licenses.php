<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('software_licenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('software_inventory_id')->constrained('software_inventory')->onDelete('cascade');
            $table->string('license_key', 500)->nullable();
            $table->string('account_user')->nullable();
            $table->string('account_password')->nullable();
            $table->integer('max_activations')->default(1);
            $table->integer('current_activations')->default(0);
            $table->text('remarks')->nullable();
            $table->string('created_by')->nullable();
            $table->string('updated_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('software_licenses');
    }
};
