"use client";

import { Breadcrumbs, Tabs } from "@heroui/react";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import { LoadingDots } from "@/components/loading-dots";
import { useClasses } from "@/hooks/classes/detail/use-class-detail";

import { ClassAttendancePanel } from "./_components/class-attendance-panel";
import { ClassGeneralPanel } from "./_components/class-general-panel";

import { FaUsers } from "react-icons/fa";
import { HiClipboardDocumentList } from "react-icons/hi2";
import { IoCalendarOutline } from "react-icons/io5";
import { TbPresentationAnalytics } from "react-icons/tb";
import { Card } from "@/components/classes/card";

export default function ClassDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const classId = params?.id ?? "";

    useEffect(() => {
        if (!classId) {
            router.replace("/classes");
        }
    }, [classId, router]);

    const { data: classData, isLoading: isLoadingClass, isError: isErrorClass } = useClasses({ classId });

    if (!classId) {
        return null;
    }

    if (isLoadingClass) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <LoadingDots size={14} gap={12} />
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
            <div className="py-6 px-8">
                <Breadcrumbs className="mb-4">
                    <Breadcrumbs.Item onClick={() => router.push("/classes")}>
                        Lớp học
                    </Breadcrumbs.Item>
                    <Breadcrumbs.Item href="#">{classData.name}</Breadcrumbs.Item>
                </Breadcrumbs>

                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">{classData.name}</h1>
                        <p className="text-muted mt-2">
                            {formatDateOnly(classData.startAt)} - {formatDateOnly(classData.endAt)}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:grid-cols-4 md:gap-4 pt-2">
                    <Card logo={<FaUsers className="h-5 w-5" />} title="Tổng số học sinh" description={`${classData.totalStudent}`} />
                    <Card logo={<HiClipboardDocumentList className="h-5 w-5" />} title="Điểm trung bình của lớp" description={classData.averageScore.toFixed(2)} />
                    <Card logo={<IoCalendarOutline className="h-5 w-5" />} title="Số buổi học đã diễn ra" description={`${classData.completedSessions}/${classData.totalSessions}`} />
                    <Card
                        logo={<TbPresentationAnalytics className="h-5 w-5" />}
                        title="Tỉ lệ chuyên cần"
                        description={classData.totalSessions > 0 ? `${Math.round((classData.completedSessions / classData.totalSessions) * 100)}%` : "0%"}
                    />
                </div>
                <Tabs className="w-full pt-6">
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
                        <ClassGeneralPanel classId={classId} classData={classData} />
                    </Tabs.Panel>
                    <Tabs.Panel className="pt-4" id="attendance">
                        <ClassAttendancePanel classId={classId} classData={classData} />
                    </Tabs.Panel>
                    <Tabs.Panel className="pt-4" id="score">
                        <p>Generate and download detailed reports.</p>
                    </Tabs.Panel>
                </Tabs>
            </div>
        </main>
    );
}