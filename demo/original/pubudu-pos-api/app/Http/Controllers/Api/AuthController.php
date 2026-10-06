<?php
// app/Http/Controllers/Api/AuthController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\InvPara;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\QueryException;
use Exception;

class AuthController extends Controller
{
    /**
     * Handle user login
     */
    public function login(Request $request)
    {
        try {
            $request->validate([
                'username' => 'required|string',
                'password' => 'required|string',
            ]);

            $user = User::where('username', $request->username)->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'The provided username does not exist.'
                ], 404);
            }

            if (!Hash::check($request->password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'The provided password is incorrect.'
                ], 401);
            }

            // Check if user is active (if you have an active status field)
            if (isset($user->is_active) && !$user->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Your account has been deactivated. Please contact administrator.'
                ], 403);
            }

            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'data' => [
                    'user' => $user->makeHidden(['password']),
                    'token' => $token,
                    'token_type' => 'Bearer'
                ]
            ], 200);

        } catch (ValidationException $e) {
            $errors = $e->errors();
            $firstError = reset($errors)[0] ?? 'Validation failed';
            
            return response()->json([
                'success' => false,
                'message' => $firstError
            ], 422);
        } catch (Exception $e) {
            Log::error('Login error: ' . $e->getMessage(), [
                'username' => $request->username,
                'ip' => $request->ip()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An unexpected error occurred. Please try again later.'
            ], 500);
        }
    }

    /**
     * Handle user logout
     */
    public function logout(Request $request)
    {
        try {
            if (!$request->user()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No authenticated user found.'
                ], 401);
            }

            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Logged out successfully'
            ], 200);

        } catch (Exception $e) {
            Log::error('Logout error: ' . $e->getMessage(), [
                'user_id' => $request->user()?->id,
                'ip' => $request->ip()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while logging out.'
            ], 500);
        }
    }

    /**
     * Get current authenticated user
     */
    public function me(Request $request)
    {
        try {
            if (!$request->user()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No authenticated user found.'
                ], 401);
            }

            return response()->json([
                'success' => true,
                'message' => 'User retrieved successfully',
                'data' => $request->user()->makeHidden(['password'])
            ], 200);

        } catch (Exception $e) {
            Log::error('Get user error: ' . $e->getMessage(), [
                'user_id' => $request->user()?->id,
                'ip' => $request->ip()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve user data.'
            ], 500);
        }
    }

    /**
     * Handle user registration
     */
    public function register(Request $request)
{
    try {
        $request->validate([
            'full_name' => 'required|string|max:255',
            'nic_no' => 'required|string|unique:users,nic_no',
            'phone_no_01' => 'required|string',
            'phone_no_02' => 'nullable|string',
            'username' => 'required|string|unique:users,username|min:3|max:50',
            'password' => 'required|string|min:6',
            'role' => 'required|in:admin,employee',
            'department_id' => 'nullable|exists:departments,id'
        ]);

        // Start database transaction for atomic operations
        \DB::beginTransaction();

        // Get or Create InvPara
        $invPara = InvPara::first();
        
        if (!$invPara) {
            try {
                $invPara = InvPara::create([
                    'company_name' => 'My Company',
                    'logo' => 'logo.png',
                    'address' => '123 Main Street',
                    'email' => 'info@company.com',
                    'phone_no_01' => '0771234567',
                    'phone_no_02' => '0112345678',
                    'product_code' => 1,
                    'brand_code' => 1,
                    'category_code' => 1,
                    'user_code' => 1,
                    'customer_code' => 1,
                    'labour_code' => 1,
                    'grn_code' => 1,
                    'inv_code' => 1
                ]);
            } catch (QueryException $e) {
                \DB::rollBack();
                Log::error('InvPara creation failed: ' . $e->getMessage());

                return response()->json([
                    'success' => false,
                    'message' => 'System configuration error. Please contact administrator.'
                ], 500);
            }
        }

        // Generate user_code
        $userCode = 'USER' . str_pad($invPara->user_code, 4, '0', STR_PAD_LEFT);
        
        try {
            $invPara->increment('user_code');
        } catch (QueryException $e) {
            \DB::rollBack();
            Log::error('InvPara increment failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate user code. Please try again.'
            ], 500);
        }

        // Create user
        try {
            $user = User::create([
                'user_code' => $userCode,
                'full_name' => $request->full_name,
                'nic_no' => $request->nic_no,
                'phone_no_01' => $request->phone_no_01,
                'phone_no_02' => $request->phone_no_02,
                'username' => $request->username,
                'password' => Hash::make($request->password),
                'role' => $request->role,
                'department_id' => $request->department_id,
                'is_active' => true
            ]);

            $token = $user->createToken('auth-token')->plainTextToken;

            \DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'User registered successfully',
                'data' => [
                    'user' => $user->load('department')->makeHidden(['password']),
                    'token' => $token,
                    'token_type' => 'Bearer'
                ]
            ], 201);

        } catch (QueryException $e) {
            \DB::rollBack();
            
            // Handle duplicate entry errors
            if ($e->errorInfo[1] == 1062) {
                $errorMessage = 'The username or NIC number already exists.';
                
                if (str_contains($e->getMessage(), 'users_username_unique')) {
                    $errorMessage = 'The username is already taken.';
                } elseif (str_contains($e->getMessage(), 'users_nic_no_unique')) {
                    $errorMessage = 'The NIC number is already registered.';
                }

                return response()->json([
                    'success' => false,
                    'message' => $errorMessage
                ], 409);
            }

            Log::error('User creation failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to create user account. Please try again.'
            ], 500);
        }

    } catch (ValidationException $e) {
        $errors = $e->errors();
        $firstError = reset($errors)[0] ?? 'Validation failed';
        
        return response()->json([
            'success' => false,
            'message' => $firstError
        ], 422);
    } catch (Exception $e) {
        \DB::rollBack();
        Log::error('Registration error: ' . $e->getMessage(), [
            'username' => $request->username,
            'ip' => $request->ip()
        ]);

        return response()->json([
            'success' => false,
            'message' => 'An unexpected error occurred. Please try again later.'
        ], 500);
    }
}

    /**
     * Handle token refresh
     */
    public function refresh(Request $request)
    {
        try {
            if (!$request->user()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No authenticated user found.'
                ], 401);
            }

            $request->user()->currentAccessToken()->delete();
            $token = $request->user()->createToken('auth-token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Token refreshed successfully',
                'data' => [
                    'token' => $token,
                    'token_type' => 'Bearer'
                ]
            ], 200);

        } catch (Exception $e) {
            Log::error('Token refresh error: ' . $e->getMessage(), [
                'user_id' => $request->user()?->id,
                'ip' => $request->ip()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while refreshing token.'
            ], 500);
        }
    }

    /**
     * Check username availability
     */
    public function checkUsername(Request $request)
    {
        try {
            $request->validate([
                'username' => 'required|string|min:3|max:50'
            ]);

            $exists = User::where('username', $request->username)->exists();

            return response()->json([
                'success' => true,
                'message' => 'Username check completed',
                'data' => [
                    'username' => $request->username,
                    'available' => !$exists
                ]
            ], 200);

        } catch (ValidationException $e) {
            $errors = $e->errors();
            $firstError = reset($errors)[0] ?? 'Validation failed';
            
            return response()->json([
                'success' => false,
                'message' => $firstError
            ], 422);
        } catch (Exception $e) {
            Log::error('Username check error: ' . $e->getMessage(), [
                'username' => $request->username,
                'ip' => $request->ip()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to check username availability.'
            ], 500);
        }
    }

    /**
 * Update user profile
 */
public function updateProfile(Request $request)
{
    try {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'No authenticated user found.'
            ], 401);
        }

        $request->validate([
            'full_name' => 'sometimes|required|string|max:255',
            'phone_no_01' => 'sometimes|required|string',
            'phone_no_02' => 'nullable|string',
            'department_id' => 'nullable|exists:departments,id'
        ]);

        $user->update($request->only(['full_name', 'phone_no_01', 'phone_no_02', 'department_id']));

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => $user->load('department')->makeHidden(['password'])
        ], 200);

    } catch (ValidationException $e) {
        $errors = $e->errors();
        $firstError = reset($errors)[0] ?? 'Validation failed';
        
        return response()->json([
            'success' => false,
            'message' => $firstError
        ], 422);
    } catch (Exception $e) {
        Log::error('Profile update error: ' . $e->getMessage(), [
            'user_id' => $request->user()?->id,
            'ip' => $request->ip()
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Failed to update profile.'
        ], 500);
    }
}

public function getAllUsers(Request $request)
{
    try {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'No authenticated user found.'
            ], 401);
        }

        if ($user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only admins can access this resource.'
            ], 403);
        }

        $users = User::with('department')->get()->makeHidden(['password']);

        return response()->json([
            'success' => true,
            'message' => 'Users retrieved successfully',
            'data' => $users
        ], 200);

    } catch (Exception $e) {
        Log::error('Get all users error: ' . $e->getMessage(), [
            'user_id' => $request->user()?->id,
            'ip' => $request->ip()
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Failed to retrieve users.'
        ], 500);
    }
}


 public function update(Request $request, $id)
    {
        try {
            $auth = $request->user();

            if (!$auth || $auth->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Only admins can update users.'
                ], 403);
            }

            $user = User::find($id);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found.'
                ], 404);
            }

            $request->validate([
                'full_name' => 'required|string|max:255',
                'nic_no' => "required|string|unique:users,nic_no,$id",
                'phone_no_01' => 'required|string',
                'phone_no_02' => 'nullable|string',
                'username' => "required|string|min:3|max:50|unique:users,username,$id",
                'password' => 'nullable|string|min:6',
                'role' => 'required|in:admin,employee,manager',
                'department_id' => 'nullable|exists:departments,id',
                'is_active' => 'nullable|boolean',
            ]);

            $data = $request->only([
                'full_name',
                'nic_no',
                'phone_no_01',
                'phone_no_02',
                'username',
                'role',
                'department_id',
                'is_active',
            ]);

            if ($request->filled('password')) {
                $data['password'] = Hash::make($request->password);
            }

            $user->update($data);

            return response()->json([
                'success' => true,
                'message' => 'User updated successfully',
                'data' => $user->makeHidden(['password'])
            ], 200);

        } catch (ValidationException $e) {
            $errors = $e->errors();
            $firstError = reset($errors)[0] ?? 'Validation failed';

            return response()->json([
                'success' => false,
                'message' => $firstError
            ], 422);

        } catch (Exception $e) {
            Log::error('User update error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to update user.'
            ], 500);
        }
    }

    // Delete user (Admin only)
    public function destroy(Request $request, $id)
    {
        try {
            $auth = $request->user();

            if (!$auth || $auth->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Only admins can delete users.'
                ], 403);
            }

            $user = User::find($id);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found.'
                ], 404);
            }

            // Optional: prevent deleting yourself
            if ($auth->id == $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot delete your own account.'
                ], 400);
            }

            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully'
            ], 200);

        } catch (Exception $e) {
            Log::error('User delete error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete user.'
            ], 500);
        }
    }
}