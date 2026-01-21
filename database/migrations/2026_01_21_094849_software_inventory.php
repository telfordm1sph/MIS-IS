<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('software_inventory', function (Blueprint $table) {
            $table->id();
            $table->string('software_name');
            $table->enum('software_type', ['OS', 'Productivity', 'Security', 'Development', 'Design', 'Database', 'Utilities', 'Other']);
            $table->string('version')->nullable();
            $table->string('publisher')->nullable();
            $table->enum('license_type', ['perpetual', 'subscription', 'volume', 'oem', 'free', 'open_source']);
            $table->boolean('requires_key_tracking')->default(false);
            $table->integer('total_licenses')->default(0);
            $table->integer('assigned_licenses')->default(0); // calculated
            $table->date('subscription_start')->nullable();
            $table->date('subscription_end')->nullable();
            $table->integer('renewal_reminder_days')->default(30);
            $table->decimal('cost_per_license', 10, 2)->nullable();
            $table->decimal('total_cost', 10, 2)->nullable();
            $table->date('purchase_date')->nullable();
            $table->string('purchase_order')->nullable();
            $table->string('vendor')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('software_name');
            $table->index('software_type');
            $table->index('license_type');
            $table->index('subscription_end');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('software_inventory');
    }
};
