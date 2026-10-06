<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;
use Closure;

class Authenticate extends Middleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string[]  ...$guards
     * @return mixed
     */
    public function handle($request, Closure $next, ...$guards)
    {
        try {
            $this->authenticate($request, $guards);
        } catch (\Illuminate\Auth\AuthenticationException $e) {
            // Always return JSON response for API requests
            if ($request->expectsJson() || $request->is('api/*')) {
                $authHeader = $request->header('Authorization');
                
                if (empty($authHeader)) {
                    $message = 'Please login to access this resource.';
                } else {
                    $message = 'Invalid or expired token. Please login again.';
                }

                return response()->json([
                    'success' => false,
                    'message' => $message
                ], 401);
            }
            
            // For web requests, you can redirect if you have a web login route
            // But since you don't have a login route, return JSON or abort
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access. Please login.'
            ], 401);
        }

        return $next($request);
    }

    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo(Request $request): ?string
    {
        // Return null to prevent redirects for both web and API
        // Or handle redirects only if you have web routes
        return null;
    }
}