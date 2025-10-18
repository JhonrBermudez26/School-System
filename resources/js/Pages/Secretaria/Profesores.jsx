import { useState } from 'react';
import Layout from '@/Components/Layout/Layout';
import {usePage } from "@inertiajs/react";

export default function Profesores() {
const { auth } = usePage().props;
    const user = auth?.user;
    return (
<Layout title="Profesores - Secretaría">



    
</Layout>
    );
}
