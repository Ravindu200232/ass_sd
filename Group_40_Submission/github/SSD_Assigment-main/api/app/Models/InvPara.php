<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InvPara extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_name',
        'logo',
        'address',
        'email',
        'phone_no_01',
        'phone_no_02',
        'product_code',
        'brand_code',
        'category_code',
        'user_code',
        'customer_code',
        'labour_code',
        'grn_code',
        'inv_code'
    ];
}
