import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import ProfileClient from "./profile-client";

export const metadata: Metadata = {
  title: "Trang cá nhân",
  description: "Thông tin cá nhân - Hệ thống giáo dục PTEducation",
};

export default async function ProfileServerPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("at")?.value;
  if (!token) {
    redirect("/auth?next=/profile");
  }

  return (
    <React.Suspense fallback={<div className="p-4 text-center">Đang tải...</div>}>
      <ProfileClient />
    </React.Suspense>
  );
}
