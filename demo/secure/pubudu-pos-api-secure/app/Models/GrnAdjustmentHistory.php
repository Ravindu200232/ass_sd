<?php
// app/Models/GrnAdjustmentHistory.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GrnAdjustmentHistory extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'grn_adjustment_histories';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'grn_item_id',
        'grn_code',
        'product_code',
        'original_qty',
        'new_qty',
        'adjustment_qty',
        'adjustment_type',
        'original_subtotal',
        'new_subtotal',
        'reason',
        'is_return',
        'return_to_stock',
        'adjusted_by',
        'adjusted_at'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'original_qty' => 'integer',
        'new_qty' => 'integer',
        'adjustment_qty' => 'integer',
        'original_subtotal' => 'decimal:2',
        'new_subtotal' => 'decimal:2',
        'is_return' => 'boolean',
        'return_to_stock' => 'boolean',
        'adjusted_at' => 'datetime'
    ];

    /**
     * Get the GRN item associated with the adjustment.
     */
    public function grnItem()
    {
        return $this->belongsTo(GrnItem::class, 'grn_item_id');
    }

    /**
     * Get the user who made the adjustment.
     */
    public function adjustedBy()
    {
        return $this->belongsTo(User::class, 'adjusted_by');
    }

    /**
     * Get the GRN associated with the adjustment.
     */
    public function grn()
    {
        return $this->belongsTo(Grn::class, 'grn_code', 'grn_code');
    }

    /**
     * Scope a query to only include adjustments for a specific GRN.
     */
    public function scopeForGrn($query, $grnCode)
    {
        return $query->where('grn_code', $grnCode);
    }

    /**
     * Scope a query to only include adjustments for a specific product.
     */
    public function scopeForProduct($query, $productCode)
    {
        return $query->where('product_code', $productCode);
    }

    /**
     * Scope a query to only include adjustments of a specific type.
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('adjustment_type', $type);
    }

    /**
     * Scope a query to only include returns.
     */
    public function scopeReturns($query)
    {
        return $query->where('is_return', true);
    }

    /**
     * Get the change in quantity.
     */
    public function getQuantityChangeAttribute()
    {
        return $this->new_qty - $this->original_qty;
    }

    /**
     * Get the change in subtotal.
     */
    public function getSubtotalChangeAttribute()
    {
        return $this->new_subtotal - $this->original_subtotal;
    }

    /**
     * Get formatted adjustment type.
     */
    public function getFormattedTypeAttribute()
    {
        return ucfirst($this->adjustment_type);
    }

    /**
     * Check if adjustment is an addition.
     */
    public function getIsAdditionAttribute()
    {
        return $this->adjustment_type === 'add';
    }

    /**
     * Check if adjustment is a subtraction.
     */
    public function getIsSubtractionAttribute()
    {
        return $this->adjustment_type === 'subtract';
    }

    /**
     * Check if adjustment is a set operation.
     */
    public function getIsSetAttribute()
    {
        return $this->adjustment_type === 'set';
    }
}