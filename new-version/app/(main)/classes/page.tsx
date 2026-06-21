import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ClassClient from './class-client';
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản lý lớp học | PTEducation",
  description: "Hệ thống giáo dục PTEducation.",
};

export default async function ClassesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('at')?.value;
  if (!token) {
    redirect('/auth?next=/classes');
  }

  return <ClassClient />;
}