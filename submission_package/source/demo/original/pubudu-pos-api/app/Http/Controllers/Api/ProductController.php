<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\InvPara;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Exception;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Group;
use Illuminate\Support\Str;



class ProductController extends Controller
{
     public function index()
    {
        try {
            $products = Product::all();

            return response()->json([
                'success' => true,
                'message' => 'Products retrieved successfully.',
                'data' => $products
            ]);

        } catch (Exception $e) {
            Log::error('Product index error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve products.'
            ], 500);
        }
    }

    public function store(Request $request)
{
    try {
        $request->validate([
            'product_name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'brand_name' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:255',
            'group' => 'nullable|string|max:255',
            'size' => 'nullable|string|max:100',
            'pattern' => 'nullable|string|max:255',
            'weight' => 'nullable|string|max:100',
            'type' => 'nullable|string|max:255'
        ]);

        DB::beginTransaction();

        // Get the last product code or start from 1
        $lastProduct = Product::orderBy('id', 'desc')->first();
        
        if ($lastProduct && !empty($lastProduct->product_code)) {
            // Extract number from last product code
            $lastNumber = intval(preg_replace('/[^0-9]/', '', $lastProduct->product_code));
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        // Generate product code
        $productCode = 'PRD' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);

        // Check if product code already exists
        $existingProduct = Product::where('product_code', $productCode)->first();
        if ($existingProduct) {
            // If code exists, find next available number
            $nextNumber = $nextNumber + 1;
            $productCode = 'PRD' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
        }

        // Clean the description by removing product_name if it's included
        $description = $request->description;
        $productName = trim($request->product_name);
        
        if (!empty($description)) {
            $description = trim($description);
            
            // Remove product_name from beginning of description (case insensitive)
            $pattern = '/^' . preg_quote($productName, '/') . '\s*[-—:]\s*/i';
            $description = preg_replace($pattern, '', $description);
            
            // Also check if description starts with product_name followed by space
            if (strtolower(substr($description, 0, strlen($productName))) === strtolower($productName)) {
                $description = trim(substr($description, strlen($productName)));
            }
            
            // Remove any leading/trailing dashes or colons
            $description = trim($description, " -—:");
            
            // If after cleaning, description is empty or same as product_name, don't combine
            if (empty($description) || strtolower($description) === strtolower($productName)) {
                $combinedName = $productName;
                $description = $productName; // Store product_name in description
            } else {
                $combinedName = $productName . ' - ' . $description;
            }
        } else {
            $combinedName = $productName;
            $description = $productName; // Store product_name in description
        }

        // Create product - store combined name in product_name field
        $product = Product::create([
            'product_code' => $productCode,

            'product_name' =>  $request->description, // Store combined name here
            'description' => $request->description, // Still store description separately if needed
            'brand_name' => $request->brand_name,
            'category' => $request->category,
            'group' => $request->group,
            'size' => $request->size,
            'pattern' => $request->pattern,
            'weight' => $request->weight,
            'type' => $request->type
        ]);

        DB::commit();

        return response()->json([
            'success' => true,
            'message' => 'Product created successfully.',
            'data' => $product
        ], 201);

    } catch (ValidationException $e) {
        DB::rollBack();
        $errors = $e->errors();
        $firstError = reset($errors)[0] ?? 'Validation failed.';
        
        return response()->json([
            'success' => false,
            'message' => $firstError
        ], 422);

    } catch (Exception $e) {
        DB::rollBack();
        Log::error('Product creation error: ' . $e->getMessage());

        return response()->json([
            'success' => false,
            'message' => 'Failed to create product. Please try again.'
        ], 500);
    }
}

    public function show($id)
    {
        try {
            if (!is_numeric($id) || $id <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid product ID.'
                ], 400);
            }

            $product = Product::find($id);

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found.'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Product retrieved successfully.',
                'data' => $product
            ]);

        } catch (Exception $e) {
            Log::error('Product show error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve product.'
            ], 500);
        }
    }

public function update(Request $request, $id)
    {
        try {
            if (!is_numeric($id) || $id <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid product ID.'
                ], 400);
            }

            $request->validate([
                'product_name' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string|max:1000',
                'brand_name' => 'nullable|string|max:255',
                'category' => 'nullable|string|max:255',
                'group' => 'nullable|string|max:255',
                'size' => 'nullable|string|max:100',
                'pattern' => 'nullable|string|max:255',
                'weight' => 'nullable|string|max:100',
                'type' => 'nullable|string|max:255'
            ]);

            $product = Product::find($id);

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found.'
                ], 404);
            }

            // Prepare update data
            $updateData = [
                'description' => $request->has('description') ? $request->description : $product->description,
                'brand_name' => $request->has('brand_name') ? $request->brand_name : $product->brand_name,
                'category' => $request->has('category') ? $request->category : $product->category,
                'group' => $request->has('group') ? $request->group : $product->group,
                'size' => $request->has('size') ? $request->size : $product->size,
                'pattern' => $request->has('pattern') ? $request->pattern : $product->pattern,
                'weight' => $request->has('weight') ? $request->weight : $product->weight,
                'type' => $request->has('type') ? $request->type : $product->type
            ];

            // Handle product_name with duplicate check
            if ($request->has('product_name')) {
                $updateData['product_name'] = $request->product_name;
                
                // Check if product name already exists (excluding current product)
                if ($request->product_name !== $product->product_name) {
                    $existingProduct = Product::where('product_name', $request->product_name)
                        ->where('id', '!=', $id)
                        ->first();

                    if ($existingProduct) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Product name already exists.'
                        ], 409);
                    }
                }
            } else {
                // Keep existing product_name if not provided
                $updateData['product_name'] = $product->product_name;
            }

            // Handle description uniqueness check
            if ($request->has('description') && $request->description !== $product->description) {
                $existingProduct = Product::where('description', $request->description)
                    ->where('id', '!=', $id)
                    ->first();

                if ($existingProduct) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Product description already exists.'
                    ], 409);
                }
            }

            $product->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Product updated successfully.',
                'data' => $product
            ]);

        } catch (ValidationException $e) {
            $errors = $e->errors();
            $firstError = reset($errors)[0] ?? 'Validation failed.';
            
            return response()->json([
                'success' => false,
                'message' => $firstError
            ], 422);

        } catch (Exception $e) {
            Log::error('Product update error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to update product.'
            ], 500);
        }
    }

    // Import update endpoint (no duplicate checks)
    public function updateForImport(Request $request, $id)
    {
        try {
            if (!is_numeric($id) || $id <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid product ID.'
                ], 400);
            }

            $request->validate([
                'product_name' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string|max:1000',
                'brand_name' => 'nullable|string|max:255',
                'category' => 'nullable|string|max:255',
                'group' => 'nullable|string|max:255',
                'size' => 'nullable|string|max:100',
                'pattern' => 'nullable|string|max:255',
                'weight' => 'nullable|string|max:100',
                'type' => 'nullable|string|max:255'
            ]);

            $product = Product::find($id);

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found.'
                ], 404);
            }

            // Prepare update data - NO DUPLICATE CHECKS FOR IMPORTS
            $updateData = [
                'product_name' => $request->has('product_name') ? $request->product_name : $product->product_name,
                'description' => $request->has('description') ? $request->description : $product->description,
                'brand_name' => $request->has('brand_name') ? $request->brand_name : $product->brand_name,
                'category' => $request->has('category') ? $request->category : $product->category,
                'group' => $request->has('group') ? $request->group : $product->group,
                'size' => $request->has('size') ? $request->size : $product->size,
                'pattern' => $request->has('pattern') ? $request->pattern : $product->pattern,
                'weight' => $request->has('weight') ? $request->weight : $product->weight,
                'type' => $request->has('type') ? $request->type : $product->type
            ];

            $product->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Product updated successfully for import.',
                'data' => $product
            ]);

        } catch (ValidationException $e) {
            $errors = $e->errors();
            $firstError = reset($errors)[0] ?? 'Validation failed.';
            
            return response()->json([
                'success' => false,
                'message' => $firstError
            ], 422);

        } catch (Exception $e) {
            Log::error('Product import update error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to update product for import.'
            ], 500);
        }
    }


    public function destroy($id)
    {
        try {
            if (!is_numeric($id) || $id <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid product ID.'
                ], 400);
            }

            $product = Product::find($id);

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found.'
                ], 404);
            }

            $product->delete();

            return response()->json([
                'success' => true,
                'message' => 'Product deleted successfully.'
            ]);

        } catch (Exception $e) {
            Log::error('Product deletion error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete product.'
            ], 500);
        }
    }

    public function getStock($productCode)
    {
        try {
            if (empty($productCode)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product code is required.'
                ], 400);
            }

            $product = Product::where('product_code', $productCode)->first();

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found.'
                ], 404);
            }

            $stock = $product->grnItems()->where('status', 'on')->get();
            $totalStock = $stock->sum('qty');
            
            return response()->json([
                'success' => true,
                'message' => 'Product stock retrieved successfully.',
                'data' => [
                    'product' => $product,
                    'batches' => $stock,
                    'total_stock' => $totalStock
                ]
            ]);

        } catch (Exception $e) {
            Log::error('Product stock retrieval error: ' . $e->getMessage(), [
                'product_code' => $productCode,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve product stock.'
            ], 500);
        }
    }

    // Additional method: Search products
    public function search(Request $request)
    {
        try {
            $request->validate([
                'query' => 'required|string|min:1|max:255'
            ]);

            $query = $request->get('query');

            $products = Product::where('product_code', 'like', "%{$query}%")
                ->orWhere('product_name', 'like', "%{$query}%")
                ->orWhere('brand_name', 'like', "%{$query}%")
                ->orWhere('category', 'like', "%{$query}%")
                ->get()
                ->map(function ($product) {
                    $product->available_stock = $product->grnItems()->where('status', 'on')->sum('qty');
                    return $product;
                });

            return response()->json([
                'success' => true,
                'message' => 'Products search completed.',
                'data' => $products
            ]);

        } catch (ValidationException $e) {
            $errors = $e->errors();
            $firstError = reset($errors)[0] ?? 'Validation failed.';
            
            return response()->json([
                'success' => false,
                'message' => $firstError
            ], 422);

        } catch (Exception $e) {
            Log::error('Product search error: ' . $e->getMessage(), [
                'query' => $request->get('query'),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to search products.'
            ], 500);
        }
    }

    // Additional method: Get products by category
    public function getByCategory($category)
    {
        try {
            if (empty($category)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Category is required.'
                ], 400);
            }

            $products = Product::where('category', $category)
                ->get()
                ->map(function ($product) {
                    $product->available_stock = $product->grnItems()->where('status', 'on')->sum('qty');
                    return $product;
                });

            return response()->json([
                'success' => true,
                'message' => 'Products by category retrieved successfully.',
                'data' => $products
            ]);

        } catch (Exception $e) {
            Log::error('Products by category error: ' . $e->getMessage(), [
                'category' => $category,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve products by category.'
            ], 500);
        }
    }
    
    
public function bulkImport(Request $request)
{
    try {
        $request->validate([
            'items' => 'required|array|min:1|max:5000',
            'items.*.description' => 'required|max:1000',
            'items.*.brand_name' => 'nullable|max:255',
            'items.*.category' => 'nullable|max:255',
            'items.*.group' => 'nullable|max:255',
            'items.*.size' => 'nullable|max:100',
            'items.*.pattern' => 'nullable|max:255',
            'items.*.weight' => 'nullable|max:100',
            'items.*.type' => 'nullable|max:255',
        ]);

        $items = $request->items;

        // Safe string cast
        $toStr = function ($v) {
            if ($v === null) return null;
            $v = trim((string)$v);
            return $v === '' ? null : $v;
        };

        DB::beginTransaction();

        /* -------------------------------------------------
           1) Remove duplicates inside file by description
        --------------------------------------------------*/
        $uniqueMap = [];
        foreach ($items as $item) {
            $desc = $toStr($item['description'] ?? null);
            if (!$desc) continue;

            $key = mb_strtolower($desc);
            if (!isset($uniqueMap[$key])) {
                $uniqueMap[$key] = $item;
                $uniqueMap[$key]['description'] = $desc;
            }
        }
        $uniqueItems = array_values($uniqueMap);

        if (count($uniqueItems) === 0) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'No valid items to import'
            ], 422);
        }

        /* -------------------------------------------------
           2) Remove duplicates vs DB (products.description)
        --------------------------------------------------*/
        $descriptions = array_map(fn($x) => $x['description'], $uniqueItems);

        $existingDescriptions = Product::whereIn('description', $descriptions)
            ->pluck('description')
            ->map(fn($d) => mb_strtolower(trim((string)$d)))
            ->toArray();

        $existingSet = array_flip($existingDescriptions);

        /* -------------------------------------------------
           3) Collect unique brand/category/group names
              and auto-create missing ones
        --------------------------------------------------*/
        $brandNames = [];
        $categoryNames = [];
        $groupNames = [];

        foreach ($uniqueItems as $item) {
            $b = $toStr($item['brand_name'] ?? null);
            $c = $toStr($item['category'] ?? null);
            $g = $toStr($item['group'] ?? null);

            if ($b) $brandNames[mb_strtolower($b)] = $b;
            if ($c) $categoryNames[mb_strtolower($c)] = $c;
            if ($g) $groupNames[mb_strtolower($g)] = $g;
        }

        // ---- Brands: check existing, create missing
        if (count($brandNames)) {
            $existingBrands = Brand::whereIn('brand_name', array_values($brandNames))
                ->pluck('brand_name')
                ->map(fn($x) => mb_strtolower(trim((string)$x)))
                ->toArray();

            $existingBrandSet = array_flip($existingBrands);

            foreach ($brandNames as $k => $brandName) {
                if (!isset($existingBrandSet[$k])) {
                    Brand::create([
                        'brand_code' => 'BR' . strtoupper(Str::random(6)),
                        'brand_name' => $brandName,
                        'status' => 'active',
                    ]);
                }
            }
        }

        // ---- Categories: you store product.category as STRING, so create category_name too
        if (count($categoryNames)) {
            $existingCats = Category::whereIn('category_name', array_values($categoryNames))
                ->pluck('category_name')
                ->map(fn($x) => mb_strtolower(trim((string)$x)))
                ->toArray();

            $existingCatSet = array_flip($existingCats);

            foreach ($categoryNames as $k => $categoryName) {
                if (!isset($existingCatSet[$k])) {
                    Category::create([
                        'category_code' => 'CAT' . strtoupper(Str::random(6)),
                        'category_name' => $categoryName,
                        'status' => 'active',
                    ]);
                }
            }
        }

        // ---- Groups
        if (count($groupNames)) {
            $existingGroups = Group::whereIn('group_name', array_values($groupNames))
                ->pluck('group_name')
                ->map(fn($x) => mb_strtolower(trim((string)$x)))
                ->toArray();

            $existingGroupSet = array_flip($existingGroups);

            foreach ($groupNames as $k => $groupName) {
                if (!isset($existingGroupSet[$k])) {
                    Group::create([
                        'group_name' => $groupName,
                        'description' => null,
                        'status' => 'active',
                    ]);
                }
            }
        }

        /* -------------------------------------------------
           4) Build product insert rows
              product_name ALWAYS = description
        --------------------------------------------------*/
        $rows = [];
        foreach ($uniqueItems as $item) {
            $desc = $toStr($item['description'] ?? null);
            if (!$desc) continue;

            if (isset($existingSet[mb_strtolower($desc)])) {
                continue;
            }

            $rows[] = [
                'product_name' => $desc,
                'description'  => $desc,
                'brand_name'   => $toStr($item['brand_name'] ?? null),
                'category'     => $toStr($item['category'] ?? null),
                'group'        => $toStr($item['group'] ?? null),
                'size'         => $toStr($item['size'] ?? null),
                'pattern'      => $toStr($item['pattern'] ?? null),
                'weight'       => $toStr($item['weight'] ?? null),
                'type'         => $toStr($item['type'] ?? null),
                'created_at'   => now(),
                'updated_at'   => now(),
            ];
        }

        if (count($rows) === 0) {
            DB::rollBack();
            return response()->json([
                'success' => true,
                'message' => 'All items already exist'
            ]);
        }

        /* -------------------------------------------------
           5) Generate product_code sequentially
        --------------------------------------------------*/
        $last = Product::orderByDesc('id')->first();
        $lastNo = $last ? intval(preg_replace('/\D/', '', $last->product_code)) : 0;

        foreach ($rows as $i => $row) {
            $rows[$i]['product_code'] = 'PRD' . str_pad($lastNo + $i + 1, 4, '0', STR_PAD_LEFT);
        }

        /* -------------------------------------------------
           6) Insert products (ignore unique collisions)
        --------------------------------------------------*/
        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('products')->insertOrIgnore($chunk);
        }

        DB::commit();

        return response()->json([
            'success' => true,
            'message' => 'Bulk import successful',
            'inserted' => count($rows),
        ], 201);

    } catch (\Illuminate\Validation\ValidationException $e) {
        DB::rollBack();
        return response()->json([
            'success' => false,
            'message' => collect($e->errors())->flatten()->first()
        ], 422);

    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('Bulk import error', ['error' => $e->getMessage()]);

        return response()->json([
            'success' => false,
            'message' => 'Bulk import failed'
        ], 500);
    }
}





}