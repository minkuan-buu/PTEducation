
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import UserClient from './user-client-no-ssr';

export default async function UserServerPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('at')?.value;
  if (!token) {
    redirect('/auth?next=/users');
  }

  return <UserClient />;
}