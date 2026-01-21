<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('part_inventory', function (Blueprint $table) {
            $table->id();
            $table->string('part_type', 50);
            $table->string('brand', 50);
            $table->string('model', 100)->nullable();
            $table->string('specifications', 255)->nullable();
            $table->integer('quantity')->default(0);
            $table->enum('condition', ['new', 'used'])->default('new');
            $table->string('location', 100)->nullable();
            $table->integer('reorder_level')->default(5);
            $table->integer('reorder_quantity')->default(10);
            $table->decimal('unit_cost', 10, 2)->nullable();
            $table->string('supplier', 255)->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->index('part_type');
            $table->index('quantity');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('part_inventory');
    }
};
