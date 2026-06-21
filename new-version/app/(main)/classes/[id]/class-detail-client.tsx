"use client";

import { Breadcrumbs, Tabs } from "@heroui/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaUsers } from "react-icons/fa";
import { HiClipboardDocumentList } from "react-icons/hi2";
import { IoCalendarOutline } from "react-icons/io5";
import { TbPresentationAnalytics } from "react-icons/tb";

import { ClassAttendancePanel } from "./_components/class-attendance-panel";
import { ClassGeneralPanel } from "./_components/class-general-panel";
import { ClassScorePanel } from "./_components/class-score-panel";

import { Card } from "@/components/classes/card";
import { LoadingDots } from "@/components/loading-dots";
import { useClasses } from "@/hooks/classes/detail/use-class-detail";

export default function ClassDetailClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const classId = params?.id ?? "";
  const resolveTabFromHash = (hash: string | null) => {
    if (!hash) return "overview";
    const key = hash.replace(/^#/, "");
    return key === "attendance" || key === "score" ? key : "overview";
  };

  const [selectedTab, setSelectedTab] = useState(() => {
    if (typeof window === "undefined") return "overview";
    return resolveTabFromHash(window.location.hash);
  });

  useEffect(() => {
    if (!classId) {
      router.replace("/classes");
    }
  }, [classId, router]);

  const {
    data: classData,
    isLoading: isLoadingClass,
    isError: isErrorClass,
    refetch: refetchClass,
  } = useClasses({ classId });

  // Update the browser tab title dynamically when class data loads
  useEffect(() => {
    if (classData?.name) {
      document.title = `${classData.name} | PTEducation`;
    }
  }, [classData?.name]);

  useEffect(() => {
    if (selectedTab !== "overview") {
      return;
    }

    void refetchClass();
  }, [refetchClass, selectedTab]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.location.hash = selectedTab === "overview" ? "" : selectedTab;
  }, [selectedTab]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncSelectedTabFromHash = () => {
      setSelectedTab(resolveTabFromHash(window.location.hash));
    };

    window.addEventListener("hashchange", syncSelectedTabFromHash);

    return () => {
      window.removeEventListener("hashchange", syncSelectedTabFromHash);
    };
  }, []);

  if (!classId) {
    return null;
  }

  if (isLoadingClass) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingDots gap={12} size={14} />
      </div>
    );
  }

  if (isErrorClass || !classData) {
    return <div>Could not load class details</div>;
  }

  const formatDateOnly = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <main className="min-h-screen flex flex-col justify-start">
      <div className="px-8 py-6">
        <Breadcrumbs className="mb-4">
          <Breadcrumbs.Item onClick={() => router.push("/classes")}>Lớp học</Breadcrumbs.Item>
          <Breadcrumbs.Item href="#">{classData.name}</Breadcrumbs.Item>
        </Breadcrumbs>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{classData.name}</h1>
            <p className="text-muted mt-2">
              {formatDateOnly(classData.startAt)} - {formatDateOnly(classData.endAt)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2 md:grid-cols-4 md:gap-4 xl:grid-cols-4">
          <Card
            description={`${classData.totalStudent}`}
            logo={<FaUsers className="h-5 w-5" />}
            title="Tổng số học sinh"
          />
          <Card
            description={classData.averageScore.toFixed(2)}
            logo={<HiClipboardDocumentList className="h-5 w-5" />}
            title="Điểm trung bình của lớp"
          />
          <Card
            description={`${classData.completedSessions}/${classData.totalSessions}`}
            logo={<IoCalendarOutline className="h-5 w-5" />}
            title="Số buổi học đã diễn ra"
          />
          <Card
            description={
              classData.totalSessions > 0
                ? /*`${Math.round((classData.completedSessions / classData.totalSessions) * 100)}%`*/ `${classData.attendanceRate.toFixed(1)}%`
                : "0%"
            }
            logo={<TbPresentationAnalytics className="h-5 w-5" />}
            title="Tỉ lệ chuyên cần"
          />
        </div>

        <Tabs
          className="w-full pt-6"
          selectedKey={selectedTab}
          onSelectionChange={(key) => setSelectedTab(String(key))}
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label="Options">
              <Tabs.Tab id="overview">
                Thông tin chung
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="attendance">
                Điểm danh
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="score">
                Điểm số
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
          <Tabs.Panel className="pt-4" id="overview">
            <ClassGeneralPanel classData={classData} classId={classId} />
          </Tabs.Panel>
          <Tabs.Panel className="pt-4" id="attendance">
            <ClassAttendancePanel classId={classId} />
          </Tabs.Panel>
          <Tabs.Panel className="pt-4" id="score">
            <ClassScorePanel classId={classId} />
          </Tabs.Panel>
        </Tabs>
      </div>
    </main>
  );
}
