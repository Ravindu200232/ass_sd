<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InvoiceItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'inv_no',
        'product_code',
        'grn_code',
        'product_name',
        'date',
        'selling_price',
        'discount',
        'last_selling_price',
        'qty',
        'description',
        'type'
    ];

    protected $casts = [
        'date' => 'date'
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class, 'inv_no', 'inv_no');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_code', 'product_code');
    }

    public function grnItem()
    {
        return $this->belongsTo(GrnItem::class, 'grn_code', 'grn_code');
    }

    public function stockMovements()
    {
        return $this->hasMany(InvoiceStockMovement::class);
    }
}
