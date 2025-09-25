<?php

namespace App\Models\MUN;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class FertilizerIssue extends Model
{
    use HasFactory;

    protected $table = 'fertilizer_issues';
    protected $fillable = ['production_id', 'issue_type', 'description', 'duration', 'status'];

    public function production()
    {
        return $this->belongsTo(FertilizerProduction::class, 'production_id');
    }
}
