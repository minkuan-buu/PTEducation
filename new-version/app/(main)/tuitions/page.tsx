
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { Metadata } from "next";
import TuitionClient from './tuition-client';

export const metadata: Metadata = {
    title: "Quản lý học phí",
    description: "Hệ thống giáo dục PTEducation.",
};

export default async function TuitionServerPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('at')?.value;
    if (!token) {
        redirect('/auth?next=/tuitions');
    }

    return <TuitionClient />;
}