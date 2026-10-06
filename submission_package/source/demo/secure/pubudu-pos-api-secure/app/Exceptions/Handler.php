<?php
// app/Exceptions/Handler.php

namespace App\Exceptions;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Exception\RouteNotFoundException;
use Throwable;

/**
 * V-07 fix - single, uniform JSON error contract for the whole API.
 *
 * Before this change, controllers individually decided what to tell the
 * client, and many of them echoed the raw exception text:
 *
 *   CustomerController.php:34   'Failed to fetch customers: ' . $e->getMessage()
 *   InvoiceController.php:215   'error' => $e->getMessage()
 *
 * That leaked SQL statements, table and column names, connection names and
 * absolute filesystem paths to any authenticated caller - and, because
 * responses were returned regardless of APP_DEBUG, it leaked them in
 * production too. A confirmed example from the original code:
 *
 *   GET /api/reports/carts
 *   -> 500 {"message":"Class \"App\\Models\\Cart\" not found",
 *           "exception":"Error",
 *           "file":"…\\app\\Http\\Controllers\\Api\\ReportController.php", …}
 *
 * Centralising the decision here means an individual controller can no longer
 * get it wrong: detail is attached only when app.debug is explicitly enabled,
 * and the full exception is always written to the log either way, so operators
 * lose nothing.
 */
class Handler extends ExceptionHandler
{
    /**
     * Inputs never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
        'new_password',
        'new_password_confirmation',
    ];

    /**
     * Request keys scrubbed from every log entry. Laravel applies this to the
     * request context it attaches to reports, so a stack trace written for a
     * failed login can never carry the submitted password.
     *
     * @var array<int, string>
     */
    protected $dontFlashToSession = [
        'password',
        'password_confirmation',
        'token',
        'access_token',
        'code_verifier',
    ];

    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Render an exception into a JSON response.
     *
     * Every API route returns JSON, so an HTML error page (or an Ignition
     * debug screen) is never an acceptable response here.
     */
    public function render($request, Throwable $e)
    {
        if (! $request->is('api/*') && ! $request->expectsJson()) {
            return parent::render($request, $e);
        }

        // Validation and authentication already have safe, intentional shapes.
        if ($e instanceof ValidationException) {
            return response()->json([
                'success' => false,
                'message' => 'The given data was invalid.',
                'errors'  => $e->errors(),
            ], 422);
        }

        if ($e instanceof AuthenticationException) {
            return $this->unauthenticated($request, $e);
        }

        if ($e instanceof AuthorizationException) {
            return response()->json([
                'success' => false,
                'message' => 'This action is unauthorized.',
            ], 403);
        }

        // A missing model is a 404, not a 500, and must not disclose which
        // Eloquent class was being looked up.
        if ($e instanceof ModelNotFoundException || $e instanceof NotFoundHttpException || $e instanceof RouteNotFoundException) {
            return response()->json([
                'success' => false,
                'message' => 'Resource not found.',
            ], 404);
        }

        // 4xx raised deliberately by the application (including 429 from the
        // rate limiter) already carries a message chosen by us.
        if ($e instanceof HttpExceptionInterface) {
            $status = $e->getStatusCode();

            return response()->json([
                'success' => false,
                'message' => $e->getMessage() !== '' ? $e->getMessage() : $this->statusMessage($status),
            ], $status)->withHeaders($e->getHeaders());
        }

        // Anything else is an unexpected server fault. Log it in full, tell the
        // client nothing, and hand back a correlation id so a user can quote it
        // to support without the response itself being useful to an attacker.
        $reference = (string) str()->uuid();

        Log::error('Unhandled exception', [
            'reference' => $reference,
            'exception' => $e::class,
            'message'   => $e->getMessage(),
            'file'      => $e->getFile(),
            'line'      => $e->getLine(),
            'url'       => $request->fullUrl(),
            'method'    => $request->method(),
            'user_id'   => optional($request->user())->id,
            'ip'        => $request->ip(),
        ]);

        $payload = [
            'success'   => false,
            'message'   => 'An unexpected error occurred. Please try again later.',
            'reference' => $reference,
        ];

        // Detail is available to developers, and only when they have explicitly
        // opted in via APP_DEBUG. config/app.php defaults it to false.
        if (config('app.debug')) {
            $payload['debug'] = [
                'exception' => $e::class,
                'message'   => $e->getMessage(),
                'file'      => $e->getFile(),
                'line'      => $e->getLine(),
            ];
        }

        return response()->json($payload, 500);
    }

    protected function unauthenticated($request, AuthenticationException $exception)
    {
        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated. Please log in.',
            ], 401);
        }

        return redirect()->guest(route('login'));
    }

    private function statusMessage(int $status): string
    {
        return match ($status) {
            400     => 'Bad request.',
            401     => 'Unauthenticated. Please log in.',
            403     => 'This action is unauthorized.',
            404     => 'Resource not found.',
            405     => 'Method not allowed.',
            429     => 'Too many requests. Please slow down and try again shortly.',
            default => 'Request could not be completed.',
        };
    }
}
