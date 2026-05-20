import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ClassClient from './class-client';

export default async function ClassesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('at')?.value;
  if (!token) {
    redirect('/auth?next=/');
  }

  return <ClassClient />;
}