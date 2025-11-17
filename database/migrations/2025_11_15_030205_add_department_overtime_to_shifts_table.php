<!-- <?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
//    public function up()
// {
//     Schema::table('shifts', function (Blueprint $table) {
//         $table->foreignId('department_id')->nullable()->constrained('departments')->after('id');
//         $table->boolean('overtime_allowed')->default(false)->after('description');
//     });
// }

// public function down()
// {
//     Schema::table('shifts', function (Blueprint $table) {
//         $table->dropForeign(['department_id']);
//         $table->dropColumn(['department_id', 'overtime_allowed']);
//     });
// }

};
