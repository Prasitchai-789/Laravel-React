<?php

namespace App\Models\Memo;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class MemoExpenseDocuments extends Model
{
    use HasFactory;

    protected $table = 'memo_expense_documents';
    protected $fillable = [
        'document_no',
        'date',
        'description',
        'category_id',
        'amount',
        'status',
        'attachment_path',
        'winspeed_ref_id'
    ];

    /**
     * ความสัมพันธ์กับ MemoExpenseCategories
     * เอกสาร 1 รายการอยู่ในหมวดหมู่เดียว
     */
    public function category()
    {
        return $this->belongsTo(MemoExpenseCategories::class, 'category_id');
    }

    /**
     * ความสัมพันธ์กับไฟล์แนบหลายไฟล์ (optional)
     */
    public function attachments()
    {
        return $this->hasMany(MemoExpenseAttachments::class, 'expense_id');
    }
}
