<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\InvPara;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::all();
        return response()->json(['success' => true, 'data' => $categories]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'category_name' => 'required|string|max:255',
            'status' => 'nullable|string'
        ]);

        $invPara = InvPara::first();
        $categoryCode = 'CAT' . str_pad($invPara->category_code, 4, '0', STR_PAD_LEFT);
        $invPara->increment('category_code');

        $category = Category::create([
            'category_code' => $categoryCode,
            'category_name' => $request->category_name,
            'status' => $request->status ?? 'active'
        ]);

        return response()->json(['success' => true, 'data' => $category], 201);
    }

    public function update(Request $request, $id)
    {
        $category = Category::findOrFail($id);
        $category->update($request->all());
        return response()->json(['success' => true, 'data' => $category]);
    }

    public function destroy($id)
    {
        Category::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Category deleted']);
    }
}
