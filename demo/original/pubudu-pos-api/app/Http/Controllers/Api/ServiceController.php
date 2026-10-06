<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class ServiceController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => Service::orderBy('name')->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'category'    => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'price'       => 'required|numeric|min:0',
            'cost'        => 'required|numeric|min:0',
            'status'      => 'boolean',
        ]);

        $service = Service::create($validated);

        return response()->json([
            'success' => true,
            'data' => $service
        ], 201);
    }

    public function show($id)
    {
        return response()->json([
            'success' => true,
            'data' => Service::findOrFail($id)
        ]);
    }

    public function update(Request $request, $id)
    {
        $service = Service::findOrFail($id);

        $validated = $request->validate([
            'name'        => 'sometimes|required|string|max:255',
            'category'    => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'price'       => 'sometimes|required|numeric|min:0',
            'cost'        => 'sometimes|required|numeric|min:0',
            'status'      => 'boolean',
        ]);

        $newPrice = array_key_exists('price', $validated)
            ? (float) $validated['price']
            : (float) $service->price;
        $newCost = array_key_exists('cost', $validated)
            ? (float) $validated['cost']
            : (float) $service->cost;

        if ($newCost > $newPrice) {
            return response()->json([
                'success' => false,
                'message' => 'Cost cannot be higher than price.'
            ], 422);
        }

        $service->update($validated);

        return response()->json([
            'success' => true,
            'data' => $service
        ]);
    }

    public function updatePrice(Request $request)
    {
        $validated = $request->validate([
            'id'    => 'required|integer|exists:services,id',
            'price' => 'required|numeric|min:0',
        ]);

        $service = Service::findOrFail($validated['id']);

        if ((float) $service->cost > (float) $validated['price']) {
            return response()->json([
                'success' => false,
                'message' => 'Cost cannot be higher than price.'
            ], 422);
        }

        $service->update([
            'price' => (float) $validated['price'],
        ]);

        Log::info('Service price updated', [
            'service_id' => $service->id,
            'service_name' => $service->name,
            'original_price' => (float) $service->getOriginal('price'),
            'new_price' => (float) $validated['price'],
            'user_id' => optional($request->user())->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Service price updated successfully',
            'data' => $service->fresh(),
        ]);
    }

    public function destroy($id)
    {
        Service::findOrFail($id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Service deleted successfully'
        ]);
    }
    
    public function bulkImport(Request $request)
{
    try {
        $request->validate([
            'items' => 'required|array|min:1|max:5000',
            'items.*.name'  => 'required|string|max:255',
            'items.*.category' => 'nullable|string|max:255',
            'items.*.description' => 'nullable|string',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.cost'  => 'required|numeric|min:0',
            'items.*.status' => 'nullable|boolean',
        ]);

        $items = $request->items;

        // normalize string
        $toStr = function ($v) {
            if ($v === null) return null;
            $v = trim((string)$v);
            return $v === '' ? null : $v;
        };

        // 1) remove duplicates inside file (name, case-insensitive)
        $uniqueMap = [];
        foreach ($items as $it) {
            $name = $toStr($it['name'] ?? null);
            if (!$name) continue;

            $key = mb_strtolower($name);
            if (!isset($uniqueMap[$key])) {
                $uniqueMap[$key] = $it;
                $uniqueMap[$key]['name'] = $name;
            }
        }
        $uniqueItems = array_values($uniqueMap);

        if (count($uniqueItems) === 0) {
            return response()->json([
                'success' => false,
                'message' => 'No valid services to import (Name required).'
            ], 422);
        }

        DB::beginTransaction();

        // 2) existing names in DB (prevent duplicates)
        $names = array_map(fn($x) => $x['name'], $uniqueItems);

        $existingNames = Service::whereIn('name', $names)
            ->pluck('name')
            ->map(fn($n) => mb_strtolower(trim((string)$n)))
            ->toArray();

        $existingSet = array_flip($existingNames);

        // 3) build insert rows (skip duplicates + validate cost<=price)
        $rows = [];
        foreach ($uniqueItems as $it) {
            $name = $toStr($it['name'] ?? null);
            if (!$name) continue;

            if (isset($existingSet[mb_strtolower($name)])) {
                continue;
            }

            $price = (float)($it['price'] ?? 0);
            $cost  = (float)($it['cost'] ?? 0);

            // strict rule: cost cannot be higher than price
            if ($cost > $price) {
                continue; // skip invalid row
            }

            $rows[] = [
                'name' => $name,
                'category' => $toStr($it['category'] ?? null),
                'description' => $toStr($it['description'] ?? null),
                'price' => $price,
                'cost' => $cost,
                'status' => array_key_exists('status', $it) ? (bool)$it['status'] : true,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (count($rows) === 0) {
            DB::rollBack();
            return response()->json([
                'success' => true,
                'message' => 'All items were duplicates or invalid (cost > price).',
                'data' => [
                    'received' => count($items),
                    'unique_in_file' => count($uniqueItems),
                    'inserted' => 0,
                    'skipped' => count($uniqueItems),
                ]
            ], 200);
        }

        // ✅ insertOrIgnore prevents errors if DB has unique constraint later
        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('services')->insertOrIgnore($chunk);
        }

        DB::commit();

        return response()->json([
            'success' => true,
            'message' => 'Bulk import completed successfully.',
            'data' => [
                'received' => count($items),
                'unique_in_file' => count($uniqueItems),
                'inserted' => count($rows),
                'skipped' => (count($uniqueItems) - count($rows)),
            ]
        ], 201);

    } catch (ValidationException $e) {
        DB::rollBack();
        $first = collect($e->errors())->flatten()->first() ?? 'Validation failed.';
        return response()->json(['success' => false, 'message' => $first], 422);

    } catch (\Exception $e) {
        DB::rollBack();
        Log::error("Service bulk import error: ".$e->getMessage());
        return response()->json(['success' => false, 'message' => 'Bulk import failed'], 500);
    }
}

}
