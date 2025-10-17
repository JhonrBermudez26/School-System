import { Head, useForm, usePage } from '@inertiajs/react';
import Layout from '@/Components/Layout/Layout';

export default function Materias() {
    const { auth } = usePage().props;
    const user = auth?.user;
    return (
        <Layout title="Mis materias">


        </Layout>
    );
}