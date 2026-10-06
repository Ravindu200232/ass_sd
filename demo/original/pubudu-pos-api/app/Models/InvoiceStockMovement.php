<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InvoiceStockMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'inv_no',
        'invoice_item_id',
        'grn_item_id',
        'grn_code',
        'product_code',
        'product_name',
        'department_id',
        'movement_type',
        'qty',
        'unit_cost',
        'unit_selling_price',
        'unit_discount',
        'movement_date',
        'created_by',
    ];

    protected $casts = [
        'qty' => 'decimal:3',
        'unit_cost' => 'decimal:2',
        'unit_selling_price' => 'decimal:2',
        'unit_discount' => 'decimal:2',
        'movement_date' => 'date',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class, 'inv_no', 'inv_no');
    }

    public function invoiceItem()
    {
        return $this->belongsTo(InvoiceItem::class);
    }

    public function grnItem()
    {
        return $this->belongsTo(GrnItem::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }
}
