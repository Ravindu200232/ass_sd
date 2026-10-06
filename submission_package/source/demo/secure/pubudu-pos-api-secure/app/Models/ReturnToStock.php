<?php
// app/Models/ReturnToStock.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReturnToStock extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'return_to_stock';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'grn_item_id',
        'grn_code',
        'product_code',
        'product_name',
        'returned_qty',
        'stock_price',
        'actual_cost',
        'selling_price',
        'reason',
        'returned_by',
        'returned_at',
        'status',
        'approved_by',
        'approved_at',
        'approval_notes'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'returned_qty' => 'integer',
        'stock_price' => 'decimal:2',
        'actual_cost' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'returned_at' => 'datetime',
        'approved_at' => 'datetime'
    ];

    /**
     * Get the GRN item associated with the return.
     */
    public function grnItem()
    {
        return $this->belongsTo(GrnItem::class, 'grn_item_id');
    }

    /**
     * Get the user who made the return.
     */
    public function returnedBy()
    {
        return $this->belongsTo(User::class, 'returned_by');
    }

    /**
     * Get the user who approved the return.
     */
    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get the GRN associated with the return.
     */
    public function grn()
    {
        return $this->belongsTo(Grn::class, 'grn_code', 'grn_code');
    }

    /**
     * Scope a query to only include pending returns.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope a query to only include approved returns.
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope a query to only include rejected returns.
     */
    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    /**
     * Scope a query to only include returns for a specific GRN.
     */
    public function scopeForGrn($query, $grnCode)
    {
        return $query->where('grn_code', $grnCode);
    }

    /**
     * Scope a query to only include returns for a specific product.
     */
    public function scopeForProduct($query, $productCode)
    {
        return $query->where('product_code', $productCode);
    }

    /**
     * Check if return is pending.
     */
    public function getIsPendingAttribute()
    {
        return $this->status === 'pending';
    }

    /**
     * Check if return is approved.
     */
    public function getIsApprovedAttribute()
    {
        return $this->status === 'approved';
    }

    /**
     * Check if return is rejected.
     */
    public function getIsRejectedAttribute()
    {
        return $this->status === 'rejected';
    }

    /**
     * Get the total value of returned stock.
     */
    public function getTotalValueAttribute()
    {
        return $this->actual_cost * $this->returned_qty;
    }

    /**
     * Get the stock value of returned items.
     */
    public function getStockValueAttribute()
    {
        return $this->stock_price * $this->returned_qty;
    }

    /**
     * Get the selling value of returned items.
     */
    public function getSellingValueAttribute()
    {
        return $this->selling_price * $this->returned_qty;
    }

    /**
     * Approve the return.
     */
    public function approve($userId, $notes = null)
    {
        $this->update([
            'status' => 'approved',
            'approved_by' => $userId,
            'approved_at' => now(),
            'approval_notes' => $notes
        ]);

        return $this;
    }

    /**
     * Reject the return.
     */
    public function reject($userId, $notes = null)
    {
        $this->update([
            'status' => 'rejected',
            'approved_by' => $userId,
            'approved_at' => now(),
            'approval_notes' => $notes
        ]);

        return $this;
    }
}