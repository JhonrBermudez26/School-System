<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchoolSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        // Información básica
        'nombre_colegio',
        'abreviacion',
        'lema',
        'logo_path',
        
        // Ubicación
        'direccion',
        'ciudad',
        'departamento',
        'pais',
        
        // Contacto
        'telefono',
        'celular',
        'email',
        'sitio_web',
        
        // Información administrativa
        'rector',
        'coordinador',
        'secretario',
        
        // Información académica
        'calendario',
        'jornada',
        'nivel_educativo',
        'caracter',
        
        // Legal
        'nit',
        'dane',
        'resolucion',
        'fecha_fundacion',

        // Configuración académica
        'minimum_passing_grade',
        'minimum_attendance_percentage',
        'grading_scale',
    ];

    protected $casts = [
        'fecha_fundacion' => 'date',
        'minimum_passing_grade' => 'decimal:2',
        'minimum_attendance_percentage' => 'integer',
        'grading_scale' => 'array',
    ];
}