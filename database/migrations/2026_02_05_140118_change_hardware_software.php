<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // ===== FIX HARDWARE_PARTS TABLE =====
        Schema::table('hardware_parts', function (Blueprint $table) {
            // Drop the old foreign key constraint
            $table->dropForeign(['hardware_id']);
        });

        // Add temporary column to hold the hardware.id values
        Schema::table('hardware_parts', function (Blueprint $table) {
            $table->unsignedBigInteger('hardware_id_new')->nullable()->after('id');
        });

        // Populate the new column with hardware.id based on hostname match
        DB::statement('
            UPDATE hardware_parts hp
            INNER JOIN hardware h ON hp.hardware_id = h.hostname
            SET hp.hardware_id_new = h.id
        ');

        // Drop old hardware_id column and rename the new one
        Schema::table('hardware_parts', function (Blueprint $table) {
            $table->dropColumn('hardware_id');
        });

        Schema::table('hardware_parts', function (Blueprint $table) {
            $table->renameColumn('hardware_id_new', 'hardware_id');
        });

        // Make hardware_id NOT NULL and add foreign key
        Schema::table('hardware_parts', function (Blueprint $table) {
            $table->unsignedBigInteger('hardware_id')->nullable(false)->change();

            $table->foreign('hardware_id')
                ->references('id')
                ->on('hardware')
                ->onDelete('cascade');
        });

        // ===== FIX HARDWARE_SOFTWARE TABLE =====
        Schema::table('hardware_software', function (Blueprint $table) {
            // Drop the old foreign key constraint
            $table->dropForeign(['hardware_id']);
        });

        // Add temporary column to hold the hardware.id values
        Schema::table('hardware_software', function (Blueprint $table) {
            $table->unsignedBigInteger('hardware_id_new')->nullable()->after('id');
        });

        // Populate the new column with hardware.id based on hostname match
        DB::statement('
            UPDATE hardware_software hs
            INNER JOIN hardware h ON hs.hardware_id = h.hostname
            SET hs.hardware_id_new = h.id
        ');

        // Drop old hardware_id column and rename the new one
        Schema::table('hardware_software', function (Blueprint $table) {
            $table->dropColumn('hardware_id');
        });

        Schema::table('hardware_software', function (Blueprint $table) {
            $table->renameColumn('hardware_id_new', 'hardware_id');
        });

        // Make hardware_id NOT NULL and add foreign key
        Schema::table('hardware_software', function (Blueprint $table) {
            $table->unsignedBigInteger('hardware_id')->nullable(false)->change();

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
        // ===== REVERT HARDWARE_PARTS TABLE =====
        Schema::table('hardware_parts', function (Blueprint $table) {
            $table->dropForeign(['hardware_id']);
        });

        Schema::table('hardware_parts', function (Blueprint $table) {
            $table->string('hardware_id_old')->nullable()->after('id');
        });

        DB::statement('
            UPDATE hardware_parts hp
            INNER JOIN hardware h ON hp.hardware_id = h.id
            SET hp.hardware_id_old = h.hostname
        ');

        Schema::table('hardware_parts', function (Blueprint $table) {
            $table->dropColumn('hardware_id');
        });

        Schema::table('hardware_parts', function (Blueprint $table) {
            $table->renameColumn('hardware_id_old', 'hardware_id');
        });

        Schema::table('hardware_parts', function (Blueprint $table) {
            $table->string('hardware_id')->nullable(false)->change();

            $table->foreign('hardware_id')
                ->references('hostname')
                ->on('hardware')
                ->onDelete('cascade');
        });

        // ===== REVERT HARDWARE_SOFTWARE TABLE =====
        Schema::table('hardware_software', function (Blueprint $table) {
            $table->dropForeign(['hardware_id']);
        });

        Schema::table('hardware_software', function (Blueprint $table) {
            $table->string('hardware_id_old')->nullable()->after('id');
        });

        DB::statement('
            UPDATE hardware_software hs
            INNER JOIN hardware h ON hs.hardware_id = h.id
            SET hs.hardware_id_old = h.hostname
        ');

        Schema::table('hardware_software', function (Blueprint $table) {
            $table->dropColumn('hardware_id');
        });

        Schema::table('hardware_software', function (Blueprint $table) {
            $table->renameColumn('hardware_id_old', 'hardware_id');
        });

        Schema::table('hardware_software', function (Blueprint $table) {
            $table->string('hardware_id')->nullable(false)->change();

            $table->foreign('hardware_id')
                ->references('hostname')
                ->on('hardware')
                ->onDelete('cascade');
        });
    }
};
