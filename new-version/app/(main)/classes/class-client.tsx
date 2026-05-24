"use client";

import {
    Button,
    Chip,
    Input,
    Modal,
    Pagination,
    Tooltip,
    useOverlayState,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { v1, v2 } from "@/services/api";
import type { ClassSchedule } from "@/services/api/v2/classes";
import "./class.css";
import { useClasses, useCreateClass } from "@/hooks/classes";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { LoadingDots } from "@/components/loading-dots";

const DAY_LABELS: Record<number, string> = {
    1: "Thứ 2",
    2: "Thứ 3",
    3: "Thứ 4",
    4: "Thứ 5",
    5: "Thứ 6",
    6: "Thứ 7",
    0: "Chủ nhật",
};

const getDayLabel = (day: number) => DAY_LABELS[day] ?? `Thứ ${day + 1}`;

const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const ScheduleRow = ({
    schedule,
    index,
    onChange,
    onRemove,
}: {
    schedule: ClassSchedule;
    index: number;
    onChange: (index: number, field: keyof ClassSchedule, value: number | string) => void;
    onRemove: (index: number) => void;
}) => {
    return (
        <div className="flex items-end gap-3">
            <select
                className="w-full rounded-lg border border-divider bg-background px-3 py-2 text-sm"
                value={schedule.dayOfWeek}
                onChange={(e) => onChange(index, "dayOfWeek", Number(e.target.value))}
            >
                {Object.entries(DAY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                        {label}
                    </option>
                ))}
            </select>
            <div className="flex items-center gap-1">
                <input
                    type="time"
                    value={schedule.startTime}
                    onChange={(e) => onChange(index, "startTime", e.target.value)}
                    className="w-full rounded-lg border border-divider bg-background px-3 py-2 text-sm"
                />
                <span className="text-muted">→</span>
                <input
                    type="time"
                    value={schedule.endTime}
                    onChange={(e) => onChange(index, "endTime", e.target.value)}
                    className="w-full rounded-lg border border-divider bg-background px-3 py-2 text-sm"
                />
            </div>
            <Button
                variant="secondary"
                onPress={() => onRemove(index)}
            >
                <Icon icon="mingcute:delete-2-fill" width="18" height="18" />
            </Button>
        </div>
    );
};

export default function ClassClient() {
    const router = useRouter();
    const { isOpen, setOpen, open, close } = useOverlayState();
    // const [data, setData] = useState<ClassData[]>([]);
    // const [isLoading, setIsLoading] = useState(true);
    // const [error, setError] = useState<string | null>(null);
    // const [isSaving, setIsSaving] = useState(false);
    const { mutate, isPending, isSuccess } = useCreateClass(() => hanleCreateSuccess());

    // Form state
    const [name, setName] = useState("");
    const [startAt, setStartAt] = useState("");
    const [endAt, setEndAt] = useState("");
    const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
    const [pageIndex, setPageIndex] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const pageSize = 10;
    const keyword = searchTerm.trim();

    // const loadClasses = async () => {
    //     try {
    //         setIsLoading(true);
    //         setError(null);
    //         const classes = await v2.getAdminClasses();
    //         setData(classes);
    //     } catch {
    //         setError("Không thể tải danh sách lớp học.");
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    // useEffect(() => {
    //     loadClasses();
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, []);

    const queryClient = useQueryClient();
    const { data, isLoading } = useClasses({ pageIndex, pageSize, keyword });
    const tableData = useMemo(() => data?.data ?? [], [data]);
    const totalPages = Math.max(1, data?.totalPages ?? 1);
    const hasNextPage = (data?.pageNumber ?? 1) < totalPages;

    // useEffect(() => {
    //     if (pageIndex > totalPages) {
    //         setPageIndex(totalPages);
    //     }
    // }, [pageIndex, totalPages]);

    useEffect(() => {
        setPageIndex((prev) => (prev === 1 ? prev : 1));
    }, [keyword]);

    useEffect(() => {
        if (!hasNextPage) return;
        queryClient.prefetchQuery({
            queryKey: ["classes", "pagination", pageIndex + 1, pageSize, keyword],
            queryFn: () => v1.getAdminClasses({ pageIndex: pageIndex + 1, keyword }),
            staleTime: 3 * 60 * 1000, // 3 minutes
        });
    }, [hasNextPage, keyword, pageIndex, pageSize, queryClient]);

    const handleScheduleChange = (
        index: number,
        field: keyof ClassSchedule,
        value: number | string,
    ) => {
        setSchedules((prev) =>
            prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
        );
    };

    const addSchedule = () => {
        setSchedules((prev) => [
            ...prev,
            { dayOfWeek: 1, startTime: "07:00", endTime: "09:00" },
        ]);
    };

    const removeSchedule = (index: number) => {
        setSchedules((prev) => prev.filter((_, i) => i !== index));
    };

    const resetForm = () => {
        setName("");
        setStartAt("");
        setEndAt("");
        setSchedules([]);
    };

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            resetForm();
        }
        setOpen(nextOpen);
    };

    const hanleCreateSuccess = () => {
        resetForm();
        close();
    }

    const handleCreate = async () => {
        if (!name || !startAt || !endAt) {
            alert("Vui lòng nhập đầy đủ tên lớp, ngày bắt đầu và ngày kết thúc.");
            return;
        }

        if (schedules.length === 0) {
            alert("Vui lòng thêm ít nhất một buổi học trong lịch cố định.");
            return;
        }

        try {
            // setIsSaving(true);
            // await v2.createClass({
            //     name,
            //     startAt: new Date(startAt).toISOString(),
            //     endAt: new Date(endAt).toISOString(),
            //     schedules,
            // });
            mutate({
                name,
                startAt: new Date(startAt).toISOString(),
                endAt: new Date(endAt).toISOString(),
                schedules,
            });
            // await loadClasses();
        } catch (err) {
            console.error("Error creating class:", err);
            alert("Có lỗi xảy ra khi tạo lớp học.");
        } finally {
            // setIsSaving(false);
        }
    };

    const handleDelete = useCallback(async (classId: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa lớp học này?")) return;
        try {
            await v2.deleteClass(classId);
            // await loadClasses();
        } catch (err) {
            console.error("Error deleting class:", err);
            alert("Có lỗi xảy ra khi xóa lớp học.");
        }
    }, []);

    const handleCloseModal = () => {
        resetForm();
        close();
    };

    return (
        <main className="min-h-screen flex flex-col justify-start">
            <div className="py-6 px-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Lớp học</h1>
                        <p className="text-muted mt-2">Trang quản lý lớp học</p>
                    </div>
                    <Button
                        variant="primary"
                        onPress={open}
                    >
                        <Icon icon="lucide:plus" width="20" />
                        Tạo lớp học
                    </Button>
                </div>

                <div className="mt-4">
                    <Input
                        placeholder="Tìm kiếm lớp học..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                    />
                </div>

                <Modal>
                    <Modal.Backdrop isOpen={isOpen} onOpenChange={handleOpenChange}>
                        <Modal.Container size="lg">
                            <Modal.Dialog>
                                <Modal.Header>
                                    <Modal.Heading>Tạo lớp học mới</Modal.Heading>
                                </Modal.Header>
                                <Modal.Body className="px-2">
                                    <div className="flex flex-col gap-4 mt-4">
                                        <Input
                                            placeholder="Tên lớp"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                        <div className="flex flex-row justify-between gap-4">
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm text-muted">Ngày bắt đầu</label>
                                                <Input
                                                    type="date"
                                                    placeholder="Ngày bắt đầu"
                                                    value={startAt}
                                                    onChange={(e) => setStartAt(e.target.value)}
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm text-muted">Ngày kết thúc</label>
                                                <Input
                                                    type="date"
                                                    placeholder="Ngày kết thúc"
                                                    value={endAt}
                                                    onChange={(e) => setEndAt(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="border-t border-divider pt-4 mt-2">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-md font-semibold">Lịch học cố định</h3>
                                                <Button
                                                    variant="secondary"
                                                    onPress={addSchedule}
                                                >
                                                    <Icon icon="lucide:plus" width="16" />
                                                    Thêm buổi học
                                                </Button>
                                            </div>

                                            {schedules.length === 0 ? (
                                                <p className="text-sm text-muted">
                                                    Chưa có buổi học nào. Nhấn "Thêm buổi học" để thêm lịch học.
                                                </p>
                                            ) : (
                                                <div className="flex flex-col gap-3">
                                                    {schedules.map((schedule, index) => (
                                                        <ScheduleRow
                                                            key={index}
                                                            schedule={schedule}
                                                            index={index}
                                                            onChange={handleScheduleChange}
                                                            onRemove={removeSchedule}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Modal.Body>
                                <Modal.Footer>
                                    <Button variant="ghost" onPress={handleCloseModal}>
                                        Hủy
                                    </Button>
                                    <Button
                                        variant="primary"
                                        isDisabled={isPending}
                                        onPress={handleCreate}
                                    >
                                        {isPending ? "Đang tạo..." : "Tạo lớp"}
                                    </Button>
                                </Modal.Footer>
                            </Modal.Dialog>
                        </Modal.Container>
                    </Modal.Backdrop>
                </Modal>

                <div className="mt-6 flex flex-col gap-4">
                    {tableData.length === 0 && !isLoading ? (
                        <p className="text-sm text-muted">
                            {keyword
                                ? "Không tìm thấy lớp học phù hợp."
                                : "Chưa có lớp học nào."}
                        </p>
                    ) : null}
                    {tableData.map((classItem) => (
                        <div
                            key={classItem.id}
                            className="cursor-pointer rounded-2xl border border-divider bg-background/60 p-4 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md active:translate-y-0"
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                                router.push(`/classes/${classItem.id}`);
                            }}
                            onKeyDown={(event) => {
                                if (event.currentTarget !== event.target) {
                                    return;
                                }
                                if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    router.push(`/classes/${classItem.id}`);
                                }
                            }}
                        >
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-lg font-semibold">{classItem.name}</h3>
                                        <Chip
                                            variant={classItem.status === "Active" ? "primary" : "secondary"}
                                        >
                                            {classItem.status === "Active" ? "Hoạt động" : "Vô hiệu"}
                                        </Chip>
                                    </div>
                                    <div className="text-sm text-muted">
                                        <span className="mr-4">Bắt đầu: {formatDateTime(classItem.startAt)}</span>
                                        <span>Kết thúc: {formatDateTime(classItem.endAt)}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {classItem.schedules && classItem.schedules.length > 0 ? (
                                            classItem.schedules.map((schedule, index) => (
                                                <span
                                                    key={`${classItem.id}-${index}`}
                                                    className="rounded-full border border-divider px-2 py-1 text-xs text-muted"
                                                >
                                                    {getDayLabel(schedule.dayOfWeek)} {schedule.startTime}-{schedule.endTime}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-muted">Chưa có lịch học.</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
                                    <div>
                                        <span className="font-semibold text-foreground">
                                            {classItem.totalStudent ?? 0}
                                        </span>{" "}
                                        học viên
                                    </div>
                                    <div>Tạo bởi: {classItem.createdBy?.name ?? "-"}</div>
                                    <Tooltip>
                                        <Button
                                            variant="secondary"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                handleDelete(classItem.id);
                                            }}
                                        >
                                            <Icon icon="mingcute:delete-2-fill" width="20" height="20" />
                                        </Button>
                                        <Tooltip.Content placement="bottom">
                                            <p>Xóa lớp</p>
                                        </Tooltip.Content>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                    ))}
                    {totalPages > 1 ? (
                        <div className="pt-2">
                            <Pagination>
                                <Pagination.Summary className="text-sm text-muted">
                                    Trang {pageIndex} / {totalPages}
                                </Pagination.Summary>
                                <Pagination.Content>
                                    <Pagination.Item>
                                        <Pagination.Previous
                                            isDisabled={isLoading || pageIndex === 1}
                                            onPress={() =>
                                                setPageIndex((prev) => Math.max(1, prev - 1))
                                            }
                                        >
                                            Trước
                                        </Pagination.Previous>
                                    </Pagination.Item>
                                    {Array.from({ length: totalPages }, (_, index) => {
                                        const page = index + 1;

                                        return (
                                            <Pagination.Item key={page}>
                                                <Pagination.Link
                                                    isActive={page === pageIndex}
                                                    isDisabled={isLoading}
                                                    onPress={() => setPageIndex(page)}
                                                >
                                                    {page}
                                                </Pagination.Link>
                                            </Pagination.Item>
                                        );
                                    })}
                                    <Pagination.Item>
                                        <Pagination.Next
                                            isDisabled={isLoading || pageIndex === totalPages}
                                            onPress={() =>
                                                setPageIndex((prev) => Math.min(totalPages, prev + 1))
                                            }
                                        >
                                            Sau
                                        </Pagination.Next>
                                    </Pagination.Item>
                                </Pagination.Content>
                            </Pagination>
                        </div>
                    ) : null}
                    {isLoading ? (
                        // <p className="text-sm text-center text-muted-foreground">Đang tải dữ liệu...</p>
                        <div className="min-h-[200px] flex items-center justify-center">
                            <LoadingDots size={12} gap={12} />
                        </div>
                    ) : null}
                    {/* {isError ? <p className="mt-3 text-sm text-danger text-center">{error.message}</p> : null} */}
                </div>
            </div>
        </main>
    );
}