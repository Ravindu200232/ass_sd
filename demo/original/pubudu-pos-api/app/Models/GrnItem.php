<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GrnItem extends Model
{
    use HasFactory;

    protected $table = 'grn_items';

    protected $fillable = [
        'grn_code',
        'product_code',
        'product_name',
        'date',
        'stock_price',
        'selling_price',
        'main_branch_price',
        'discount1',
        'discount2',
        'discount3',
        'discount4',
        'actual_cost',
        'qty',
        'hisqty',
        'subtotal',
        'status'
    ];

    protected $casts = [
        'date' => 'date'
    ];
    
    protected static function booted()
    {
        static::creating(function ($item) {
       
            if (empty($item->hisqty)) {
                $item->hisqty = $item->qty;
            }
        });

        static::updating(function ($item) {
           
            $item->hisqty = $item->getOriginal('hisqty');
        });
    }

    public function grn()
    {
        return $this->belongsTo(Grn::class, 'grn_code', 'grn_code');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_code', 'product_code');
    }

    // Calculate selling price after all discounts
    public function getFinalSellingPriceAttribute()
    {
        $price = $this->main_branch_price;
        
        // Apply discounts sequentially
        if ($this->discount1 > 0) {
            $price = $price - ($price * ($this->discount1 / 100));
        }
        if ($this->discount2 > 0) {
            $price = $price - ($price * ($this->discount2 / 100));
        }
        if ($this->discount3 > 0) {
            $price = $price - ($price * ($this->discount3 / 100));
        }
        if ($this->discount4 > 0) {
            $price = $price - ($price * ($this->discount4 / 100));
        }
        
        return max(0, $price);
    }
}