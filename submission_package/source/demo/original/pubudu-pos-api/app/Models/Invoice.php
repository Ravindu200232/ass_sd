<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

   protected $fillable = [
        'inv_no',
        'inv_date',
        'customer_code',
        'department_id',
        'type', 
        'service', 
        'payment_status',
        'total_amount',
        'total_discount',
        'net_total',
        'pay_amount',
        'balance',
        'credit_allocated',
        'credit_paid',
        'is_credit_paid',
        'inv_by'
    ];

    protected $casts = [
        'inv_date' => 'date',
        'is_credit_paid' => 'boolean'
    ];

    // Add these accessors for easy calculation
    public function getRemainingBalanceAttribute()
    {
        return $this->balance - $this->credit_paid;
    }

    public function getPaidPercentageAttribute()
    {
        if ($this->balance <= 0) {
            return 100;
        }
        return ($this->credit_paid / $this->balance) * 100;
    }

    public function items()
    {
        return $this->hasMany(InvoiceItem::class, 'inv_no', 'inv_no');
    }

    public function stockMovements()
    {
        return $this->hasMany(InvoiceStockMovement::class, 'inv_no', 'inv_no');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_code', 'customer_code');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'inv_by', 'user_code');
    }

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }
}
