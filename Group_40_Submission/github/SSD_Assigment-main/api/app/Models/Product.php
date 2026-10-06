<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_code',
        'product_name',
        'description',
        'brand_name',
        'category',
        'group',
        'size',
        'pattern',
        'weight',
        'type'
    ];

    public function grnItems()
    {
        return $this->hasMany(GrnItem::class, 'product_code', 'product_code');
    }

    public function invoiceItems()
    {
        return $this->hasMany(InvoiceItem::class, 'product_code', 'product_code');
    }

    public function availableStock()
    {
        return $this->grnItems()->where('status', 'on')->sum('qty');
    }
}