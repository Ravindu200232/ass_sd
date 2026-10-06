<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DiscountRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'inv_no',
        'product_code',
        'requested_by',
        'original_price',
        'requested_discount',
        'final_price',
        'reason',
        'status',
        'approved_by',
        'approved_at',
        'cancelled_at',
        'admin_note'
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'original_price' => 'float',
        'requested_discount' => 'float',
        'final_price' => 'float',
    ];

    public function requestedByUser()
    {
        return $this->belongsTo(User::class, 'requested_by', 'user_code');
    }

    public function approvedByUser()
    {
        return $this->belongsTo(User::class, 'approved_by', 'user_code');
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class, 'inv_no', 'inv_no');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_code', 'product_code');
    }
}
