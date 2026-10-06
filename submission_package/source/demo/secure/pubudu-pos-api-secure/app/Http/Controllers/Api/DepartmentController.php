<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\InvPara;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    // Get all departments
    public function index()
    {
        $departments = Department::all();
        return response()->json(['success' => true, 'data' => $departments]);
    }

    // Store a new department
    public function store(Request $request)
    {
        $request->validate([
            'department_name' => 'required|string|max:255',
            'department_address' => 'nullable|string',
            'department_contact' => 'nullable|string'
        ]);

        // Find the last department code or start from 1
        $lastDepartment = Department::orderBy('id', 'desc')->first();
        $nextNumber = $lastDepartment ? (int) substr($lastDepartment->department_code, 3) + 1 : 1;
        
        // Generate department code
        $departmentCode = 'DEP' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);

        // Create department
        $department = Department::create([
            'department_code' => $departmentCode,
            'department_name' => $request->department_name,
            'department_address' => $request->department_address,
            'department_contact' => $request->department_contact,
        ]);

        return response()->json(['success' => true, 'data' => $department], 201);
    }

    // Show single department
    public function show($id)
    {
        $department = Department::findOrFail($id);
        return response()->json(['success' => true, 'data' => $department]);
    }

    // Update department details
    public function update(Request $request, $id)
    {
        $request->validate([
            'department_name' => 'required|string|max:255',
            'department_address' => 'nullable|string',
            'department_contact' => 'nullable|string'
        ]);

        $department = Department::findOrFail($id);

        $department->update([
            'department_name' => $request->department_name,
            'department_address' => $request->department_address,
            'department_contact' => $request->department_contact,
        ]);

        return response()->json(['success' => true, 'data' => $department]);
    }

    // Delete department
    public function destroy($id)
    {
        Department::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Department deleted successfully']);
    }
}