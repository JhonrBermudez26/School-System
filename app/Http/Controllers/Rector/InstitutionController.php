<?php

namespace App\Http\Controllers\Rector;

use App\Http\Controllers\Controller;
use App\Http\Requests\InstitutionUpdateRequest;
use App\Models\SchoolSetting;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class InstitutionController extends Controller
{
    protected $activityLog;

    public function __construct(ActivityLogService $activityLog)
    {
        $this->activityLog = $activityLog;
    }

    /**
     * Mostrar configuración institucional
     */
    public function index()
    {
        $settings = SchoolSetting::first();
        return Inertia::render('Rector/Configuracion', [
            'settings' => $settings
        ]);
    }

    /**
     * Actualizar configuración institucional completa
     */
    public function update(InstitutionUpdateRequest $request)
    {
        $settings = SchoolSetting::first() ?? new SchoolSetting();
        $oldValues = $settings->toArray();

        $data = $request->validated();

        if ($request->hasFile('logo')) {
            if ($settings->logo_path && Storage::disk('public')->exists($settings->logo_path)) {
                Storage::disk('public')->delete($settings->logo_path);
            }
            $data['logo_path'] = $request->file('logo')->store('logos', 'public');
        }

        // Estructurar el grading scale para guardarlo como JSON si el modelo lo requiere
        // O mapear a las columnas individuales si existen
        $data['minimum_passing_grade'] = $data['passing_grade'];
        $data['minimum_attendance_percentage'] = $data['attendance_threshold'];
        $data['grading_scale'] = [
            'min' => $data['min_grade'],
            'max' => $data['max_grade'],
            'passing' => $data['passing_grade'],
        ];

        $settings->fill($data);
        $settings->save();

        $this->activityLog->log($settings, 'updated', $oldValues, $settings->getChanges());

        return back()->with('success', 'Configuración maestra actualizada correctamente');
    }

    /**
     * Configurar escala de calificaciones (Proxy a update)
     */
    public function configureGradingScale(InstitutionUpdateRequest $request)
    {
        return $this->update($request);
    }

    /**
     * Configurar criterios de aprobación (Proxy a update)
     */
    public function configureApprovalCriteria(InstitutionUpdateRequest $request)
    {
        return $this->update($request);
    }

    /**
     * Subir logo institucional (fallback o acción rápida)
     */
    public function uploadLogo(Request $request)
    {
        $request->validate(['logo' => 'required|image|max:2048']);
        $settings = SchoolSetting::firstOrCreate([]);
        
        if ($settings->logo_path && \Storage::disk('public')->exists($settings->logo_path)) {
            \Storage::disk('public')->delete($settings->logo_path);
        }
        
        $settings->logo_path = $request->file('logo')->store('logos', 'public');
        $settings->save();

        return back()->with('success', 'Logo actualizado');
    }
}
