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
        $validated = $request->validate([
            'category_name' => 'required|string|max:255',
            'status' => 'nullable|string'
        ]);

        $invPara = InvPara::first();
        $categoryCode = 'CAT' . str_pad($invPara->category_code, 4, '0', STR_PAD_LEFT);
        $invPara->increment('category_code');

        // V-04: build from the VALIDATED subset only, then set the
        // server-generated business key by direct assignment - it is no
        // longer mass-assignable (see Category::$fillable).
        $category = new Category($validated);
        $category->category_code = $categoryCode;
        $category->status = $validated['status'] ?? 'active';
        $category->save();

        return response()->json(['success' => true, 'data' => $category], 201);
    }

    public function update(Request $request, $id)
    {
        $category = Category::findOrFail($id);

        // V-04: this was $category->update($request->all()) with NO validation
        // at all, so any caller could rewrite category_code - the key every
        // other record joins on. Validate, then assign only what was
        // validated.
        $validated = $request->validate([
            'category_name' => 'sometimes|required|string|max:255',
            'status' => 'sometimes|nullable|string|in:active,inactive',
        ]);

        $category->update($validated);
        return response()->json(['success' => true, 'data' => $category]);
    }

    public function destroy($id)
    {
        Category::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Category deleted']);
    }
}
