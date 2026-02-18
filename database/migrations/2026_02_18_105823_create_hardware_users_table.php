<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('hardware_users', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('hardware_id');
            $table->string('user_id', 50);
            $table->timestamp('date_assigned')->useCurrent();
            $table->string('assigned_by', 50)->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->foreign('hardware_id')
                ->references('id')
                ->on('hardware')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hardware_users');
    }
};
