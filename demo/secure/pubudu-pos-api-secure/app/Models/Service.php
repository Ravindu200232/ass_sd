<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'category',
        'description',
        'price',
        'cost',
        'status',
    ];

    protected $casts = [
        'price' => 'float',
        'status' => 'boolean',
    ];
}
