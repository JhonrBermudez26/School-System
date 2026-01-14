<?php
namespace App\Http\Controllers\Secretaria;

use App\Http\Controllers\Controller;
use App\Models\SchoolSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class SchoolSettingController extends Controller
{
    public function index()
    {
        $settings = SchoolSetting::first();
        
        return Inertia::render('Secretaria/Configuracion', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            // Información básica
            'nombre_colegio' => 'nullable|string|max:255',
            'abreviacion' => 'nullable|string|max:20',
            'lema' => 'nullable|string|max:500',
            'logo' => 'nullable|image|max:2048', // 2MB max
            
            // Ubicación
            'direccion' => 'nullable|string|max:255',
            'ciudad' => 'nullable|string|max:100',
            'departamento' => 'nullable|string|max:100',
            'pais' => 'nullable|string|max:100',
            
            // Contacto
            'telefono' => 'nullable|string|max:50',
            'celular' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'sitio_web' => 'nullable|url|max:255',
            
            // Información administrativa
            'rector' => 'nullable|string|max:100',
            'coordinador' => 'nullable|string|max:100',
            'secretario' => 'nullable|string|max:100',
            
            // Información académica
            'calendario' => 'nullable|in:A,B',
            'jornada' => 'nullable|in:Mañana,Tarde,Completa,Nocturna',
            'nivel_educativo' => 'nullable|string|max:255',
            'caracter' => 'nullable|string|max:50',
            
            // Legal
            'nit' => 'nullable|string|max:50',
            'dane' => 'nullable|string|max:50',
            'resolucion' => 'nullable|string|max:255',
            'fecha_fundacion' => 'nullable|date',
        ]);

        $settings = SchoolSetting::first();
        if (!$settings) {
            $settings = new SchoolSetting();
        }

        // Manejo del logo
        if ($request->hasFile('logo')) {
            // Eliminar logo anterior si existe
            if ($settings->logo_path) {
                Storage::disk('public')->delete($settings->logo_path);
            }
            
            // Guardar nuevo logo
            $logoPath = $request->file('logo')->store('logos', 'public');
            $data['logo_path'] = $logoPath;
        }

        $settings->fill($data);
        $settings->save();

        return redirect()->route('secretaria.configuracion')
            ->with('success', '¡Configuración actualizada exitosamente!');
    }

    public function deleteLogo()
    {
        $settings = SchoolSetting::first();
        
        if ($settings && $settings->logo_path) {
            Storage::disk('public')->delete($settings->logo_path);
            $settings->logo_path = null;
            $settings->save();
        }

        return back()->with('success', 'Logo eliminado correctamente');
    }
}