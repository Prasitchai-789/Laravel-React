<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PageAccessLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PageAccessLogController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'user_id', 'date_from', 'date_to']);

        $logs = PageAccessLog::query()
            ->with('user:id,name,email')
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('path', 'like', "%{$search}%")
                        ->orWhere('route_name', 'like', "%{$search}%")
                        ->orWhere('user_name', 'like', "%{$search}%")
                        ->orWhere('ip_address', 'like', "%{$search}%");
                });
            })
            ->when($filters['user_id'] ?? null, fn ($query, $userId) => $query->where('user_id', $userId))
            ->when($filters['date_from'] ?? null, fn ($query, $date) => $query->whereDate('accessed_at', '>=', $date))
            ->when($filters['date_to'] ?? null, fn ($query, $date) => $query->whereDate('accessed_at', '<=', $date))
            ->latest('accessed_at')
            ->paginate(50)
            ->withQueryString();

        return Inertia::render('Admin/PageAccessLogs', [
            'logs' => $logs,
            'filters' => $filters,
            'users' => User::query()->select('id', 'name', 'email')->orderBy('name')->get(),
            'summary' => [
                'total' => PageAccessLog::count(),
                'today' => PageAccessLog::whereDate('accessed_at', today())->count(),
                'unique_users_today' => PageAccessLog::whereDate('accessed_at', today())->distinct('user_id')->count('user_id'),
            ],
        ]);
    }
}
