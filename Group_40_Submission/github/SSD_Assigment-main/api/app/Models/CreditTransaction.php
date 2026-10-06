<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CreditTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_code',
        'type',
        'amount',
        'previous_balance',
        'new_balance',
        'reference',
        'notes',
        'transaction_date',
        'allocation' // Add this if you want to store allocation data
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'previous_balance' => 'decimal:2',
        'new_balance' => 'decimal:2',
        'transaction_date' => 'date',
        'allocation' => 'array' // Add this if you want to store allocation data
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_code', 'customer_code');
    }
}