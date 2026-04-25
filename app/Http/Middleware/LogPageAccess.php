<?php

namespace App\Http\Middleware;

use App\Models\PageAccessLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LogPageAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($this->shouldLog($request, $response)) {
            $user = $request->user();

            try {
                PageAccessLog::create([
                    'user_id' => $user?->id,
                    'user_name' => $user?->name,
                    'method' => $request->method(),
                    'path' => '/' . ltrim($request->path(), '/'),
                    'route_name' => $request->route()?->getName(),
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'referer' => $request->headers->get('referer'),
                    'status_code' => $response->getStatusCode(),
                    'accessed_at' => now(),
                ]);
            } catch (\Throwable) {
                // Logging must never block page access.
            }
        }

        return $response;
    }

    private function shouldLog(Request $request, Response $response): bool
    {
        if (!$request->user() || !$request->isMethod('GET') || !$response->isSuccessful()) {
            return false;
        }

        if ($request->expectsJson() || $request->is('api/*') || str_contains($request->path(), '/api')) {
            return false;
        }

        if ($request->headers->get('purpose') === 'prefetch' || $request->headers->has('x-inertia-prefetch')) {
            return false;
        }

        $contentType = (string) $response->headers->get('content-type');

        return $request->headers->has('x-inertia') || str_contains($contentType, 'text/html');
    }
}
