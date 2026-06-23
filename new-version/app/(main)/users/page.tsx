
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import UserClient from './user-client-no-ssr';

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản lý người dùng",
  description: "Hệ thống giáo dục PTEducation.",
};

export default async function UserServerPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('at')?.value;
  if (!token) {
    redirect('/auth?next=/users');
  }

  return <UserClient />;
}