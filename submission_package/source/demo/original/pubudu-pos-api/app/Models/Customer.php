<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_code',
        'customer_name',
        'address',
        'phone_no_01',
        'phone_no_02',
        'nic_no',
        'department_id', // Add this
        'credit_balance',
        'credit_limit',
        'credit_enabled'
    ];

    protected $casts = [
        'credit_balance' => 'decimal:2',
        'credit_limit' => 'decimal:2',
        'credit_enabled' => 'boolean'
    ];

    // Add the department relationship
    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class, 'customer_code', 'customer_code');
    }

    public function creditTransactions()
    {
        return $this->hasMany(CreditTransaction::class, 'customer_code', 'customer_code');
    }

    // Check if customer can take more credit
    public function canTakeCredit($amount)
    {
        if (!$this->credit_enabled) return false;
        
        return ($this->credit_balance + $amount) <= $this->credit_limit;
    }

    // Get available credit
    public function getAvailableCreditAttribute()
    {
        return $this->credit_limit - $this->credit_balance;
    }
}