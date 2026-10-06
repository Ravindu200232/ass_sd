<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EmployeeMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if user is authenticated
        if (!$request->user()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Please login first.'
            ], 401);
        }

        // Check if user is employee
        if ($request->user()->role !== 'employee') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Employee access required.'
            ], 403);
        }

        return $next($request);
    }
}