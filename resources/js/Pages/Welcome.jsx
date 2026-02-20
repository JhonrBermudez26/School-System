import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    GraduationCap, BookOpen, Users, Award, Calendar, MapPin, Phone,
    Mail, Clock, Trophy, CheckCircle, X, Lock, Eye, EyeOff, Menu,
    Star, Building2, Layers, TrendingUp, ChevronRight, Shield, Heart
} from 'lucide-react';

export default function Welcome() {
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showPassword, setShowPassword]     = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        email: '', password: '', remember: false
    });

    const { app, school, stats, periodo_activo } = usePage().props;
    const appName    = app?.name;
    const appFullName = app?.fullName || appName;

    // Datos institucionales con fallbacks
    const schoolName = school?.nombre    || appFullName || 'Institución Educativa';
    const schoolLema = school?.lema      || 'Formando líderes del mañana';
    const schoolLogo = school?.logo      || null;
    const schoolYear = school?.fecha_fundacion;
    const anios      = school?.anios_existencia || stats?.anios || null;
    const jornada    = school?.jornada   || null;
    const caracter   = school?.caracter  || null;
    const nivelEdu   = school?.nivel_educativo || null;
    const rector     = school?.rector    || null;

    const direccion  = school?.direccion && school?.ciudad
        ? `${school.direccion}, ${school.ciudad}${school.departamento ? ', ' + school.departamento : ''}`
        : school?.direccion || null;
    const telefono   = school?.telefono  || school?.celular || null;
    const emailInst  = school?.email     || null;

    const submit = (e) => { e.preventDefault(); post('/login'); };

    const navItems = [
        { id: 'inicio',     label: 'Inicio'     },
        { id: 'nosotros',   label: 'Nosotros'   },
        { id: 'programas',  label: 'Programas'  },
        { id: 'admisiones', label: 'Admisiones' },
        { id: 'contacto',   label: 'Contacto'   },
    ];

    return (<>
        <Head title={`Bienvenid@s | ${schoolName}`} />

        {/* ── NAVBAR ── */}
        <nav className="bg-white shadow-md fixed w-full top-0 z-50 border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 sm:h-20">
                    <div className="flex items-center gap-3 min-w-0">
                        {schoolLogo ? (
                            <img src={schoolLogo} alt={schoolName} className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl object-contain shadow-md flex-shrink-0" />
                        ) : (
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-md flex-shrink-0">
                                <GraduationCap className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate leading-tight">{schoolName}</h1>
                            {schoolLema && <p className="text-xs text-gray-500 hidden sm:block truncate italic">{schoolLema}</p>}
                        </div>
                    </div>

                    {/* Desktop */}
                    <div className="hidden md:flex items-center gap-5 lg:gap-7">
                        {navItems.map(({ id, label }) => (
                            <a key={id} href={`#${id}`}
                                className="text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors relative group">
                                {label}
                                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:w-full transition-all duration-300 rounded-full" />
                            </a>
                        ))}
                        <button onClick={() => setShowLoginModal(true)}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold text-sm shadow-md hover:shadow-lg">
                            Portal Académico
                        </button>
                    </div>

                    {/* Mobile */}
                    <div className="md:hidden flex items-center gap-2">
                        <button onClick={() => setShowLoginModal(true)}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold">
                            Portal
                        </button>
                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-100 py-3 space-y-1 pb-4">
                        {navItems.map(({ id, label }) => (
                            <a key={id} href={`#${id}`} onClick={() => setMobileMenuOpen(false)}
                                className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                {label}
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </nav>

        {/* ── HERO ── */}
        <section id="inicio" className="pt-16 sm:pt-20 bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden relative">
            <div className="absolute top-32 right-0 w-72 h-72 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none" />
            <div className="absolute top-48 left-0 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative">
                <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
                    <div>
                        {anios && (
                            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-blue-200">
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-400" />
                                {anios}+ años formando ciudadanos de excelencia
                            </div>
                        )}

                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-5 leading-tight">
                            Educación de Calidad para un Futuro{' '}
                            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Brillante</span>
                        </h2>

                        <p className="text-base sm:text-lg text-gray-600 mb-5 leading-relaxed">
                            {schoolName} es una institución comprometida con la formación integral,
                            fomentando valores, excelencia académica y responsabilidad social.
                        </p>

                        {/* Info chips */}
                        <div className="flex flex-wrap gap-2 mb-8">
                            {jornada && (
                                <span className="inline-flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                                    <Clock className="h-3.5 w-3.5 text-blue-500" /> Jornada {jornada}
                                </span>
                            )}
                            {caracter && (
                                <span className="inline-flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                                    <Building2 className="h-3.5 w-3.5 text-indigo-500" /> {caracter}
                                </span>
                            )}
                            {nivelEdu && (
                                <span className="inline-flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                                    <Layers className="h-3.5 w-3.5 text-green-500" /> {nivelEdu}
                                </span>
                            )}
                            {schoolYear && (
                                <span className="inline-flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                                    <Calendar className="h-3.5 w-3.5 text-orange-500" /> Desde {schoolYear}
                                </span>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button onClick={() => setShowLoginModal(true)}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-7 py-3.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
                                <GraduationCap className="h-5 w-5" /> Acceder al Portal
                            </button>
                            <a href="#admisiones"
                                className="bg-white text-blue-600 border-2 border-blue-200 px-7 py-3.5 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all font-semibold text-center flex items-center justify-center gap-2">
                                Inscripciones <ChevronRight className="h-4 w-4" />
                            </a>
                        </div>
                    </div>

                    {/* Stats card */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl sm:rounded-3xl p-1 shadow-2xl">
                        <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-7">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Nuestra comunidad educativa</p>
                            <div className="space-y-3">
                                {[
                                    { icon: Users,    bg: 'bg-blue-100',   color: 'text-blue-600',   value: stats?.estudiantes, label: 'Estudiantes Activos'  },
                                    { icon: Award,    bg: 'bg-indigo-100', color: 'text-indigo-600', value: stats?.profesores,  label: 'Docentes'             },
                                    { icon: BookOpen, bg: 'bg-green-100',  color: 'text-green-600',  value: stats?.asignaturas, label: 'Asignaturas Activas'  },
                                    { icon: Layers,   bg: 'bg-orange-100', color: 'text-orange-600', value: stats?.grupos,      label: 'Grupos / Cursos'      },
                                ].map(({ icon: Icon, bg, color, value, label }) => (
                                    <div key={label} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                        <div className={`${bg} p-2.5 rounded-xl flex-shrink-0`}>
                                            <Icon className={`h-5 w-5 ${color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xl font-bold text-gray-900 leading-tight">
                                                {value != null ? value.toLocaleString() : '—'}
                                            </p>
                                            <p className="text-xs text-gray-500">{label}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Periodo activo */}
                            {periodo_activo && (
                                <div className="mt-5 pt-4 border-t border-gray-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                            <span className="text-xs font-semibold text-gray-700 truncate">{periodo_activo.nombre}</span>
                                        </div>
                                        <span className="text-xs text-gray-500 flex-shrink-0">{periodo_activo.progreso}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all"
                                            style={{ width: `${periodo_activo.progreso}%` }} />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1.5">{periodo_activo.inicio} — {periodo_activo.fin}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* ── BANNER RECTOR ── */}
        {(rector || school?.dane || school?.nit) && (
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-white text-sm text-center">
                    {rector && (
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-blue-200" />
                            <span className="text-blue-200">Rector/a:</span>
                            <span className="font-bold">{rector}</span>
                        </div>
                    )}
                    {school?.dane && (
                        <div className="flex items-center gap-2 text-blue-200">
                            <span>Código DANE:</span>
                            <span className="font-bold text-white">{school.dane}</span>
                        </div>
                    )}
                    {school?.nit && (
                        <div className="flex items-center gap-2 text-blue-200">
                            <span>NIT:</span>
                            <span className="font-bold text-white">{school.nit}</span>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* ── NOSOTROS ── */}
        <section id="nosotros" className="py-16 sm:py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12 sm:mb-16">
                    <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest">¿Quiénes somos?</span>
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-4">¿Por Qué Elegirnos?</h2>
                    <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                        Un modelo educativo centrado en el estudiante, con docentes comprometidos e infraestructura pensada para el aprendizaje.
                    </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                    {[
                        { bg: 'from-blue-500 to-blue-600',     icon: BookOpen,  title: 'Educación Integral',  desc: 'Formación académica, humana y ciudadana' },
                        { bg: 'from-indigo-500 to-indigo-600', icon: Users,     title: 'Comunidad Activa',    desc: `${stats?.estudiantes || 'Cientos de'} estudiantes y ${stats?.profesores || 'varios'} docentes` },
                        { bg: 'from-green-500 to-emerald-600', icon: Award,     title: 'Calidad Certificada', desc: 'Estándares nacionales de educación' },
                        { bg: 'from-orange-500 to-amber-500',  icon: Heart,     title: 'Valores y Convivencia', desc: 'Respeto, responsabilidad y solidaridad' },
                    ].map(({ bg, icon: Icon, title, desc }) => (
                        <div key={title} className="group text-center p-5 sm:p-7 rounded-2xl border border-gray-100 hover:border-transparent hover:shadow-xl transition-all duration-300">
                            <div className={`bg-gradient-to-br ${bg} w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                            </div>
                            <h3 className="text-sm sm:text-base font-bold mb-1.5 text-gray-800">{title}</h3>
                            <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* ── PROGRAMAS ── */}
        <section id="programas" className="py-16 sm:py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12 sm:mb-16">
                    <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest">Oferta académica</span>
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-4">Nuestros Programas</h2>
                    <p className="text-lg text-gray-500 max-w-xl mx-auto">
                        {nivelEdu || 'Educación integral desde preescolar hasta bachillerato'}
                    </p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {[
                        { emoji: '🎨', title: 'Preescolar',      desc: 'Desarrollo integral mediante el juego y la exploración.', items: ['Estimulación temprana', 'Iniciación lectora', 'Desarrollo socioemocional'], highlight: false },
                        { emoji: '📚', title: 'Básica Primaria',  desc: 'Construcción de bases sólidas para el aprendizaje.',       items: ['Lecto-escritura avanzada', 'Pensamiento lógico', 'Ciencias y tecnología'], highlight: true  },
                        { emoji: '🎓', title: 'Básica y Media',   desc: 'Preparación para la vida universitaria y laboral.',        items: ['Preparación ICFES / SABER', 'Proyecto de vida', 'Competencias ciudadanas'], highlight: false },
                    ].map(({ emoji, title, desc, items, highlight }) => (
                        <div key={title}
                            className={`bg-white rounded-2xl p-7 sm:p-8 shadow-md hover:shadow-xl transition-all duration-300 relative ${highlight ? 'border-2 border-blue-500 ring-2 ring-blue-100' : 'border border-gray-100'}`}>
                            {highlight && (
                                <div className="absolute top-4 right-4">
                                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow">★ Destacado</span>
                                </div>
                            )}
                            <div className="text-5xl mb-5">{emoji}</div>
                            <h3 className="text-xl sm:text-2xl font-bold mb-2 text-gray-900">{title}</h3>
                            <p className="text-gray-500 mb-5 text-sm leading-relaxed">{desc}</p>
                            <ul className="space-y-2.5">
                                {items.map(item => (
                                    <li key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <CheckCircle className="h-3.5 w-3.5 text-blue-600" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Cifras */}
                {(stats?.asignaturas || stats?.grupos || stats?.profesores || anios) && (
                    <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { label: 'Asignaturas',       value: stats?.asignaturas, icon: BookOpen,   color: 'text-blue-600',   bg: 'bg-blue-50'   },
                            { label: 'Grupos activos',    value: stats?.grupos,      icon: Layers,     color: 'text-indigo-600', bg: 'bg-indigo-50' },
                            { label: 'Docentes',          value: stats?.profesores,  icon: Award,      color: 'text-green-600',  bg: 'bg-green-50'  },
                            { label: 'Años de experiencia', value: anios,            icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
                        ].filter(i => i.value != null).map(({ label, value, icon: Icon, color, bg }) => (
                            <div key={label} className={`${bg} rounded-2xl p-5 text-center border border-gray-100`}>
                                <Icon className={`h-6 w-6 ${color} mx-auto mb-2`} />
                                <p className={`text-2xl font-bold ${color}`}>{value}+</p>
                                <p className="text-xs text-gray-600 mt-0.5 font-medium">{label}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>

        {/* ── ADMISIONES ── */}
        <section id="admisiones" className="py-16 sm:py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="grid md:grid-cols-2 gap-10 lg:gap-20 items-center">
                    <div>
                        <span className="text-blue-200 font-semibold text-sm uppercase tracking-widest">Proceso de admisión</span>
                        <h2 className="text-3xl sm:text-4xl font-bold mt-2 mb-4">Inscripciones Abiertas {new Date().getFullYear()}</h2>
                        <p className="text-lg mb-8 text-blue-100 leading-relaxed">
                            Únete a la familia de {schoolName}. Abrimos nuestras puertas a estudiantes comprometidos con su formación.
                        </p>
                        <div className="space-y-4">
                            {[
                                { icon: Calendar, title: 'Proceso continuo',   desc: 'Inscripciones abiertas durante todo el año'         },
                                { icon: Users,    title: 'Cupos limitados',    desc: 'Grupos reducidos para mejor atención personalizada'  },
                                { icon: Shield,   title: 'Proceso equitativo', desc: 'Criterios claros y transparentes de admisión'        },
                            ].map(({ icon: Icon, title, desc }) => (
                                <div key={title} className="flex items-start gap-4">
                                    <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-xl flex-shrink-0">
                                        <Icon className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">{title}</p>
                                        <p className="text-blue-200 text-sm mt-0.5">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white text-gray-900 rounded-2xl p-7 sm:p-8 shadow-2xl">
                        <h3 className="text-xl sm:text-2xl font-bold mb-2 text-gray-800">Solicita Información</h3>
                        <p className="text-sm text-gray-500 mb-6">Completa el formulario y nos pondremos en contacto.</p>
                        <div className="space-y-4">
                            {[
                                { type: 'text',  placeholder: 'Nombre completo del acudiente' },
                                { type: 'email', placeholder: 'Correo electrónico'            },
                                { type: 'tel',   placeholder: 'Teléfono de contacto'          },
                            ].map(({ type, placeholder }) => (
                                <input key={placeholder} type={type} placeholder={placeholder}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm outline-none" />
                            ))}
                            <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm text-gray-600 outline-none">
                                <option value="">Nivel educativo de interés</option>
                                <option>Preescolar</option>
                                <option>Básica Primaria</option>
                                <option>Básica Secundaria</option>
                                <option>Media Vocacional</option>
                            </select>
                            <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                                <Mail className="h-4 w-4" /> Enviar Solicitud
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* ── CONTACTO ── */}
        <section id="contacto" className="py-16 sm:py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12 sm:mb-16">
                    <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest">Estamos aquí</span>
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-4">Contáctanos</h2>
                    <p className="text-lg text-gray-500">Resolvemos todas tus preguntas con gusto</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
                    {[
                        { bg: 'from-blue-500 to-blue-600',     icon: MapPin, title: 'Dirección',            content: direccion  || 'Dirección no configurada', sub: null },
                        { bg: 'from-green-500 to-emerald-600', icon: Phone,  title: 'Teléfono',             content: telefono   || 'No disponible',              sub: school?.celular && school?.telefono && school.celular !== school.telefono ? school.celular : null },
                        { bg: 'from-indigo-500 to-indigo-600', icon: Mail,   title: 'Correo Institucional', content: emailInst  || 'No configurado',             sub: school?.sitio_web || null },
                    ].map(({ bg, icon: Icon, title, content, sub }) => (
                        <div key={title} className="group text-center p-7 rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300">
                            <div className={`bg-gradient-to-br ${bg} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                <Icon className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="font-bold mb-2 text-gray-800">{title}</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">{content}</p>
                            {sub && <p className="text-blue-500 text-xs mt-1.5">{sub}</p>}
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="bg-gray-900 text-white py-14">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2.5 mb-4">
                            {schoolLogo
                                ? <img src={schoolLogo} alt={schoolName} className="h-8 w-8 rounded-lg object-contain" />
                                : <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-1.5 rounded-lg"><GraduationCap className="h-5 w-5 text-white" /></div>}
                            <span className="font-bold text-base">{schoolName}</span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed italic">{schoolLema}</p>
                        {anios && <p className="text-gray-500 text-xs mt-2">+{anios} años de trayectoria</p>}
                    </div>
                    <div>
                        <h4 className="font-bold mb-4 text-sm uppercase tracking-widest text-gray-300">Navegación</h4>
                        <ul className="space-y-2.5 text-gray-400 text-sm">
                            {navItems.map(({ id, label }) => (
                                <li key={id}><a href={`#${id}`} className="hover:text-white transition-colors flex items-center gap-1.5"><ChevronRight className="h-3 w-3" />{label}</a></li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4 text-sm uppercase tracking-widest text-gray-300">Institución</h4>
                        <ul className="space-y-2.5 text-gray-400 text-sm">
                            {jornada         && <li className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 flex-shrink-0" />Jornada {jornada}</li>}
                            {school?.calendario && <li className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 flex-shrink-0" />Calendario {school.calendario}</li>}
                            {caracter        && <li className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 flex-shrink-0" />{caracter}</li>}
                            {school?.dane    && <li className="text-xs">DANE: {school.dane}</li>}
                            {school?.resolucion && <li className="text-xs text-gray-500">Res. {school.resolucion}</li>}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4 text-sm uppercase tracking-widest text-gray-300">Contacto</h4>
                        <ul className="space-y-2.5 text-gray-400 text-sm">
                            {telefono   && <li className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 flex-shrink-0" />{telefono}</li>}
                            {emailInst  && <li className="flex items-start gap-1.5 break-all"><Mail className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />{emailInst}</li>}
                            {direccion  && <li className="flex items-start gap-1.5"><MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />{direccion}</li>}
                        </ul>
                    </div>
                </div>
                <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-gray-500 text-xs">
                    <p>&copy; {new Date().getFullYear()} {schoolName}. Todos los derechos reservados.</p>
                    {school?.nit && <p>NIT: {school.nit}</p>}
                </div>
            </div>
        </footer>

        {/* ── MODAL LOGIN ── */}
        {showLoginModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-7 sm:p-8 relative shadow-2xl">
                    <button onClick={() => setShowLoginModal(false)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                    <div className="text-center mb-7">
                        {schoolLogo
                            ? <img src={schoolLogo} alt={schoolName} className="h-14 w-14 rounded-2xl object-contain mx-auto mb-4 shadow-md" />
                            : <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <GraduationCap className="h-8 w-8 text-blue-600" />
                              </div>
                        }
                        <h2 className="text-2xl font-bold text-gray-900">Portal Académico</h2>
                        <p className="text-gray-500 mt-1 text-sm">{schoolName}</p>
                    </div>
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo Electrónico</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)}
                                    className={`w-full pl-10 pr-4 py-2.5 border ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm`}
                                    placeholder="tu@email.com" />
                            </div>
                            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input type={showPassword ? 'text' : 'password'} value={data.password} onChange={(e) => setData('password', e.target.value)}
                                    className={`w-full pl-10 pr-12 py-2.5 border ${errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm`}
                                    placeholder="••••••••" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                            <input id="remember" type="checkbox" checked={data.remember} onChange={(e) => setData('remember', e.target.checked)}
                                className="h-4 w-4 text-blue-600 rounded border-gray-300" />
                            <label htmlFor="remember" className="text-sm text-gray-600">Recordarme</label>
                        </div>
                        <button type="submit" disabled={processing}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold disabled:opacity-50 transition-all shadow-md hover:shadow-lg text-sm">
                            {processing ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </button>
                    </form>
                    <p className="mt-5 text-center text-xs text-gray-400">¿Olvidaste tu contraseña? Contacta al administrador</p>
                </div>
            </div>
        )}
    </>);
}