import { usePage } from '@inertiajs/react';
import Layout from '@/Components/Layout/Layout';

export default function RegistrarNotas() {
  const { props } = usePage();

  return (
    <Layout title="Registrar Notas">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">Registrar Notas</h1>
      </div>
    </Layout>
  );
}