<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SeederStatus extends Model
{
    protected $fillable = ['user_id', 'received_items'];

    protected $casts = [
        'received_items' => 'array',
    ];

    const STATUS = [
        'NOT_RECEIVED' => 1,
        'RECEIVED_SHIRT' => 2,
        'RECEIVED_HAT' => 3
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function getStatusTextAttribute()
    {
        if (empty($this->received_items)) {
            return 'ยังไม่ได้รับอะไร';
        }

        $items = array_map(function($item) {
            return [
                1 => 'ไม่ได้รับเสื้อ',
                2 => 'รับเสื้อแล้ว',
                3 => 'รับหมวกแล้ว'
            ][$item];
        }, $this->received_items);
        
        return implode(', ', $items);
    }
}
