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
        $request->validate([
            'labour_name' => 'required|string|max:255',
            'type' => 'required|string'
        ]);

        $invPara = InvPara::first();
        $labourCode = 'LAB' . str_pad($invPara->labour_code, 4, '0', STR_PAD_LEFT);
        $invPara->increment('labour_code');

        $labour = Labour::create([
            'labour_code' => $labourCode,
            'labour_name' => $request->labour_name,
            'type' => $request->type
        ]);

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
        $labour->update($request->all());
        return response()->json(['success' => true, 'data' => $labour]);
    }

    public function destroy($id)
    {
        Labour::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Labour deleted']);
    }
}