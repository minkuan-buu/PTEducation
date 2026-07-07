"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Separator,
  Spinner,
  Chip,
  Skeleton,
  toast,
  Tabs,
  Button,
  useOverlayState,
} from "@heroui/react";
import { Mail, Phone, MapPin, Shield, GraduationCap, User as UserIcon, Award, Calendar, BookOpen, Users } from "lucide-react";
import { FaCamera } from "react-icons/fa";
import ModalEditStudent from "@/components/users/modal-edit-student";
import ModalChangePassword from "@/components/users/modal-change-password";

import { useUser } from "@/context/user-context";
import { v2 } from "@/services/api";

export default function ProfileClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setUser } = useUser();
  const idParam = searchParams.get("id");
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isImageLoading, setIsImageLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const { isOpen: isOpenEdit, setOpen: setOpenEdit, close: closeEdit } = useOverlayState();
  const { isOpen: isOpenChangePass, setOpen: setOpenChangePass, close: closeChangePass } = useOverlayState();

  const getRoleName = (role: string | undefined) => {
    if (!role) return "Thành viên";
    const r = role.toLowerCase();
    if (r === "student") return "Học sinh";
    if (r === "guardian") return "Phụ huynh / Giám hộ";
    if (r === "admin") return "Quản trị viên";
    if (r === "manager") return "Quản lý";
    return role;
  };

  const isAdminOrManager = user?.role?.toLowerCase() === "admin" || user?.role?.toLowerCase() === "manager";
  const isViewingOther = Boolean(idParam && isAdminOrManager);

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const targetId = isViewingOther && idParam ? idParam : user?.id;
      if (!targetId) throw new Error("User ID not found");

      if (isViewingOther && idParam) {
        return await v2.uploadAvatar(idParam, file);
      } else {
        return await v2.uploadMyAvatar(file);
      }
    },
    onSuccess: () => {
      if (isViewingOther && idParam) {
        queryClient.invalidateQueries({ queryKey: ["profile", "admin", idParam] });
        queryClient.invalidateQueries({ queryKey: ["users", "detail", idParam] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
      }
      toast.success("Cập nhật ảnh đại diện thành công");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error.message || "Không thể tải lên ảnh đại diện";
      toast.danger(msg);
    }
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsImageLoading(true);
      uploadAvatarMutation.mutate(file);
    }
  };

  // Mảng queryKeys để tách biệt cache
  const queryKey = isViewingOther ? ["profile", "admin", idParam] : ["profile", "me"];

  const { data, isLoading, isPending, isError } = useQuery({
    queryKey,
    queryFn: async () => {
      if (isViewingOther && idParam) {
        // Admin xem chi tiết người dùng
        return await v2.getUserProfile(idParam);
      } else {
        // Người dùng tự xem profile
        return await v2.getMyProfile();
      }
    },
    enabled: Boolean(user), // Chỉ fetch khi đã có thông tin user đăng nhập
  });

  useEffect(() => {
    if (data && (data as any).guardianProfile?.managedStudents?.length > 0) {
      setSelectedStudentId((data as any).guardianProfile.managedStudents[0].id);
    }
  }, [data]);

  const profileData = useMemo(() => {
    if (!data) return null;
    // Dữ liệu chung cho cả admin view và user view vì dùng chung API cấu trúc
    const myData = data as v2.UserProfileResModel;
    return {
      id: myData.id || idParam,
      name: myData.name,
      email: myData.email,
      phone: myData.phone,
      className: myData.className,
      schoolInfo: myData.schoolInfo,
      avatarUrl: myData.avatarUrl,
      role: myData.role,
      guardianProfile: myData.guardianProfile,
      adminProfile: myData.adminProfile,
      guardians: myData.guardians || [],
    };
  }, [data, idParam]);

  useEffect(() => {
    if (!isViewingOther && profileData && user) {
      const profileAvatar = profileData.avatarUrl || undefined;
      const userAvatar = user.avatarUrl || undefined;
      if (profileAvatar !== userAvatar) {
        setUser({
          ...user,
          avatarUrl: profileAvatar,
        });
      }
    }
  }, [profileData, isViewingOther, user, setUser]);

  if (isError) {
    return (
      <div className="flex h-full min-h-[400px] w-full items-center justify-center">
        <p className="text-danger">Đã có lỗi xảy ra khi tải thông tin cá nhân.</p>
      </div>
    );
  }

  if (isLoading || (isPending && !profileData)) {
    return (
      <div className="flex h-full min-h-[400px] w-full flex-col items-center justify-center gap-3">
        <Spinner size="lg" color="accent" />
        <p className="text-sm text-default-500">Đang tải thông tin...</p>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex h-full min-h-[400px] w-full items-center justify-center">
        <p className="text-danger">Không tìm thấy thông tin cá nhân.</p>
      </div>
    );
  }

  const renderGuardianDashboard = (guardianProfile: any) => {
    const students = guardianProfile?.managedStudents || [];
    if (students.length === 0) {
      return (
        <Card className="border border-transparent dark:border-white/10 bg-background/60 shadow-md backdrop-blur-md dark:bg-white/5 p-6 text-center text-default-500">
          <UserIcon className="mx-auto mb-4 h-12 w-12 opacity-20" />
          <p>Không tìm thấy học sinh nào dưới sự giám hộ của bạn.</p>
        </Card>
      );
    }

    const currentStudent = students.find((s: any) => s.id === selectedStudentId) || students[0];

    return (
      <div className="space-y-6">
        {/* Child Selector */}
        {students.length > 1 && (
          <Card className="border border-transparent dark:border-white/10 bg-background/60 shadow-md backdrop-blur-md dark:bg-white/5 p-4">
            <h3 className="text-sm font-semibold text-default-500 mb-3">Chọn học sinh để xem:</h3>
            <div className="flex flex-wrap gap-2">
              {students.map((student: any) => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudentId(student.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${student.id === currentStudent.id
                    ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                    : "bg-default-50 border-default-200 text-default-700 hover:bg-default-100"
                    }`}
                >
                  {student.name}
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Selected Child Info */}
        <Card className="border border-transparent dark:border-white/10 bg-background/60 shadow-md backdrop-blur-md dark:bg-white/5 p-4">
          <div className="flex items-center space-x-4">
            <Avatar className="w-12 h-12 text-medium">
              {currentStudent.avatarUrl && (
                <Avatar.Image
                  alt={currentStudent.name || ""}
                  src={currentStudent.avatarUrl}
                />
              )}
              <Avatar.Fallback className="border-none bg-gradient-to-br from-[#00b4d8] to-[#90e0ef] text-white text-md select-none flex items-center justify-center">
                {currentStudent.name
                  ? currentStudent.name.split(" ").map((part: string) => part[0]).join("").slice(-2).toUpperCase()
                  : <UserIcon className="h-4 w-4" />
                }
              </Avatar.Fallback>
            </Avatar>
            <div className="flex flex-col">
              <div onClick={() => router.push(`/profile?id=${currentStudent.id}`)} className="hover:underline cursor-pointer flex flex-row items-center gap-3"><h3 className="font-bold text-foreground text-lg">{currentStudent.name}</h3>
                <Chip color="accent" size="md" variant="primary">
                  <Chip.Label className="text-md">{currentStudent.className}</Chip.Label>
                </Chip>
              </div>
              <div className="flex flex-row">
                <p className="text-sm text-default-500">
                  Quan hệ: {currentStudent.relationship} {currentStudent.isPrimary && (
                    <Chip color="accent">
                      <Chip.Label>Liên hệ chính</Chip.Label>
                    </Chip>
                  )}
                </p>
              </div>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2 text-md text-default-600">
            <div><span className="font-semibold text-default-800">Email:</span> {currentStudent.email || "Chưa cập nhật"}</div>
            <div><span className="font-semibold text-default-800">SĐT:</span> {currentStudent.phone || "Chưa cập nhật"}</div>
            {currentStudent.schoolInfo && (
              <div className="sm:col-span-2">
                <span className="font-semibold text-default-800">Trường học:</span> {currentStudent.schoolInfo}
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  };

  const renderAdminDashboard = (adminProfile: any) => {
    const stats = [
      { name: "Học sinh", count: adminProfile.totalStudentsCount, icon: GraduationCap, color: "text-blue-500 bg-blue-500/10" },
      { name: "Phụ huynh", count: adminProfile.totalGuardiansCount, icon: Users, color: "text-pink-500 bg-pink-500/10" },
      { name: "Quản trị/Quản lý", count: adminProfile.totalManagersCount, icon: Shield, color: "text-purple-500 bg-purple-500/10" },
      { name: "Lớp học hoạt động", count: adminProfile.activeClassesCount, countTotal: adminProfile.totalClassesCount, icon: BookOpen, color: "text-emerald-500 bg-emerald-500/10" },
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className="border border-transparent dark:border-white/10 bg-background/60 shadow-md backdrop-blur-md dark:bg-white/5 p-5 flex flex-row items-center space-x-4">
            <div className={`p-3 rounded-2xl ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-default-500 uppercase tracking-wider">{stat.name}</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-foreground">{stat.count}</span>
                {stat.countTotal !== undefined && (
                  <span className="text-xs text-default-400">/ {stat.countTotal} tổng số</span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const showOverlay = isHovered || uploadAvatarMutation.isPending;
  const avatarStyle = {
    WebkitMaskImage: `radial-gradient(circle at var(--mask-center) var(--mask-center), transparent var(--mask-radius), black calc(var(--mask-radius) + 0.5px))`,
    maskImage: `radial-gradient(circle at var(--mask-center) var(--mask-center), transparent var(--mask-radius), black calc(var(--mask-radius) + 0.5px))`,
  };

  return (
    <div className="mx-auto w-full space-y-6 p-4 sm:p-6">
      {/* Cover & General Info */}
      <Card className="p-0 overflow-hidden border border-transparent dark:border-white/10 bg-background/60 shadow-lg backdrop-blur-md dark:bg-white/5">
        <div className="h-32 w-full bg-gradient-to-r from-[#0077b6] via-[#0096c7] to-[#48cae4] sm:h-48" />
        <CardContent className="px-6 pb-6 pt-0 sm:px-10">
          <div className="relative flex flex-col items-center sm:flex-row sm:items-center sm:space-x-6">
            <div className="-mt-16 sm:-mt-20">
              <div
                role="button"
                aria-label="Thay đổi ảnh đại diện"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`relative cursor-pointer select-none rounded-full [--mask-center:calc(100%-22px)] sm:[--mask-center:calc(100%-30px)] ${showOverlay
                  ? "[--mask-radius:22px] sm:[--mask-radius:26px]"
                  : "[--mask-radius:0px] sm:[--mask-radius:0px]"
                  }`}
              >
                <Avatar
                  key={profileData.id}
                  aria-label="Ảnh đại diện người dùng"
                  style={avatarStyle}
                  className={`h-32 w-32 sm:h-40 sm:w-40 border-4 border-background text-large transition-all duration-300 ${showOverlay ? "brightness-95" : ""}`}
                >
                  {isImageLoading && profileData.avatarUrl && (
                    <Skeleton className="absolute inset-0 w-full h-full rounded-full z-10" />
                  )}
                  {profileData.avatarUrl && (
                    <Avatar.Image
                      alt={profileData.name || ""}
                      src={profileData.avatarUrl}
                      onLoad={() => setIsImageLoading(false)}
                      onError={() => setIsImageLoading(false)}
                    />
                  )}
                  <Avatar.Fallback className="border-none bg-gradient-to-br from-[#00b4d8] to-[#90e0ef] text-white text-4xl sm:text-5xl select-none flex items-center justify-center">
                    {profileData.name
                      ? profileData.name.split(" ").map((part) => part[0]).join("").slice(-2).toUpperCase()
                      : <UserIcon className="h-12 w-12" />
                    }
                  </Avatar.Fallback>
                </Avatar>
                <div className={`absolute inset-0 bg-black/10 rounded-full transition-all duration-300 pointer-events-none ${showOverlay ? "opacity-100" : "opacity-0"}`} />
                <div className={`absolute bottom-1 right-1 w-9 h-9 sm:bottom-2 sm:right-2 sm:w-11 sm:h-11 flex items-center justify-center bg-[#27272a] hover:bg-[#3f3f46] text-white rounded-full shadow-lg transition-all duration-300 ease-out transform ${showOverlay ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}>
                  {uploadAvatarMutation.isPending ? (
                    <Spinner size="sm" aria-label="Đang tải ảnh đại diện" />
                  ) : (
                    <FaCamera className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>
            <div className="flex flex-1 flex-col sm:items-start">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {profileData.name}
              </h1>
              <p className="text-medium text-default-500">
                {getRoleName(profileData.role)}
              </p>
            </div>
            <div className="flex flex-row items-center gap-2 mt-4 sm:mt-0 ml-auto">
              {isViewingOther && (
                <Chip color="accent" variant="soft">
                  Chế độ Quản trị viên
                </Chip>
              )}

              <Button
                variant="primary"
                onPress={() => setOpenEdit(true)}
              >
                Sửa thông tin
              </Button>

              {!isViewingOther && (
                <Button
                  variant="secondary"
                  onPress={() => setOpenChangePass(true)}
                >
                  Đổi mật khẩu
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Left Column: Contact & Details */}
        <div className="space-y-6 md:col-span-1">
          <Card className="border border-transparent dark:border-white/10 bg-background/60 shadow-md backdrop-blur-md dark:bg-white/5">
            <CardHeader className="px-2 font-semibold">
              Thông tin liên hệ
            </CardHeader>
            <Separator />
            <CardContent className="space-y-4 px-4 pb-6">
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
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span>Lớp: {profileData.className}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Additional Info / Role-specific content */}
        <div className="space-y-6 md:col-span-2">
          {profileData.role?.toLowerCase() === "student" ? (
            profileData.guardians && profileData.guardians.length > 0 ? (
              <Card className="border border-transparent dark:border-white/10 bg-background/60 shadow-md backdrop-blur-md dark:bg-white/5">
                <CardHeader className="px-2 pt-6 font-semibold">
                  Thông tin người giám hộ
                </CardHeader>
                <Separator />
                <CardContent className="px-4 pb-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {profileData.guardians.map((guardian) => (
                      <div
                        onClick={() => router.push(`/profile?id=${guardian.id}`)}
                        key={guardian.id}
                        className="cursor-pointer flex flex-col space-y-2 rounded-xl border border-default-200 bg-default-50 p-4 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-default-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/15"
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
              <Card className="border border-transparent dark:border-white/10 bg-background/60 shadow-md backdrop-blur-md dark:bg-white/5">
                <CardContent className="px-6 py-12 text-center text-default-500">
                  <UserIcon className="mx-auto mb-4 h-12 w-12 opacity-20" />
                  <p>Không có thông tin giám hộ hoặc chi tiết khác được tìm thấy.</p>
                </CardContent>
              </Card>
            )
          ) : profileData.role?.toLowerCase() === "guardian" && profileData.guardianProfile ? (
            renderGuardianDashboard(profileData.guardianProfile)
          ) : (profileData.role?.toLowerCase() === "admin" || profileData.role?.toLowerCase() === "manager") && profileData.adminProfile ? (
            renderAdminDashboard(profileData.adminProfile)
          ) : profileData.guardians && profileData.guardians.length > 0 ? (
            <Card className="border border-transparent dark:border-white/10 bg-background/60 shadow-md backdrop-blur-md dark:bg-white/5">
              <CardHeader className="px-6 pt-6 font-semibold">
                Thông tin người giám hộ
              </CardHeader>
              <Separator />
              <CardContent className="px-6 pb-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {profileData.guardians.map((guardian) => (
                    <div
                      onClick={() => router.push(`/profile?id=${guardian.id}`)}
                      key={guardian.id}
                      className="cursor-pointer flex flex-col space-y-2 rounded-xl border border-default-200 bg-default-50 p-4 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-default-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/15"
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
            <Card className="border border-transparent dark:border-white/10 bg-background/60 shadow-md backdrop-blur-md dark:bg-white/5">
              <CardContent className="px-6 py-12 text-center text-default-500">
                <UserIcon className="mx-auto mb-4 h-12 w-12 opacity-20" />
                <p>Không có thông tin giám hộ hoặc chi tiết học tập nào khác được tìm thấy.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <ModalEditStudent isOpen={isOpenEdit} setOpen={setOpenEdit} close={closeEdit} studentId={isViewingOther ? idParam : user?.id} isSelf={!isViewingOther} initialData={profileData} />
      <ModalChangePassword isOpen={isOpenChangePass} setOpen={setOpenChangePass} close={closeChangePass} />
    </div>
  );
}
