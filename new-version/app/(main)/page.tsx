
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get('at')?.value;
  if (!token) {
    redirect('/auth?next=/');
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold">PT Education</h1>
        <p className="text-muted mt-2">Bạn đã đăng nhập — đây là trang chủ.</p>
      </div>
    </main>
  );
}