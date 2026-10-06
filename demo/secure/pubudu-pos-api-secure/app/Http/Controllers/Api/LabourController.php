<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Labour;
use App\Models\InvPara;
use Illuminate\Http\Request;

class LabourController extends Controller
{
    public function index()
    {
        $labours = Labour::all();
        return response()->json(['success' => true, 'data' => $labours]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'labour_name' => 'required|string|max:255',
            'type' => 'required|string'
        ]);

        $invPara = InvPara::first();
        $labourCode = 'LAB' . str_pad($invPara->labour_code, 4, '0', STR_PAD_LEFT);
        $invPara->increment('labour_code');

        // V-04: build from the VALIDATED subset only, then set the
        // server-generated business key by direct assignment - it is no
        // longer mass-assignable (see Labour::$fillable).
        $labour = new Labour($validated);
        $labour->labour_code = $labourCode;
        $labour->save();

        return response()->json(['success' => true, 'data' => $labour], 201);
    }

    public function show($id)
    {
        $labour = Labour::findOrFail($id);
        return response()->json(['success' => true, 'data' => $labour]);
    }

    public function update(Request $request, $id)
    {
        $labour = Labour::findOrFail($id);

        // V-04: this was $labour->update($request->all()) with NO validation
        // at all, so any caller could rewrite labour_code - the key invoice
        // service lines join on. Validate, then assign only what was validated.
        $validated = $request->validate([
            'labour_name' => 'sometimes|required|string|max:255',
            'type'        => 'sometimes|required|string',
        ]);

        $labour->update($validated);

        return response()->json(['success' => true, 'data' => $labour]);
    }

    public function destroy($id)
    {
        Labour::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Labour deleted']);
    }
}