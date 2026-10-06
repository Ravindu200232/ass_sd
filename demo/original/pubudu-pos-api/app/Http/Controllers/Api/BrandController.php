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
        $request->validate([
            'brand_name' => 'required|string|max:255',
            'status' => 'nullable|string'
        ]);

        $invPara = InvPara::first();
        $brandCode = 'BRD' . str_pad($invPara->brand_code, 4, '0', STR_PAD_LEFT);
        $invPara->increment('brand_code');

        $brand = Brand::create([
            'brand_code' => $brandCode,
            'brand_name' => $request->brand_name,
            'status' => $request->status ?? 'active'
        ]);

        return response()->json(['success' => true, 'data' => $brand], 201);
    }

    public function update(Request $request, $id)
    {
        $brand = Brand::findOrFail($id);
        $brand->update($request->all());
        return response()->json(['success' => true, 'data' => $brand]);
    }

    public function destroy($id)
    {
        Brand::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Brand deleted']);
    }
}