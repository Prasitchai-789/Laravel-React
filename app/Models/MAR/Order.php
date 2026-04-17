<?php

namespace App\Models\MAR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    /**
     * The connection name for the model.
     *
     * @var string
     */
    protected $connection = 'sqlsrv';

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'orders';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'cust_id',
        'cust_code',
        'customer_name',
        'dest_cust_id',
        'dest_cust_code',
        'dest_cust_name',
        'good_id',
        'good_code',
        'product',
        'quantity',
        'price_sell',
        'price_customer',
        'is_completed',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_completed' => 'boolean',
    ];

    /**
     * Get the delivery plan items for the order.
     */
    public function deliveryPlanItems(): HasMany
    {
        return $this->hasMany(DeliveryPlanItem::class, 'order_id', 'id');
    }
}
