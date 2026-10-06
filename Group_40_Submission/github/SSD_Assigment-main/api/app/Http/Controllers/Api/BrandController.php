<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\InvPara;
use Illuminate\Http\Request;

class BrandController extends Controller
{
    public function index()
    {
        $brands = Brand::all();
        return response()->json(['success' => true, 'data' => $brands]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'brand_name' => 'required|string|max:255',
            'status' => 'nullable|string'
        ]);

        $invPara = InvPara::first();
        $brandCode = 'BRD' . str_pad($invPara->brand_code, 4, '0', STR_PAD_LEFT);
        $invPara->increment('brand_code');

        // V-04: build from the VALIDATED subset only, then set the
        // server-generated business key by direct assignment - it is no
        // longer mass-assignable (see Brand::$fillable).
        $brand = new Brand($validated);
        $brand->brand_code = $brandCode;
        $brand->status = $validated['status'] ?? 'active';
        $brand->save();

        return response()->json(['success' => true, 'data' => $brand], 201);
    }

    public function update(Request $request, $id)
    {
        $brand = Brand::findOrFail($id);

        // V-04: this was $brand->update($request->all()) with NO validation
        // at all, so any caller could rewrite brand_code - the key every
        // other record joins on. Validate, then assign only what was
        // validated.
        $validated = $request->validate([
            'brand_name' => 'sometimes|required|string|max:255',
            'status' => 'sometimes|nullable|string|in:active,inactive',
        ]);

        $brand->update($validated);
        return response()->json(['success' => true, 'data' => $brand]);
    }

    public function destroy($id)
    {
        Brand::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Brand deleted']);
    }
}