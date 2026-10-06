<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Group;
use Illuminate\Http\Request;

class GroupController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => Group::orderBy('group_name')->get()
        ]);
    }

    public function store(Request $request)
    {
        // V-04: was Group::create($request->all()), which mass-assigns every
        // key in the payload regardless of what the rules below cover.
        // Validation checks the listed keys; it does not filter the payload.
        // Only validated() does that.
        $validated = $request->validate([
            'group_name' => 'required|string|unique:groups,group_name',
            'description' => 'nullable|string',
            'status' => 'nullable|in:active,inactive'
        ]);

        $group = Group::create($validated);

        return response()->json([
            'success' => true,
            'data' => $group,
            'message' => 'Group created successfully'
        ], 201);
    }

    public function show($id)
    {
        $group = Group::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $group
        ]);
    }

    public function update(Request $request, $id)
    {
        $group = Group::findOrFail($id);

        // V-04: see store() - $request->all() bypassed these rules entirely.
        $validated = $request->validate([
            'group_name' => 'required|string|unique:groups,group_name,' . $group->id,
            'description' => 'nullable|string',
            'status' => 'nullable|in:active,inactive'
        ]);

        $group->update($validated);

        return response()->json([
            'success' => true,
            'data' => $group,
            'message' => 'Group updated successfully'
        ]);
    }

    public function destroy($id)
    {
        Group::findOrFail($id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Group deleted successfully'
        ]);
    }
}
