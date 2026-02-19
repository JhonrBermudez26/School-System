import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { GraduationCap, BookOpen, Users, Award, Calendar, MapPin, Phone, Mail, Clock, Trophy, CheckCircle, X, Lock, Eye, EyeOff, Menu } from 'lucide-react';

export default function Welcome() {
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { data, setData, post, processing, errors } = useForm({ email: '', password: '', remember: false });
    const { app } = usePage().props;
    const appName = app?.name;
    const appFullName = app?.fullName || appName;

    const submit = (e) => { e.preventDefault(); post('/login'); };

    return (<>
        <Head title={appName ? `Bienvenid@s | ${appName}` : 'Bienvenid@s'} />

        {/* Navbar */}
        <nav className="bg-white shadow-md fixed w-full top-0 z-50 border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 sm:h-20">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-md">
                            <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">{appFullName || 'School System'}</h1>
                            <p className="text-xs text-gray-500 hidden sm:block">Formando líderes del mañana</p>
                        </div>
                    </div>
                    {/* Desktop nav */}
                    <div className="hidden md:flex items-center gap-6 lg:gap-8">
                        {['inicio', 'nosotros', 'programas', 'admisiones', 'contacto'].map(item => (
                            <a
                                key={item}
                                href={`#${item}`}
                                className="text-gray-600 hover:text-blue-600 font-medium text-sm capitalize transition-colors"
                            >
                                {item.charAt(0).toUpperCase() + item.slice(1)}
                            </a>
                        ))}
                        <button
                            onClick={() => setShowLoginModal(true)}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold text-sm shadow-md hover:shadow-lg"
                        >
                            Portal Académico
                        </button>
                    </div>
                    {/* Mobile: botón portal + hamburguesa */}
                    <div className="md:hidden flex items-center gap-2">
                        <button
                            onClick={() => setShowLoginModal(true)}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold"
                        >
                            Portal
                        </button>
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
                        {['inicio', 'nosotros', 'programas', 'admisiones', 'contacto'].map(item => (
                            <a
                                key={item}
                                href={`#${item}`}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg capitalize transition-colors"
                            >
                                {item.charAt(0).toUpperCase() + item.slice(1)}
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </nav>

        {/* Hero */}
        <section id="inicio" className="pt-16 sm:pt-20 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                            🏆 Acreditación de Excelencia 2024
                        </div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                            Educación de Calidad para un Futuro{' '}
                            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Brillante</span>
                        </h2>
                        <p className="text-base sm:text-lg text-gray-600 mb-8 leading-relaxed">
                            Más de 30 años formando estudiantes integrales con valores, excelencia académica y compromiso social.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => setShowLoginModal(true)}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-7 py-3.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold text-base shadow-lg hover:shadow-xl"
                            >
                                Acceder al Portal
                            </button>
                            <a
                                href="#admisiones"
                                className="bg-white text-blue-600 border-2 border-blue-200 px-7 py-3.5 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all font-semibold text-base text-center"
                            >
                                Inscripciones Abiertas
                            </a>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl">
                        <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 space-y-4">
                            {[
                                { icon: Users, bg: 'bg-green-100', color: 'text-green-600', value: '1,200+', label: 'Estudiantes Activos' },
                                { icon: Award, bg: 'bg-blue-100', color: 'text-blue-600', value: '95%', label: 'Aprobación Universitaria' },
                                { icon: Trophy, bg: 'bg-indigo-100', color: 'text-indigo-600', value: '50+', label: 'Premios Nacionales' },
                            ].map(({ icon: Icon, bg, color, value, label }) => (
                                <div key={label} className="flex items-center gap-4">
                                    <div className={`${bg} p-3 rounded-xl flex-shrink-0`}>
                                        <Icon className={`h-6 w-6 ${color}`} />
                                    </div>
                                    <div>
                                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
                                        <p className="text-sm text-gray-500">{label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Valores */}
        <section id="nosotros" className="py-16 sm:py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12 sm:mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">¿Por Qué Elegirnos?</h2>
                    <p className="text-lg text-gray-600">Nos destacamos por nuestra excelencia y compromiso</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 sm:gap-8">
                    {[
                        { bg: 'bg-blue-100', color: 'text-blue-600', icon: BookOpen, title: 'Educación Bilingüe', desc: 'Programa intensivo de inglés' },
                        { bg: 'bg-green-100', color: 'text-green-600', icon: Users, title: 'Grupos Reducidos', desc: 'Máximo 25 estudiantes' },
                        { bg: 'bg-indigo-100', color: 'text-indigo-600', icon: Award, title: 'Docentes Certificados', desc: '100% profesionales' },
                        { bg: 'bg-orange-100', color: 'text-orange-600', icon: Trophy, title: 'Actividades Extra', desc: 'Deportes, arte y robótica' },
                    ].map(({ bg, color, icon: Icon, title, desc }) => (
                        <div key={title} className="text-center p-5 sm:p-6 rounded-2xl hover:shadow-xl transition-shadow border border-gray-100 hover:border-blue-100">
                            <div className={`${bg} w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                                <Icon className={`h-7 w-7 sm:h-8 sm:w-8 ${color}`} />
                            </div>
                            <h3 className="text-base sm:text-xl font-bold mb-1 sm:mb-2 text-gray-800">{title}</h3>
                            <p className="text-gray-500 text-sm">{desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Programas */}
        <section id="programas" className="py-16 sm:py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12 sm:mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Nuestros Programas</h2>
                    <p className="text-lg text-gray-600">Educación integral desde preescolar hasta bachillerato</p>
                </div>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
                    {[
                        { emoji: '🎨', title: 'Preescolar', desc: 'Desarrollo integral a través del juego', items: ['Estimulación temprana', 'Iniciación al inglés'], highlight: false },
                        { emoji: '📚', title: 'Primaria', desc: 'Formación académica sólida', items: ['Programa bilingüe', 'Robótica y tecnología'], highlight: true },
                        { emoji: '🎓', title: 'Bachillerato', desc: 'Preparación universitaria', items: ['Énfasis en ciencias', 'Preparación ICFES'], highlight: false },
                    ].map(({ emoji, title, desc, items, highlight }) => (
                        <div
                            key={title}
                            className={`bg-white rounded-2xl p-7 sm:p-8 shadow-md hover:shadow-xl transition-all ${highlight ? 'border-2 border-blue-500 ring-1 ring-blue-100' : 'border border-gray-100'}`}
                        >
                            {highlight && (
                                <span className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold mb-3">
                                    MÁS POPULAR
                                </span>
                            )}
                            <div className="text-4xl mb-4">{emoji}</div>
                            <h3 className="text-xl sm:text-2xl font-bold mb-2 text-gray-900">{title}</h3>
                            <p className="text-gray-500 mb-4 text-sm">{desc}</p>
                            <ul className="space-y-2">
                                {items.map(item => (
                                    <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                                        <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Admisiones */}
        <section id="admisiones" className="py-16 sm:py-20 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
                    <div>
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Inscripciones Abiertas 2025</h2>
                        <p className="text-lg mb-8 text-blue-100">Únete a nuestra familia educativa</p>
                        <div className="flex items-start gap-3">
                            <div className="bg-white/20 p-2 rounded-lg flex-shrink-0 mt-0.5">
                                <Calendar className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-semibold">Proceso de admisión</p>
                                <p className="text-blue-200 text-sm mt-0.5">Abierto todo el año</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white text-gray-900 rounded-2xl p-7 sm:p-8 shadow-2xl">
                        <h3 className="text-xl sm:text-2xl font-bold mb-6 text-gray-800">Solicita Información</h3>
                        <div className="space-y-4">
                            {[
                                { type: 'text', placeholder: 'Nombre completo' },
                                { type: 'email', placeholder: 'Correo electrónico' },
                                { type: 'tel', placeholder: 'Teléfono' },
                            ].map(({ type, placeholder }) => (
                                <input
                                    key={placeholder}
                                    type={type}
                                    placeholder={placeholder}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm outline-none"
                                />
                            ))}
                            <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm text-gray-600 outline-none">
                                <option>Nivel de interés</option>
                                <option>Preescolar</option>
                                <option>Primaria</option>
                                <option>Bachillerato</option>
                            </select>
                            <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold transition-all shadow-md hover:shadow-lg">
                                Enviar Solicitud
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Contacto */}
        <section id="contacto" className="py-16 sm:py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12 sm:mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Contáctanos</h2>
                    <p className="text-lg text-gray-600">Estamos aquí para responder tus preguntas</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
                    {[
                        { bg: 'bg-blue-100', color: 'text-blue-600', icon: MapPin, title: 'Dirección', content: 'Calle 123 #45-67\nBogotá, Colombia' },
                        { bg: 'bg-green-100', color: 'text-green-600', icon: Phone, title: 'Teléfono', content: '+57 (1) 234-5678' },
                        { bg: 'bg-indigo-100', color: 'text-indigo-600', icon: Mail, title: 'Email', content: 'info@colegiosanmartin.edu.co' },
                    ].map(({ bg, color, icon: Icon, title, content }) => (
                        <div key={title} className="text-center p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
                            <div className={`${bg} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                                <Icon className={`h-8 w-8 ${color}`} />
                            </div>
                            <h3 className="font-bold mb-2 text-gray-800">{title}</h3>
                            <p className="text-gray-500 text-sm whitespace-pre-line">{content}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-1.5 rounded-lg">
                                <GraduationCap className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-lg font-bold">{appName || 'Colegio San Martín'}</span>
                        </div>
                        <p className="text-gray-400 text-sm">Formando líderes desde 1990</p>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-gray-300">Enlaces</h4>
                        <ul className="space-y-2 text-gray-400 text-sm">
                            <li><a href="#nosotros" className="hover:text-white transition-colors">Nosotros</a></li>
                            <li><a href="#programas" className="hover:text-white transition-colors">Programas</a></li>
                            <li><a href="#admisiones" className="hover:text-white transition-colors">Admisiones</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-gray-300">Horarios</h4>
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <Clock className="h-4 w-4 flex-shrink-0" />
                            <span>Lun - Vie: 7:00 AM - 3:00 PM</span>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-gray-300">Síguenos</h4>
                        <div className="flex gap-3">
                            <a href="#" className="bg-gray-800 hover:bg-blue-600 p-2.5 rounded-lg transition-colors text-lg">📘</a>
                            <a href="#" className="bg-gray-800 hover:bg-pink-600 p-2.5 rounded-lg transition-colors text-lg">📷</a>
                        </div>
                    </div>
                </div>
                <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} {appName || 'Colegio San Martín'}. Todos los derechos reservados.</p>
                </div>
            </div>
        </footer>

        {/* Modal Login */}
        {showLoginModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-7 sm:p-8 relative shadow-2xl">
                    <button
                        onClick={() => setShowLoginModal(false)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <div className="text-center mb-7">
                        <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <GraduationCap className="h-8 w-8 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Portal Académico</h2>
                        <p className="text-gray-500 mt-1 text-sm">Accede a tu cuenta institucional</p>
                    </div>
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo Electrónico</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className={`w-full pl-10 pr-4 py-2.5 border ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm`}
                                    placeholder="tu@email.com"
                                />
                            </div>
                            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className={`w-full pl-10 pr-12 py-2.5 border ${errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm`}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                id="remember"
                                type="checkbox"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                                className="h-4 w-4 text-blue-600 rounded border-gray-300"
                            />
                            <label htmlFor="remember" className="text-sm text-gray-600">Recordarme</label>
                        </div>
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold disabled:opacity-50 transition-all shadow-md hover:shadow-lg text-sm"
                        >
                            {processing ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </button>
                    </form>
                    <p className="mt-5 text-center text-xs text-gray-500">¿Olvidaste tu contraseña? Contacta al administrador</p>
                </div>
            </div>
        )}
    </>);
}