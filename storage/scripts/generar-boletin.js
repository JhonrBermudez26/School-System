#!/usr/bin/env node

/**
 * Script para generar Boletines Académicos en formato DOCX
 * Cumple con el Decreto 1290 de 2009 (Normas Colombianas)
 * 
 * Uso: node generar-boletin.js <datos.json> <output.docx>
 */

const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        AlignmentType, WidthType, BorderStyle, ShadingType, HeadingLevel,
        VerticalAlign, PageOrientation } = require('docx');

// Leer argumentos
const [,, datosPath, outputPath] = process.argv;

if (!datosPath || !outputPath) {
    console.error('Uso: node generar-boletin.js <datos.json> <output.docx>');
    process.exit(1);
}

// Leer datos
const datos = JSON.parse(fs.readFileSync(datosPath, 'utf8'));

// Configuración de bordes
const border = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
const borders = { top: border, bottom: border, left: border, right: border };

// Configuración de celdas de encabezado
const headerShading = { fill: "1F4788", type: ShadingType.CLEAR };
const headerMargins = { top: 100, bottom: 100, left: 120, right: 120 };

// Configuración de celdas normales
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

/**
 * Crear tabla de información institucional
 */
function crearEncabezadoInstitucional() {
    return new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        borders,
                        width: { size: 9360, type: WidthType.DXA },
                        margins: cellMargins,
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        text: datos.institucion.nombre.toUpperCase(),
                                        bold: true,
                                        size: 28,
                                        font: "Arial"
                                    })
                                ]
                            }),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        text: `NIT: ${datos.institucion.nit}`,
                                        size: 20,
                                        font: "Arial"
                                    })
                                ]
                            }),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        text: datos.institucion.resolucion,
                                        size: 20,
                                        font: "Arial"
                                    })
                                ]
                            }),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 100 },
                                children: [
                                    new TextRun({
                                        text: datos.institucion.ciudad,
                                        size: 20,
                                        font: "Arial"
                                    })
                                ]
                            }),
                        ]
                    })
                ]
            }),
            new TableRow({
                children: [
                    new TableCell({
                        borders,
                        width: { size: 9360, type: WidthType.DXA },
                        margins: cellMargins,
                        shading: { fill: "E8F4F8", type: ShadingType.CLEAR },
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        text: "BOLETÍN ACADÉMICO",
                                        bold: true,
                                        size: 26,
                                        font: "Arial"
                                    })
                                ]
                            }),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        text: `${datos.academico.periodo} - Año ${datos.academico.año}`,
                                        bold: true,
                                        size: 24,
                                        font: "Arial"
                                    })
                                ]
                            })
                        ]
                    })
                ]
            })
        ]
    });
}

/**
 * Crear tabla de información del estudiante
 */
function crearInformacionEstudiante() {
    return new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2340, 7020],
        rows: [
            crearFilaDato("ESTUDIANTE:", datos.estudiante.nombre_completo),
            crearFilaDato("DOCUMENTO:", `${datos.estudiante.tipo_documento} ${datos.estudiante.documento}`),
            crearFilaDato("GRADO:", datos.academico.grupo),
            crearFilaDato("PERIODO:", `Del ${datos.academico.fecha_inicio} al ${datos.academico.fecha_fin}`),
        ]
    });
}

function crearFilaDato(label, value) {
    return new TableRow({
        children: [
            new TableCell({
                borders,
                width: { size: 2340, type: WidthType.DXA },
                margins: cellMargins,
                shading: { fill: "F0F0F0", type: ShadingType.CLEAR },
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: label,
                                bold: true,
                                size: 20,
                                font: "Arial"
                            })
                        ]
                    })
                ]
            }),
            new TableCell({
                borders,
                width: { size: 7020, type: WidthType.DXA },
                margins: cellMargins,
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: value,
                                size: 20,
                                font: "Arial"
                            })
                        ]
                    })
                ]
            })
        ]
    });
}

/**
 * Crear tabla de notas por asignatura
 */
function crearTablaNotas() {
    const headerRow = new TableRow({
        tableHeader: true,
        children: [
            crearCeldaEncabezado("ASIGNATURA", 3500),
            crearCeldaEncabezado("DOCENTE", 2500),
            crearCeldaEncabezado("NOTA", 1180),
            crearCeldaEncabezado("DESEMPEÑO", 2180),
        ]
    });

    const notasRows = datos.notas_por_asignatura.map(nota => {
        return new TableRow({
            children: [
                crearCeldaNota(nota.asignatura, 3500),
                crearCeldaNota(nota.docente, 2500),
                crearCeldaNota(nota.nota.toFixed(2), 1180, AlignmentType.CENTER),
                crearCeldaDesempeno(nota.desempeno, 2180),
            ]
        });
    });

    return new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [3500, 2500, 1180, 2180],
        rows: [headerRow, ...notasRows]
    });
}

function crearCeldaEncabezado(texto, width) {
    return new TableCell({
        borders,
        width: { size: width, type: WidthType.DXA },
        margins: headerMargins,
        shading: headerShading,
        verticalAlign: VerticalAlign.CENTER,
        children: [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({
                        text: texto,
                        bold: true,
                        size: 20,
                        color: "FFFFFF",
                        font: "Arial"
                    })
                ]
            })
        ]
    });
}

function crearCeldaNota(texto, width, align = AlignmentType.LEFT) {
    return new TableCell({
        borders,
        width: { size: width, type: WidthType.DXA },
        margins: cellMargins,
        verticalAlign: VerticalAlign.CENTER,
        children: [
            new Paragraph({
                alignment: align,
                children: [
                    new TextRun({
                        text: String(texto),
                        size: 20,
                        font: "Arial"
                    })
                ]
            })
        ]
    });
}

function crearCeldaDesempeno(desempeno, width) {
    const colores = {
        'SUPERIOR': '10B981',
        'ALTO': '3B82F6',
        'BÁSICO': 'F59E0B',
        'BAJO': 'EF4444'
    };

    return new TableCell({
        borders,
        width: { size: width, type: WidthType.DXA },
        margins: cellMargins,
        shading: { fill: colores[desempeno] || 'CCCCCC', type: ShadingType.CLEAR },
        verticalAlign: VerticalAlign.CENTER,
        children: [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({
                        text: desempeno,
                        bold: true,
                        size: 20,
                        color: "FFFFFF",
                        font: "Arial"
                    })
                ]
            })
        ]
    });
}

/**
 * Crear tabla de resumen académico
 */
function crearResumenAcademico() {
    return new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [4680, 4680],
        rows: [
            new TableRow({
                children: [
                    crearCeldaResumen("PROMEDIO GENERAL", datos.rendimiento.promedio_general.toFixed(2)),
                    crearCeldaResumen("DESEMPEÑO", datos.rendimiento.desempeno),
                ]
            }),
            new TableRow({
                children: [
                    crearCeldaResumen("PUESTO EN EL GRUPO", `${datos.rendimiento.puesto} de ${datos.rendimiento.total_estudiantes}`),
                    crearCeldaResumen("RESULTADO", datos.rendimiento.aprobo ? "APROBADO" : "NO APROBADO"),
                ]
            })
        ]
    });
}

function crearCeldaResumen(label, value) {
    return new TableCell({
        borders,
        width: { size: 4680, type: WidthType.DXA },
        margins: cellMargins,
        shading: { fill: "E8F4F8", type: ShadingType.CLEAR },
        children: [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({
                        text: label + ": ",
                        bold: true,
                        size: 22,
                        font: "Arial"
                    }),
                    new TextRun({
                        text: value,
                        bold: true,
                        size: 24,
                        color: "1F4788",
                        font: "Arial"
                    })
                ]
            })
        ]
    });
}

/**
 * Crear tabla de asistencia
 */
function crearTablaAsistencia() {
    return new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [3120, 3120, 3120],
        rows: [
            new TableRow({
                children: [
                    crearCeldaEncabezado("DÍAS ASISTIDOS", 3120),
                    crearCeldaEncabezado("DÍAS TOTALES", 3120),
                    crearCeldaEncabezado("PORCENTAJE", 3120),
                ]
            }),
            new TableRow({
                children: [
                    crearCeldaNota(datos.asistencia.dias_asistidos, 3120, AlignmentType.CENTER),
                    crearCeldaNota(datos.asistencia.dias_totales, 3120, AlignmentType.CENTER),
                    crearCeldaNota(`${datos.asistencia.porcentaje}%`, 3120, AlignmentType.CENTER),
                ]
            })
        ]
    });
}

/**
 * Crear sección de observaciones
 */
function crearObservaciones() {
    const elementos = [];

    if (datos.observaciones.academicas) {
        elementos.push(
            new Paragraph({
                spacing: { before: 200, after: 100 },
                children: [
                    new TextRun({
                        text: "OBSERVACIONES ACADÉMICAS:",
                        bold: true,
                        size: 22,
                        font: "Arial"
                    })
                ]
            }),
            new Paragraph({
                spacing: { after: 200 },
                children: [
                    new TextRun({
                        text: datos.observaciones.academicas,
                        size: 20,
                        font: "Arial"
                    })
                ]
            })
        );
    }

    if (datos.observaciones.convivencia) {
        elementos.push(
            new Paragraph({
                spacing: { before: 200, after: 100 },
                children: [
                    new TextRun({
                        text: "OBSERVACIONES DE CONVIVENCIA:",
                        bold: true,
                        size: 22,
                        font: "Arial"
                    })
                ]
            }),
            new Paragraph({
                spacing: { after: 200 },
                children: [
                    new TextRun({
                        text: datos.observaciones.convivencia,
                        size: 20,
                        font: "Arial"
                    })
                ]
            })
        );
    }

    if (datos.observaciones.recomendaciones) {
        elementos.push(
            new Paragraph({
                spacing: { before: 200, after: 100 },
                children: [
                    new TextRun({
                        text: "RECOMENDACIONES:",
                        bold: true,
                        size: 22,
                        font: "Arial"
                    })
                ]
            }),
            new Paragraph({
                spacing: { after: 200 },
                children: [
                    new TextRun({
                        text: datos.observaciones.recomendaciones,
                        size: 20,
                        font: "Arial"
                    })
                ]
            })
        );
    }

    return elementos;
}

/**
 * Crear tabla de escala de valoración (Decreto 1290)
 */
function crearEscalaValoracion() {
    return new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2340, 7020],
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        borders,
                        width: { size: 9360, type: WidthType.DXA },
                        columnSpan: 2,
                        margins: cellMargins,
                        shading: { fill: "1F4788", type: ShadingType.CLEAR },
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        text: "ESCALA DE VALORACIÓN NACIONAL (Decreto 1290 de 2009)",
                                        bold: true,
                                        size: 20,
                                        color: "FFFFFF",
                                        font: "Arial"
                                    })
                                ]
                            })
                        ]
                    })
                ]
            }),
            crearFilaEscala("4.6 - 5.0", "DESEMPEÑO SUPERIOR"),
            crearFilaEscala("4.0 - 4.5", "DESEMPEÑO ALTO"),
            crearFilaEscala("3.0 - 3.9", "DESEMPEÑO BÁSICO"),
            crearFilaEscala("1.0 - 2.9", "DESEMPEÑO BAJO"),
        ]
    });
}

function crearFilaEscala(rango, nivel) {
    return new TableRow({
        children: [
            new TableCell({
                borders,
                width: { size: 2340, type: WidthType.DXA },
                margins: cellMargins,
                shading: { fill: "F0F0F0", type: ShadingType.CLEAR },
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: rango,
                                bold: true,
                                size: 20,
                                font: "Arial"
                            })
                        ]
                    })
                ]
            }),
            new TableCell({
                borders,
                width: { size: 7020, type: WidthType.DXA },
                margins: cellMargins,
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: nivel,
                                size: 20,
                                font: "Arial"
                            })
                        ]
                    })
                ]
            })
        ]
    });
}

/**
 * Crear firma
 */
function crearFirma() {
    return [
        new Paragraph({
            spacing: { before: 600 },
            children: [
                new TextRun({
                    text: "_".repeat(50),
                    size: 20,
                    font: "Arial"
                })
            ]
        }),
        new Paragraph({
            children: [
                new TextRun({
                    text: datos.director_grupo || "Director(a) de Grupo",
                    bold: true,
                    size: 20,
                    font: "Arial"
                })
            ]
        }),
        new Paragraph({
            children: [
                new TextRun({
                    text: "Director(a) de Grupo",
                    size: 18,
                    font: "Arial"
                })
            ]
        }),
        new Paragraph({
            spacing: { before: 200 },
            alignment: AlignmentType.RIGHT,
            children: [
                new TextRun({
                    text: `Generado el: ${datos.fecha_generacion}`,
                    size: 16,
                    italics: true,
                    color: "666666",
                    font: "Arial"
                })
            ]
        })
    ];
}

/**
 * Generar documento completo
 */
const doc = new Document({
    sections: [{
        properties: {
            page: {
                size: {
                    width: 12240,   // US Letter
                    height: 15840
                },
                margin: {
                    top: 1440,
                    right: 1440,
                    bottom: 1440,
                    left: 1440
                }
            }
        },
        children: [
            crearEncabezadoInstitucional(),
            
            new Paragraph({ spacing: { after: 200 } }),
            
            crearInformacionEstudiante(),
            
            new Paragraph({ 
                spacing: { before: 300, after: 200 },
                children: [
                    new TextRun({
                        text: "REGISTRO DE CALIFICACIONES",
                        bold: true,
                        size: 24,
                        font: "Arial"
                    })
                ]
            }),
            
            crearTablaNotas(),
            
            new Paragraph({ spacing: { after: 200 } }),
            
            crearResumenAcademico(),
            
            new Paragraph({ 
                spacing: { before: 300, after: 200 },
                children: [
                    new TextRun({
                        text: "ASISTENCIA",
                        bold: true,
                        size: 24,
                        font: "Arial"
                    })
                ]
            }),
            
            crearTablaAsistencia(),
            
            ...crearObservaciones(),
            
            new Paragraph({ spacing: { before: 300, after: 200 } }),
            
            crearEscalaValoracion(),
            
            ...crearFirma()
        ]
    }]
});

// Generar archivo
Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync(outputPath, buffer);
    console.log(`Boletín generado exitosamente: ${outputPath}`);
    process.exit(0);
}).catch(err => {
    console.error('Error generando boletín:', err);
    process.exit(1);
});