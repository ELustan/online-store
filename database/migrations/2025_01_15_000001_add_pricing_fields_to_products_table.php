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
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('price', 10, 2)->default(0)->after('description');
            $table->decimal('discount_percent', 5, 2)->default(0)->after('price');
            $table->decimal('cashback_percent', 5, 2)->default(0)->after('discount_percent');
            $table->string('promo_label')->nullable()->after('cashback_percent');
            $table->timestamp('promo_expires_at')->nullable()->after('promo_label');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'price',
                'discount_percent',
                'cashback_percent',
                'promo_label',
                'promo_expires_at',
            ]);
        });
    }
};
