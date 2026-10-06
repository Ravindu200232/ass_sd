<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\ScopedToDepartment;
use App\Models\Concerns\HidesCostFromEmployees;

class Grn extends Model
{
    use HidesCostFromEmployees;

    use ScopedToDepartment;

    use HasFactory;

    protected $fillable = [
        'grn_code',
        'grn_date',
        'department_id', // Add department_id
        'total_cost',
        'total_selling_amount',
        'total_profit',
        'total_item',
        'grn_by'
    ];

    protected $casts = [
        'grn_date' => 'date'
    ];

    public function items()
    {
        return $this->hasMany(GrnItem::class, 'grn_code', 'grn_code');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'grn_by');
    }

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }
}