import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ClassDetailClient from './class-detail-client';
import { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: {
    absolute: "PTEducation",
  },
  description: "Hệ thống giáo dục PTEducation.",
};

export default async function ClassDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('at')?.value;
  if (!token) {
    redirect(`/auth?next=/classes/${resolvedParams.id}`);
  }

  return <ClassDetailClient />;
}