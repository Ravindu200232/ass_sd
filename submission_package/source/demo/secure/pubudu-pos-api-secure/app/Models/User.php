<?php
// app/Models/User.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'user_code',
        'full_name',
        'nic_no',
        'phone_no_01',
        'phone_no_02',
        'username',
        'password',
        'role',
        'is_active',
        'department_id',
        // OIDC. `role` above is set only by an administrator through
        // AuthController; nothing in the Google flow writes it.
        'email',
        'email_verified_at',
        'google_id',
        'avatar_url',
        'google_linked_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        // V-16: google_id is the OIDC subject. It is not a credential, but it
        // is a stable cross-service identifier for a real person and the
        // frontend has no use for it, so it is not serialised.
        'google_id',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'email_verified_at' => 'datetime',
        'google_linked_at' => 'datetime',
        // Laravel hashes this automatically on assignment, which means a
        // future code path cannot accidentally store a plaintext password.
        'password' => 'hashed',
    ];

    /**
     * Whether this account has a Google identity linked.
     */
    public function hasGoogleLinked(): bool
    {
        return $this->google_id !== null;
    }

    /**
     * Get the department that the user belongs to.
     */
    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    /**
     * Scope for active users
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for admins
     */
    public function scopeAdmin($query)
    {
        return $query->where('role', 'admin');
    }

    /**
     * Scope for employees
     */
    public function scopeEmployee($query)
    {
        return $query->where('role', 'employee');
    }
}