<?php
// app/Http/Controllers/Api/AuthController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\InvPara;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use App\Support\AuditLogger;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\QueryException;
use Exception;

class AuthController extends Controller
{
    /**
     * A real bcrypt hash of a value nobody will ever submit.
     *
     * V-05a: used to spend the same CPU verifying a password for a username
     * that does not exist as for one that does, so response time cannot be used
     * to enumerate accounts after the error messages were made identical. It is
     * never compared against anything a user can supply.
     */
    private const DUMMY_HASH = '$2y$12$M1kDGKHXRSBVDoKOTLiZ8e9zY.Cwqy6mSoCkTlrDMMnVc2HlZbmKq';

    /**
     * Password rules applied wherever a password is set or changed.
     *
     * V-05c: the original rule was 'required|string|min:6' at both
     * AuthController:162 (register) and :494 (admin update). Six characters,
     * no complexity, no breach check - "123456" was accepted, confirmed
     * against the original application, and that is the single most commonly
     * used password in the world.
     *
     * Twelve characters with mixed case, a digit and a symbol, plus
     * uncompromised(), which checks the candidate against the Have I Been
     * Pwned k-anonymity range API: only the first five characters of the
     * SHA-1 hash leave the server, so the password itself is never
     * transmitted. If that service is unreachable the rule passes rather than
     * locking staff out of account creation.
     *
     * CWE-521 Weak Password Requirements
     */
    private static function passwordRules(): Password
    {
        return Password::min(12)
            ->mixedCase()
            ->numbers()
            ->symbols()
            ->uncompromised();
    }

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

            /*
             * V-05a: username enumeration.
             *
             * This block used to return two DIFFERENT answers:
             *
             *   unknown username     -> 404 "The provided username does not exist."
             *   wrong password       -> 401 "The provided password is incorrect."
             *
             * An attacker could therefore harvest every valid username first -
             * cheaply, and without ever guessing a password - and only then
             * spray passwords against confirmed accounts. Usernames here are
             * predictable staff names, so that first step was close to free.
             *
             * Both cases now return the same status, the same message and take
             * roughly the same time. Hash::check on a dummy hash when the user
             * does not exist keeps the response time from leaking what the
             * message no longer does: without it, a missing user returns in
             * microseconds while a real one costs a full bcrypt round at cost
             * 12, which is a timing oracle that says the same thing.
             *
             * CWE-204 Observable Response Discrepancy
             * CWE-208 Observable Timing Discrepancy
             */
            $passwordValid = $user
                ? Hash::check($request->password, $user->password)
                : Hash::check($request->password, self::DUMMY_HASH);

            if (! $user || ! $passwordValid) {
                AuditLogger::loginFailed(
                    (string) $request->username,
                    $user ? 'incorrect password' : 'no such username'
                );

                return response()->json([
                    'success' => false,
                    'message' => 'The username or password is incorrect.',
                ], 401);
            }

            if (! $user->is_active) {
                AuditLogger::loginFailed((string) $request->username, 'account deactivated');

                return response()->json([
                    'success' => false,
                    'message' => 'Your account has been deactivated. Please contact your administrator.',
                ], 403);
            }

            /*
             * V-06: token hygiene at issue time.
             *
             *  - Prior tokens are revoked, so a session is not left alive on a
             *    device the user has walked away from, and a stolen token stops
             *    working the moment the real user signs in again. This app is a
             *    till: one person, one active session, is the correct model.
             *  - Abilities are scoped to the role rather than the default ['*'],
             *    so a token issued to a cashier cannot be replayed against an
             *    administrator endpoint even if the role changes later.
             *  - Expiry comes from config/sanctum.php (8 hours), which was null.
             */
            $user->tokens()->delete();

            $abilities = $user->role === 'admin' ? ['role:admin'] : ['role:employee'];
            $token = $user->createToken('auth-token', $abilities)->plainTextToken;

            AuditLogger::record(
                action: 'auth.login.succeeded',
                description: sprintf('%s (%s) signed in with a password.', $user->username, $user->role),
                subject: ['user', $user->id],
                new: ['abilities' => $abilities, 'method' => 'password'],
                severity: AuditLogger::SEVERITY_INFO,
            );

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'data' => [
                    'user' => $user->makeHidden(['password']),
                    'token' => $token,
                    'token_type' => 'Bearer',
                    'expires_in' => config('sanctum.expiration') * 60,
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
            // V-05c: was 'required|string|min:6'.
            'password' => ['required', 'string', self::passwordRules()],
            // V-01: `role` is still accepted here, but this endpoint now sits
            // behind auth:sanctum + admin (routes/api.php), so the caller is an
            // authenticated administrator rather than anybody on the internet.
            // 'manager' is deliberately absent: the users table enum only has
            // admin and employee, and the frontend offered a "Manager" option
            // that the rest of the app does not understand.
            'role' => 'required|in:admin,employee',
            'department_id' => 'nullable|exists:departments,id',
            // Needed to match a Google account at sign-in. Nullable so existing
            // password-only accounts are unaffected.
            'email' => 'nullable|email|max:255|unique:users,email',
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
                'email' => $request->email,
                'is_active' => true
            ]);

            /*
             * V-01: this used to mint and return a Sanctum token here:
             *
             *     $token = $user->createToken('auth-token')->plainTextToken;
             *
             * Combined with the route being public, an anonymous POST with
             * "role":"admin" returned a working administrator credential.
             *
             * The route is now admin-only, but issuing a token is still wrong:
             * an administrator creating a staff account has no business
             * receiving that account's session. The new user signs in - or signs
             * in with Google - to get their own.
             */
            AuditLogger::record(
                action: 'user.created',
                description: sprintf(
                    'Created %s account "%s" (%s)%s.',
                    $user->role,
                    $user->username,
                    $user->user_code,
                    $user->department_id ? ' in department ' . $user->department_id : ''
                ),
                subject: ['user', $user->id],
                new: [
                    'username' => $user->username,
                    'role' => $user->role,
                    'department_id' => $user->department_id,
                    'email' => $user->email,
                ],
                severity: $user->role === 'admin'
                    ? AuditLogger::SEVERITY_CRITICAL
                    : AuditLogger::SEVERITY_WARNING,
            );

            \DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'User registered successfully',
                'data' => [
                    'user' => $user->load('department')->makeHidden(['password']),
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
     * Sign out of every device.
     *
     * V-06: logout() deletes only currentAccessToken(). If a cashier suspects
     * their session was taken - which, given the stored XSS in V-13, was a
     * realistic worry - there was no way to end the other one. This revokes
     * every token the user holds.
     */
    public function logoutAll(Request $request)
    {
        $user = $request->user();

        $count = $user->tokens()->count();
        $user->tokens()->delete();

        AuditLogger::record(
            action: 'auth.logout.all',
            description: sprintf('%s revoked all %d of their sessions.', $user->username, $count),
            subject: ['user', $user->id],
            severity: AuditLogger::SEVERITY_NOTICE,
        );

        return response()->json([
            'success' => true,
            'message' => 'All sessions have been signed out.',
        ], 200);
    }

    /**
     * Change one's own password.
     *
     * V-05: the original application had no way for a user to change their own
     * password. The only path was AuthController::update, which is
     * administrator-only and - more importantly - did NOT ask for the current
     * password. So any compromise of an admin token was a permanent takeover of
     * every account in the system, and an ordinary cashier who thought their
     * password had been seen could do nothing about it.
     *
     * Requiring the current password means a stolen TOKEN cannot be used to
     * change the password and lock the real owner out.
     *
     * CWE-620 Unverified Password Change
     */
    public function changePassword(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'current_password' => 'required|string',
            'password' => ['required', 'string', 'confirmed', self::passwordRules()],
        ]);

        if (! Hash::check($request->current_password, $user->password)) {
            AuditLogger::record(
                action: 'auth.password.change_failed',
                description: sprintf('%s attempted a password change with the wrong current password.', $user->username),
                subject: ['user', $user->id],
                severity: AuditLogger::SEVERITY_WARNING,
            );

            return response()->json([
                'success' => false,
                'message' => 'The given data was invalid.',
                'errors' => ['current_password' => ['The current password is incorrect.']],
            ], 422);
        }

        if (Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'The given data was invalid.',
                'errors' => ['password' => ['The new password must be different from the current one.']],
            ], 422);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        // V-06: end every other session. Changing a password after a suspected
        // compromise is pointless if the attacker's existing token keeps working.
        $user->tokens()->delete();

        AuditLogger::record(
            action: 'auth.password.changed',
            description: sprintf('%s changed their own password; all sessions revoked.', $user->username),
            subject: ['user', $user->id],
            severity: AuditLogger::SEVERITY_NOTICE,
        );

        return response()->json([
            'success' => true,
            'message' => 'Password changed. Please sign in again.',
        ], 200);
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
                // V-05c: was 'nullable|string|min:6'.
                'password' => ['nullable', 'string', self::passwordRules()],
                // V-02: 'manager' was accepted here but the users table enum only
                // has admin and employee, and no middleware, policy or UI branch in
                // the application understands it. A user given that role fell
                // through every check as a non-admin with no employee handling.
                'role' => 'required|in:admin,employee',
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

            $before = [
                'role' => $user->role,
                'is_active' => (bool) $user->is_active,
                'department_id' => $user->department_id,
                'username' => $user->username,
            ];

            $passwordChanged = $request->filled('password');

            if ($passwordChanged) {
                $data['password'] = Hash::make($request->password);
            }

            $user->update($data);

            /*
             * V-06: revoke the user's existing tokens whenever something that
             * a token's authority depends on has changed.
             *
             * Confirmed against the original application: an administrator set
             * is_active=false, fresh logins were then refused with 403 - and the
             * token issued BEFORE the change still returned 200 from GET /me.
             * Because config/sanctum.php had no expiry, that access was
             * permanent. A dismissed employee kept full API access.
             *
             * Covered here:
             *   deactivation   - the token must die with the account
             *   role change    - abilities are baked into the token at issue
             *                    time, so a demoted admin would otherwise keep
             *                    the admin ability until they logged out
             *   password change- the point of changing a password after a
             *                    compromise is to end the attacker's session
             *   username change- the identifier the audit trail keys on
             *
             * EnsureUserIsActive middleware is the belt-and-braces backstop for
             * anything that flips is_active without coming through here.
             */
            $reasons = [];
            if ($before['is_active'] && ! $user->is_active)          $reasons[] = 'account deactivated';
            if ($before['role'] !== $user->role)                      $reasons[] = "role {$before['role']} -> {$user->role}";
            if ($passwordChanged)                                     $reasons[] = 'password reset by administrator';
            if ($before['username'] !== $user->username)              $reasons[] = 'username changed';

            if ($reasons) {
                $user->tokens()->delete();
            }

            AuditLogger::record(
                action: 'user.updated',
                description: sprintf(
                    'Updated user %s (%s).%s',
                    $user->username,
                    $user->user_code,
                    $reasons ? ' Sessions revoked: ' . implode('; ', $reasons) . '.' : ''
                ),
                subject: ['user', $user->id],
                old: $before,
                new: [
                    'role' => $user->role,
                    'is_active' => (bool) $user->is_active,
                    'department_id' => $user->department_id,
                    'username' => $user->username,
                    'password_changed' => $passwordChanged,
                ],
                severity: ($reasons || $user->role === 'admin')
                    ? AuditLogger::SEVERITY_WARNING
                    : AuditLogger::SEVERITY_INFO,
            );

            return response()->json([
                'success' => true,
                'message' => 'User updated successfully',
                'data' => $user->makeHidden(['password'])
            ], 200);

        } catch (ValidationException $e) {
            // V-04: re-throw so the exception handler renders the standard 422
            // with per-field messages. The generic catch below would otherwise
            // swallow it and return 500.
            throw $e;
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