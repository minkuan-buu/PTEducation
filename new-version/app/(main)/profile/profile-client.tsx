"use client";

import React, { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Separator,
  Spinner,
  Chip,
} from "@heroui/react";
import { Mail, Phone, MapPin, Shield, GraduationCap, User as UserIcon } from "lucide-react";

import { useUser } from "@/context/user-context";
import { v2 } from "@/services/api";

export default function ProfileClient() {
  const searchParams = useSearchParams();
  const { user } = useUser();
  const idParam = searchParams.get("id");

  const isAdminOrManager = user?.role === "admin" || user?.role === "manager";
  const isViewingOther = Boolean(idParam && isAdminOrManager);

  // Mảng queryKeys để tách biệt cache
  const queryKey = isViewingOther ? ["profile", "admin", idParam] : ["profile", "me"];

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: async () => {
      if (isViewingOther && idParam) {
        // Admin xem chi tiết học sinh
        return await v2.getUserEdits(idParam);
      } else {
        // Người dùng tự xem profile
        return await v2.getMyProfile();
      }
    },
    enabled: Boolean(user), // Chỉ fetch khi đã có thông tin user đăng nhập
  });

  const profileData = useMemo(() => {
    if (!data) return null;
    // Chuyển đổi dữ liệu về dạng chung để render dễ dàng
    if (isViewingOther) {
      const adminData = data as v2.UserEditResModel;
      return {
        id: idParam,
        name: adminData.name,
        email: adminData.email,
        phone: adminData.phone,
        schoolInfo: adminData.schoolInfo,
        avatarUrl: adminData.avatarUrl,
        guardians: adminData.guardians,
        className: null, // admin api không trả về className trực tiếp trong model này
      };
    } else {
      const myData = data as v2.UserProfileResModel;
      return {
        id: myData.id,
        name: myData.name,
        email: myData.email,
        phone: myData.phone,
        className: myData.className,
        schoolInfo: null,
        avatarUrl: null, // Không có avatar trong GetMyProfile
        guardians: [],
      };
    }
  }, [data, isViewingOther, idParam]);

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[400px] w-full flex-col items-center justify-center gap-3">
        <Spinner size="lg" color="accent" />
        <p className="text-sm text-default-500">Đang tải thông tin...</p>
      </div>
    );
  }

  if (isError || !profileData) {
    return (
      <div className="flex h-full min-h-[400px] w-full items-center justify-center">
        <p className="text-danger">Đã có lỗi xảy ra khi tải thông tin cá nhân.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      {/* Cover & General Info */}
      <Card className="border-none bg-background/60 shadow-lg backdrop-blur-md dark:bg-default-100/50">
        <div className="h-32 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 sm:h-48" />
        <CardContent className="px-6 pb-8 pt-0 sm:px-10">
          <div className="relative flex flex-col items-center sm:flex-row sm:items-end sm:space-x-6">
            <div className="-mt-16 sm:-mt-20">
              <Avatar className="h-32 w-32 border-4 border-background bg-default-100 text-large sm:h-40 sm:w-40">
                {profileData.avatarUrl && (
                  <Avatar.Image
                    src={profileData.avatarUrl}
                    alt={profileData.name || ""}
                  />
                )}
                <Avatar.Fallback className="border-none bg-default-100 text-default-400">
                  <UserIcon className="h-12 w-12" />
                </Avatar.Fallback>
              </Avatar>
            </div>
            <div className="mt-4 flex flex-1 flex-col items-center sm:mt-0 sm: items-start">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {profileData.name}
              </h1>
              <p className="text-medium text-default-500">
                {isViewingOther ? "Học sinh" : user?.role === "student" ? "Học sinh" : user?.role}
              </p>
            </div>
            {isViewingOther && (
              <div className="mt-4 sm:mt-0">
                <Chip color="accent" variant="soft">
                  Chế độ Quản trị viên
                </Chip>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Left Column: Contact & Details */}
        <div className="space-y-6 md:col-span-1">
          <Card className="border-none bg-background/60 shadow-md backdrop-blur-md dark:bg-default-100/50">
            <CardHeader className="px-6 pt-6 font-semibold">
              Thông tin liên hệ
            </CardHeader>
            <Separator />
            <CardContent className="space-y-4 px-6 pb-6">
              <div className="flex items-center space-x-3 text-default-600">
                <Mail className="h-5 w-5 text-primary" />
                <span className="truncate">{profileData.email || "Chưa cập nhật"}</span>
              </div>
              <div className="flex items-center space-x-3 text-default-600">
                <Phone className="h-5 w-5 text-primary" />
                <span>{profileData.phone || "Chưa cập nhật"}</span>
              </div>
              {profileData.schoolInfo && (
                <div className="flex items-center space-x-3 text-default-600">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <span>{profileData.schoolInfo}</span>
                </div>
              )}
              {profileData.className && (
                <div className="flex items-center space-x-3 text-default-600">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>Lớp: {profileData.className}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Additional Info / Guardians */}
        <div className="space-y-6 md:col-span-2">
          {profileData.guardians && profileData.guardians.length > 0 ? (
            <Card className="border-none bg-background/60 shadow-md backdrop-blur-md dark:bg-default-100/50">
              <CardHeader className="px-6 pt-6 font-semibold">
                Thông tin người giám hộ
              </CardHeader>
              <Separator />
              <CardContent className="px-6 pb-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {profileData.guardians.map((guardian) => (
                    <div
                      key={guardian.id}
                      className="flex flex-col space-y-2 rounded-xl border border-default-200 bg-default-50 p-4 transition-colors hover:bg-default-100 dark:border-default-100 dark:bg-default-100 dark:hover:bg-default-200"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">
                          {guardian.name}
                        </span>
                        {guardian.isPrimary && (
                          <Chip size="sm" color="success" variant="soft">
                            Chính
                          </Chip>
                        )}
                      </div>
                      {guardian.relationship && (
                        <div className="flex items-center space-x-2 text-sm text-default-500">
                          <Shield className="h-4 w-4" />
                          <span>Quan hệ: {guardian.relationship}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2 text-sm text-default-500">
                        <Phone className="h-4 w-4" />
                        <span>{guardian.phone || "Không có sđt"}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-default-500">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">
                          {guardian.email || "Không có email"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-none bg-background/60 shadow-md backdrop-blur-md dark:bg-default-100/50">
              <CardContent className="px-6 py-12 text-center text-default-500">
                <UserIcon className="mx-auto mb-4 h-12 w-12 opacity-20" />
                <p>Không có thông tin giám hộ hoặc chi tiết khác được tìm thấy.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
