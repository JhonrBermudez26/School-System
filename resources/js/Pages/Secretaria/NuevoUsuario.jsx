import { useState } from "react";
import Layout from "@/Components/Layout/Layout";
import { usePage, router } from "@inertiajs/react";

export default function NuevoUsuario() {
  const { auth, roles = [] } = usePage().props;
  const user = auth?.user;

  const [formData, setFormData] = useState({
    name: "",
    last_name: "",
    email: "",
    password: "",
    document_type: "CC",
    document_number: "",
    phone: "",
    address: "",
    birth_date: "",
    role: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    router.post(route("usuarios.store"), formData, {
      onError: (err) => setErrors(err),
      onSuccess: () =>
        setFormData({
          name: "",
          last_name: "",
          email: "",
          password: "",
          document_type: "CC",
          document_number: "",
          phone: "",
          address: "",
          birth_date: "",
          role: "",
        }),
    });
  };

  return (
    <Layout title="Nuevo Usuario - Secretaría">
      <div className="p-8 max-w-4xl mx-auto bg-white rounded-2xl shadow-md border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          👩‍💻 Registrar Nuevo Usuario
        </h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
          {/* Nombre y Apellido */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nombre
            </label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ej: María"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Apellido
            </label>
            <input
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ej: López"
            />
          </div>

          {/* Tipo y Número de documento */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tipo de documento
            </label>
            <select
              name="document_type"
              value={formData.document_type}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="CC">Cédula de Ciudadanía</option>
              <option value="TI">Tarjeta de Identidad</option>
              <option value="CE">Cédula de Extranjería</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Número de documento
            </label>
            <input
              name="document_number"
              value={formData.document_number}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ej: 1006773640"
            />
          </div>

          {/* Email y Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Correo electrónico
            </label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="correo@dominio.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="********"
            />
          </div>

          {/* Teléfono y Dirección */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Teléfono
            </label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ej: 3114567890"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Dirección
            </label>
            <input
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ej: Calle 45 #12-34"
            />
          </div>

          {/* Fecha de nacimiento y rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Fecha de nacimiento
            </label>
            <input
              name="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Rol
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Seleccionar rol</option>
              {roles.length > 0 ? (
                roles.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="estudiante">Estudiante</option>
                  <option value="profesor">Profesor</option>
                  <option value="secretaria">Secretaria</option>
                  <option value="coordinadora">Coordinadora</option>
                  <option value="rector">Rector</option>
                </>
              )}
            </select>
          </div>

          {/* Botones */}
          <div className="col-span-2 flex justify-end space-x-4 mt-4">
            <button
              type="button"
              onClick={() => router.visit(route("usuarios.index"))}
              className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all"
            >
              Guardar usuario
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
    