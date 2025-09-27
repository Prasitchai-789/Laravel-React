<?php

namespace App\Models\Memo;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class MemoExpenseCategories extends Model
{
    use HasFactory;

    protected $table = 'memo_expense_categories'; // ชื่อ table
    protected $fillable = ['name'];

    public function documents()
    {
        return $this->hasMany(MemoExpenseDocuments::class, 'category_id');
    }
}
