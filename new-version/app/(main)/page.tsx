
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardClient from './dashboard-client';

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get('at')?.value;
  if (!token) {
    redirect('/auth?next=/');
  }

  return (
    <main className="min-h-screen py-8">
      <DashboardClient />
    </main>
  );
}