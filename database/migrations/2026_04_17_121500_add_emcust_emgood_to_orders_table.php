<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('sqlsrv')->table('orders', function (Blueprint $table) {
            $table->unsignedBigInteger('cust_id')->nullable()->after('id');
            $table->string('cust_code')->nullable()->after('cust_id');
            // customer_name already exists

            $table->unsignedBigInteger('dest_cust_id')->nullable()->after('customer_name');
            $table->string('dest_cust_code')->nullable()->after('dest_cust_id');
            $table->string('dest_cust_name')->nullable()->after('dest_cust_code');

            $table->unsignedBigInteger('good_id')->nullable()->after('dest_cust_name');
            $table->string('good_code')->nullable()->after('good_id');
            // product already exists and will hold GoodName1
        });
    }

    public function down(): void
    {
        Schema::connection('sqlsrv')->table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'cust_id', 'cust_code',
                'dest_cust_id', 'dest_cust_code', 'dest_cust_name',
                'good_id', 'good_code'
            ]);
        });
    }
};
