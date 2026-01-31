<?php

namespace App\Http\Controllers\Profesor;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\AcademicPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class RegistrarNotasController extends Controller
{
    /**
     * Vista principal de asistencias
     */
    public function index(Request $request)
    {
        return Inertia::render('Profesor/RegistrarNotas');
    }
}