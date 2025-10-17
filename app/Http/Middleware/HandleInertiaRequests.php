<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Illuminate\Support\Facades\Auth;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => Auth::user()
                    ? [
                        'id' => Auth::user()->id,
                        'name' => Auth::user()->name,
                        'last_name' => Auth::user()->last_name,
                        'email' => Auth::user()->email,
                        'photo' => Auth::user()->photo,
                        'document_type' => Auth::user()->document_type,
                        'document_number' => Auth::user()->document_number,
                        'phone' => Auth::user()->phone,
                        'address' => Auth::user()->address,
                        'birth_date' => Auth::user()->birth_date,
                        'is_active' => $request->user()->is_active,
                        'roles' => Auth::user()->roles->pluck('name'),
                    ]
                    : null,
            ],
        ]);
    }
}
