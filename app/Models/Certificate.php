<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Certificate extends Model
{
    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->connection = env('DB_CERTIFICATES_CONNECTION', 'sqlsrv3');
    }

    use HasFactory;

    protected $table = 'certificates';
    protected $primaryKey = 'SOPID';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;
    // ฟิลด์ที่อนุญาตให้ mass assignment
    protected $fillable = [
        'id',
        'date_coa',
        'SOPID',
        'coa_number',
        'coa_lot',
        'coa_tank',
        'result_FFA',
        'result_moisture',
        'result_IV',
        'result_dobi',
        'spec_FFA',
        'spec_moisture',
        'spec_IV',
        'spec_dobi',
        'coa_user',
        'coa_mgr',
        'status',
        'status_approve',
        'status_reject',
        'coa_remark',
        'created_at',
        'updated_at',
        'result_shell',
        'result_kn_moisture',
        'spec_shell',
        'spec_kn_moisture',
    ];
}
