<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\WIN\EMGood;
use App\Models\MovementType;

class EMGoodStockMovement extends Model
{
    use HasFactory;

    protected $table = 'em_good_stock_movement';
    protected $primaryKey = 'movement_id';
    protected $fillable = [
        'good_id', 'docu_no', 'movement_type_id',
        'quantity', 'reference_movement_id', 'docu_date', 'user_id', 'remark'
    ];

    public function movementType()
    {
        return $this->belongsTo(MovementType::class, 'movement_type_id', 'movement_type_id');
    }

    public function referenceMovement()
    {
        return $this->belongsTo(self::class, 'reference_movement_id', 'movement_id');
    }

    public function good()
    {
        return $this->belongsTo(EMGood::class, 'good_id', 'GoodID'); 
        // good_id = MySQL, GoodID = SQL Server
    }
}
