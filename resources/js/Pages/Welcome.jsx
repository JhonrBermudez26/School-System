import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { GraduationCap, BookOpen, Users, Award, Calendar, MapPin, Phone, Mail, Clock, Trophy, CheckCircle, X, Lock, Eye, EyeOff } from 'lucide-react';

export default function Welcome() {
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors } = useForm({ email: '', password: '', remember: false });

    const submit = (e) => { e.preventDefault(); post('/login'); };

    return (<>
        <Head title="Bienvenid@s" />
        
        {/* Navbar */}
        <nav className="bg-white shadow-md fixed w-full top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <div className="flex items-center space-x-3">
                        <div className="bg-blue-600 p-2 rounded-lg"><GraduationCap className="h-8 w-8 text-white" /></div>
                        <div><h1 className="text-2xl font-bold text-gray-900">Colegio San Martín</h1><p className="text-xs text-gray-600">Formando líderes del mañana</p></div>
                    </div>
                    <div className="hidden md:flex items-center space-x-8">
                        <a href="#inicio" className="text-gray-700 hover:text-blue-600 font-medium">Inicio</a>
                        <a href="#nosotros" className="text-gray-700 hover:text-blue-600 font-medium">Nosotros</a>
                        <a href="#programas" className="text-gray-700 hover:text-blue-600 font-medium">Programas</a>
                        <a href="#admisiones" className="text-gray-700 hover:text-blue-600 font-medium">Admisiones</a>
                        <a href="#contacto" className="text-gray-700 hover:text-blue-600 font-medium">Contacto</a>
                        <button onClick={() => setShowLoginModal(true)} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium">Portal Académico</button>
                    </div>
                </div>
            </div>
        </nav>

        {/* Hero */}
        <section id="inicio" className="pt-20 bg-gradient-to-br from-blue-50 via-white to-blue-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">🏆 Acreditación de Excelencia 2024</div>
                        <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">Educación de Calidad para un Futuro Brillante</h2>
                        <p className="text-xl text-gray-600 mb-8">Más de 30 años formando estudiantes integrales con valores, excelencia académica y compromiso social.</p>
                        <div className="flex flex-wrap gap-4">
                            <button onClick={() => setShowLoginModal(true)} className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition font-semibold text-lg shadow-lg">Acceder al Portal</button>
                            <a href="#admisiones" className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-lg hover:bg-blue-50 transition font-semibold text-lg">Inscripciones Abiertas</a>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl p-8 shadow-2xl">
                        <div className="bg-white rounded-2xl p-6 space-y-4">
                            <div className="flex items-center space-x-3"><div className="bg-green-100 p-3 rounded-lg"><Users className="h-6 w-6 text-green-600" /></div><div><p className="text-2xl font-bold">1,200+</p><p className="text-sm text-gray-600">Estudiantes Activos</p></div></div>
                            <div className="flex items-center space-x-3"><div className="bg-blue-100 p-3 rounded-lg"><Award className="h-6 w-6 text-blue-600" /></div><div><p className="text-2xl font-bold">95%</p><p className="text-sm text-gray-600">Aprobación Universitaria</p></div></div>
                            <div className="flex items-center space-x-3"><div className="bg-purple-100 p-3 rounded-lg"><Trophy className="h-6 w-6 text-purple-600" /></div><div><p className="text-2xl font-bold">50+</p><p className="text-sm text-gray-600">Premios Nacionales</p></div></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Valores */}
        <section id="nosotros" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16"><h2 className="text-4xl font-bold text-gray-900 mb-4">¿Por Qué Elegirnos?</h2><p className="text-xl text-gray-600">Nos destacamos por nuestra excelencia y compromiso</p></div>
                <div className="grid md:grid-cols-4 gap-8">
                    <div className="text-center p-6 rounded-xl hover:shadow-xl transition"><div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><BookOpen className="h-8 w-8 text-blue-600" /></div><h3 className="text-xl font-bold mb-2">Educación Bilingüe</h3><p className="text-gray-600">Programa intensivo de inglés</p></div>
                    <div className="text-center p-6 rounded-xl hover:shadow-xl transition"><div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Users className="h-8 w-8 text-green-600" /></div><h3 className="text-xl font-bold mb-2">Grupos Reducidos</h3><p className="text-gray-600">Máximo 25 estudiantes</p></div>
                    <div className="text-center p-6 rounded-xl hover:shadow-xl transition"><div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Award className="h-8 w-8 text-purple-600" /></div><h3 className="text-xl font-bold mb-2">Docentes Certificados</h3><p className="text-gray-600">100% profesionales</p></div>
                    <div className="text-center p-6 rounded-xl hover:shadow-xl transition"><div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Trophy className="h-8 w-8 text-orange-600" /></div><h3 className="text-xl font-bold mb-2">Actividades Extra</h3><p className="text-gray-600">Deportes, arte y robótica</p></div>
                </div>
            </div>
        </section>

        {/* Programas */}
        <section id="programas" className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16"><h2 className="text-4xl font-bold mb-4">Nuestros Programas</h2><p className="text-xl text-gray-600">Educación integral desde preescolar hasta bachillerato</p></div>
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition"><div className="text-4xl mb-4">🎨</div><h3 className="text-2xl font-bold mb-3">Preescolar</h3><p className="text-gray-600 mb-4">Desarrollo integral a través del juego</p><ul className="space-y-2"><li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />Estimulación temprana</li><li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />Iniciación al inglés</li></ul></div>
                    <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition border-2 border-blue-500"><div className="inline-block bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold mb-2">MÁS POPULAR</div><div className="text-4xl mb-4">📚</div><h3 className="text-2xl font-bold mb-3">Primaria</h3><p className="text-gray-600 mb-4">Formación académica sólida</p><ul className="space-y-2"><li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />Programa bilingüe</li><li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />Robótica y tecnología</li></ul></div>
                    <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition"><div className="text-4xl mb-4">🎓</div><h3 className="text-2xl font-bold mb-3">Bachillerato</h3><p className="text-gray-600 mb-4">Preparación universitaria</p><ul className="space-y-2"><li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />Énfasis en ciencias</li><li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />Preparación ICFES</li></ul></div>
                </div>
            </div>
        </section>

        {/* Admisiones */}
        <section id="admisiones" className="py-20 bg-blue-600 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div><h2 className="text-4xl font-bold mb-6">Inscripciones Abiertas 2025</h2><p className="text-xl mb-8 text-blue-100">Únete a nuestra familia educativa</p><div className="space-y-4"><div className="flex items-start space-x-3"><Calendar className="h-6 w-6 mt-1" /><div><p className="font-semibold">Proceso de admisión</p><p className="text-blue-100">Abierto todo el año</p></div></div></div></div>
                    <div className="bg-white text-gray-900 rounded-2xl p-8 shadow-2xl"><h3 className="text-2xl font-bold mb-6">Solicita Información</h3><form className="space-y-4"><input type="text" placeholder="Nombre completo" className="w-full px-4 py-3 border rounded-lg" /><input type="email" placeholder="Correo" className="w-full px-4 py-3 border rounded-lg" /><input type="tel" placeholder="Teléfono" className="w-full px-4 py-3 border rounded-lg" /><select className="w-full px-4 py-3 border rounded-lg"><option>Nivel de interés</option><option>Preescolar</option><option>Primaria</option><option>Bachillerato</option></select><button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold">Enviar Solicitud</button></form></div>
                </div>
            </div>
        </section>

        {/* Contacto */}
        <section id="contacto" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16"><h2 className="text-4xl font-bold mb-4">Contáctanos</h2><p className="text-xl text-gray-600">Estamos aquí para responder tus preguntas</p></div>
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="text-center p-6"><div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><MapPin className="h-8 w-8 text-blue-600" /></div><h3 className="font-bold mb-2">Dirección</h3><p className="text-gray-600">Calle 123 #45-67<br />Bogotá, Colombia</p></div>
                    <div className="text-center p-6"><div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Phone className="h-8 w-8 text-green-600" /></div><h3 className="font-bold mb-2">Teléfono</h3><p className="text-gray-600">+57 (1) 234-5678</p></div>
                    <div className="text-center p-6"><div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Mail className="h-8 w-8 text-purple-600" /></div><h3 className="font-bold mb-2">Email</h3><p className="text-gray-600">info@colegiosanmartin.edu.co</p></div>
                </div>
            </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-4 gap-8 mb-8">
                    <div><div className="flex items-center space-x-2 mb-4"><GraduationCap className="h-8 w-8" /><span className="text-xl font-bold">Colegio San Martín</span></div><p className="text-gray-400">Formando líderes desde 1990</p></div>
                    <div><h4 className="font-bold mb-4">Enlaces</h4><ul className="space-y-2 text-gray-400"><li><a href="#nosotros" className="hover:text-white">Nosotros</a></li><li><a href="#programas" className="hover:text-white">Programas</a></li></ul></div>
                    <div><h4 className="font-bold mb-4">Horarios</h4><div className="text-gray-400"><div className="flex items-center space-x-2"><Clock className="h-4 w-4" /><span>Lun - Vie: 7:00 AM - 3:00 PM</span></div></div></div>
                    <div><h4 className="font-bold mb-4">Síguenos</h4><div className="flex space-x-4"><a href="#" className="bg-gray-800 p-2 rounded-lg hover:bg-gray-700">📘</a><a href="#" className="bg-gray-800 p-2 rounded-lg hover:bg-gray-700">📷</a></div></div>
                </div>
                <div className="border-t border-gray-800 pt-8 text-center text-gray-400"><p>&copy; 2025 Colegio San Martín. Todos los derechos reservados.</p></div>
            </div>
        </footer>

        {/* Modal Login */}
        {showLoginModal && (
            <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-8 relative">
                    <button onClick={() => setShowLoginModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
                    <div className="text-center mb-6"><div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><GraduationCap className="h-8 w-8 text-blue-600" /></div><h2 className="text-2xl font-bold">Portal Académico</h2><p className="text-gray-600 mt-2">Accede a tu cuenta</p></div>
                    <form onSubmit={submit} className="space-y-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico</label><div className="relative"><Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" /><input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className={`w-full pl-10 pr-4 py-3 border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500`} placeholder="tu@email.com" /></div>{errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}</div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label><div className="relative"><Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" /><input type={showPassword ? 'text' : 'password'} value={data.password} onChange={(e) => setData('password', e.target.value)} className={`w-full pl-10 pr-12 py-3 border ${errors.password ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500`} placeholder="••••••••" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2">{showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}</button></div>{errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}</div>
                        <div className="flex items-center"><input id="remember" type="checkbox" checked={data.remember} onChange={(e) => setData('remember', e.target.checked)} className="h-4 w-4 text-blue-600 rounded" /><label htmlFor="remember" className="ml-2 text-sm text-gray-700">Recordarme</label></div>
                        <button type="submit" disabled={processing} className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50">{processing ? 'Iniciando...' : 'Iniciar Sesión'}</button>
                    </form>
                    <p className="mt-6 text-center text-sm text-gray-600">¿Olvidaste tu contraseña? Contacta al administrador</p>
                </div>
            </div>
        )}
    </>);
}
