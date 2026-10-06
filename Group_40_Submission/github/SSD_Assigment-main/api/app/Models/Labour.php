<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Labour extends Model
{
    use HasFactory;

    /**
     * Mass-assignable attributes.
     *
     * V-04: 'labour_code' is deliberately ABSENT. It is the immutable business
     * key that other tables join on, and it is generated server-side from the
     * InvPara counter - never supplied by a client. Leaving it out of
     * $fillable means that even if a controller regresses to
     * $model->update($request->all()), the key cannot be rewritten.
     *
     * It is set once, at creation, by direct attribute assignment (which is
     * not subject to mass-assignment protection) in LabourController::store().
     */
    protected $fillable = [
        'labour_name',
        'type'
    ];
}
