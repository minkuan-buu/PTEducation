"use client";

import { Icon } from "@iconify/react";
import { Button, Chip, cn, Modal, Pagination, Spinner, Table, Tooltip, useOverlayState } from "@heroui/react";
import type { Key } from "@react-types/shared";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import WeeklySchedule, { type EventItem } from "@/components/weekly-schedule";
import type { ClassDetail, ClassSchedule } from "@/services/api/v2";
import { v2 } from "@/services/api";
import type { AdminGuardian, AdminStudent } from "@/services/api/v2";
import { useClassStudents } from "@/hooks/classes/detail/use-class-student";

function UsersTable({ classId, isPendingFilter }: { classId: string; isPendingFilter: boolean }) {
    const queryClient = useQueryClient();
    const [pageIndex, setPageIndex] = useState(1);
    const [searchTerm] = useState("");
    const pageSize = 10;
    const keyword = searchTerm.trim();
    const { data, isPending } = useClassStudents(classId, { pageIndex, pageSize, keyword, isPendingFilter });
    const tableData = useMemo(() => data?.data ?? [], [data]);
    const totalPages = Math.max(1, data?.totalPages ?? 1);
    const hasNextPage = (data?.pageNumber ?? 1) < totalPages;

    useEffect(() => {
        setPageIndex((prev) => (prev === 1 ? prev : 1));
    }, [keyword]);

    useEffect(() => {
        if (!hasNextPage) return;

        queryClient.prefetchQuery({
            queryKey: ["class-students", classId, "pagination", pageIndex, pageSize, keyword, isPendingFilter],
            queryFn: () => v2.getStudentsInClass(classId, { pageIndex: pageIndex + 1, pageSize, keyword, isPendingFilter }),
            staleTime: 3 * 60 * 1000,
        });
    }, [hasNextPage, keyword, pageIndex, pageSize, queryClient, classId, isPendingFilter]);

    async function handleApproveStudent(studentId: string, accessStatus: string) {
        try {
            await v2.approveStudent(studentId, accessStatus);
            await queryClient.invalidateQueries({
                queryKey: ["class-students", classId, "pagination", pageIndex, pageSize, keyword, true],
            });
            await queryClient.invalidateQueries({
                queryKey: ["class-students", classId, "pagination", pageIndex, pageSize, keyword, false],
            });
            await queryClient.invalidateQueries({
                queryKey: ["classes", classId],
            });
        } catch (err) {
            console.error("Error approving student:", err);
        }
    }

    async function handleDeleteStudent(studentId: string) {
        try {
            await v2.deleteStudent(studentId);
            await queryClient.invalidateQueries({
                queryKey: ["class-students", classId, "pagination", pageIndex, pageSize, keyword, true],
            });
            await queryClient.invalidateQueries({
                queryKey: ["class-students", classId, "pagination", pageIndex, pageSize, keyword, false],
            });
            await queryClient.invalidateQueries({
                queryKey: ["classes", classId],
            });
        } catch (err) {
            console.error("Error deleting student:", err);
        }
    }

    const StudentApproveActions = ({
        studentId,
        onAction,
    }: {
        studentId: string;
        onAction: (id: string, status: string) => Promise<void>;
    }) => {
        const [isProcessing, setIsProcessing] = useState(false);

        const handlePress = async (status: string) => {
            setIsProcessing(true);
            try {
                await onAction(studentId, status);
            } finally {
                setIsProcessing(false);
            }
        };

        if (isProcessing) {
            return (
                <div className="flex h-10 min-w-[88px] items-center">
                    <Spinner size="md" />
                </div>
            );
        }

        return (
            <div className="flex h-10 gap-2">
                <Tooltip delay={0}>
                    <Button className="rounded-full" size="md" variant="outline" onPress={() => handlePress("Approved")}>
                        <Icon icon="simple-line-icons:check" color="#38b000" width="20" height="20" />
                    </Button>
                </Tooltip>
                <Tooltip delay={0}>
                    <Button className="rounded-full" size="md" variant="outline" onPress={() => handlePress("Rejected")}>
                        <Icon icon="oui:cross-in-circle-empty" color="#fd0a3a" width="20" height="20" />
                    </Button>
                </Tooltip>
            </div>
        );
    };

    const StudentActions = ({
        studentId,
        onAction,
    }: {
        studentId: string;
        onAction: (id: string) => Promise<void>;
    }) => {
        const [isProcessing, setIsProcessing] = useState(false);

        const handlePress = async () => {
            setIsProcessing(true);
            try {
                await onAction(studentId);
            } finally {
                setIsProcessing(false);
            }
        };

        if (isProcessing) {
            return (
                <div className="flex h-10 min-w-[88px] items-center">
                    <Spinner size="md" />
                </div>
            );
        }

        return (
            <div className="flex h-10 gap-2">
                <Tooltip delay={0}>
                    <Button className="rounded-full" size="md" variant="outline">
                        <Icon icon="lucide:edit" width="20" height="20" />
                        <Tooltip.Content placement="bottom">
                            <p>Chỉnh sửa</p>
                        </Tooltip.Content>
                    </Button>
                </Tooltip>
                <Tooltip delay={0}>
                    <Button className="rounded-full" size="md" variant="outline">
                        <Icon icon="ep:remove" width="20" height="20" />
                        <Tooltip.Content placement="bottom">
                            <p>Vô hiệu hóa</p>
                        </Tooltip.Content>
                    </Button>
                </Tooltip>
                <Tooltip delay={0}>
                    <Button className="rounded-full" size="md" variant="outline" onPress={() => handlePress()}>
                        <Icon icon="mingcute:delete-2-fill" color="#fd0a3a" width="20" height="20" />
                        <Tooltip.Content placement="bottom">
                            <p>Xóa</p>
                        </Tooltip.Content>
                    </Button>
                </Tooltip>
            </div>
        );
    };

    const renderExpandableRow = (item: AdminStudent | AdminGuardian) => {
        const isGuardian = "relationship" in item;

        return (
            <Table.Row id={item.id} key={item.id} textValue={item.name}>
                <Table.Cell textValue={item.id}>
                    {({ hasChildItems, isExpanded, isTreeColumn }) => (
                        <div className="flex items-center gap-2">
                            {hasChildItems && isTreeColumn && (
                                <Button isIconOnly aria-label="Toggle row" size="sm" slot="chevron" variant="ghost">
                                    <Icon icon="gravity-ui:chevron-right" className={cn("size-4 transition-transform", isExpanded ? "rotate-90" : "")} />
                                </Button>
                            )}
                            <span className={isGuardian ? "pl-6 text-muted-foreground" : ""}>{item.id}</span>
                        </div>
                    )}
                </Table.Cell>

                <Table.Cell>
                    <div className="flex flex-row items-center gap-4">
                        <span>{item.name}</span>
                        {isGuardian && (item as AdminGuardian).isPrimary ? (
                            <Chip color="accent">
                                <Chip.Label>Liên hệ chính</Chip.Label>
                            </Chip>
                        ) : null}
                    </div>
                </Table.Cell>
                <Table.Cell>{item.email}</Table.Cell>
                <Table.Cell>{item.phone}</Table.Cell>
                <Table.Cell>{isGuardian ? <span className="italic text-primary">{(item as AdminGuardian).relationship}</span> : "-"}</Table.Cell>
                <Table.Cell>
                    {!isGuardian ? (
                        isPendingFilter ? (
                            <StudentApproveActions studentId={item.id} onAction={handleApproveStudent} />
                        ) : (
                            <StudentActions studentId={item.id} onAction={handleDeleteStudent} />
                        )
                    ) : null}
                </Table.Cell>

                <Table.Collection items={"guardians" in item ? (item as AdminStudent).guardians ?? [] : []}>
                    {(child) => renderExpandableRow(child as AdminGuardian)}
                </Table.Collection>
            </Table.Row>
        );
    };

    const [expandedKeys, setExpandedKeys] = useState<Set<Key>>(() => new Set(["1"]));

    return (
        <Table>
            <Table.ScrollContainer>
                <Table.Content aria-label="User management table" expandedKeys={expandedKeys} selectionMode="none" treeColumn="id" onExpandedChange={setExpandedKeys}>
                    <Table.Header>
                        <Table.Column id="id" isRowHeader>
                            ID
                        </Table.Column>
                        <Table.Column id="name">Họ Tên</Table.Column>
                        <Table.Column id="email">Email</Table.Column>
                        <Table.Column id="phone">Điện thoại</Table.Column>
                        <Table.Column id="role">Vai trò/Quan hệ</Table.Column>
                        <Table.Column id="actions">Hành động</Table.Column>
                    </Table.Header>
                    <Table.Body items={tableData}>{(item) => renderExpandableRow(item as AdminStudent)}</Table.Body>
                </Table.Content>
            </Table.ScrollContainer>
            <Table.Footer>
                {tableData.length === 0 && !isPending ? (
                    <div className="flex w-full items-center justify-center py-4">
                        <p className="text-center text-sm text-muted-foreground">Danh sách trống</p>
                    </div>
                ) : (
                    <Pagination>
                        <Pagination.Summary className="text-sm text-muted">Trang {pageIndex} / {totalPages}</Pagination.Summary>
                        <Pagination.Content>
                            <Pagination.Item>
                                <Pagination.Previous isDisabled={isPending || pageIndex === 1} onPress={() => setPageIndex((prev) => Math.max(1, prev - 1))}>
                                    Trước
                                </Pagination.Previous>
                            </Pagination.Item>
                            {Array.from({ length: totalPages }, (_, index) => {
                                const page = index + 1;

                                return (
                                    <Pagination.Item key={page}>
                                        <Pagination.Link isActive={page === pageIndex} isDisabled={isPending} onPress={() => setPageIndex(page)}>
                                            {page}
                                        </Pagination.Link>
                                    </Pagination.Item>
                                );
                            })}
                            <Pagination.Item>
                                <Pagination.Next isDisabled={isPending || pageIndex === totalPages} onPress={() => setPageIndex((prev) => Math.min(totalPages, prev + 1))}>
                                    Sau
                                </Pagination.Next>
                            </Pagination.Item>
                        </Pagination.Content>
                    </Pagination>
                )}
                {isPending ? <p className="mt-3 text-center text-sm text-muted-foreground">Đang tải dữ liệu...</p> : null}
            </Table.Footer>
        </Table>
    );
}

const DAY_LABELS: Record<number, string> = {
    1: "Thứ 2",
    2: "Thứ 3",
    3: "Thứ 4",
    4: "Thứ 5",
    5: "Thứ 6",
    6: "Thứ 7",
    0: "Chủ nhật",
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
                    className="w-full rounded-lg border border-divider bg-background px-3 py-2 text-sm"
                    type="time"
                    value={schedule.startTime}
                    onChange={(e) => onChange(index, "startTime", e.target.value)}
                />
                <span className="text-muted">→</span>
                <input
                    className="w-full rounded-lg border border-divider bg-background px-3 py-2 text-sm"
                    type="time"
                    value={schedule.endTime}
                    onChange={(e) => onChange(index, "endTime", e.target.value)}
                />
            </div>
            <Button variant="secondary" onPress={() => onRemove(index)}>
                <Icon icon="mingcute:delete-2-fill" width="18" height="18" />
            </Button>
        </div>
    );
};

export function ClassGeneralPanel({ classId, classData }: { classId: string; classData: ClassDetail }) {
    const { isOpen, setOpen, close } = useOverlayState();
    const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
    const [isPendingFilter, setIsPendingFilter] = useState(false);

    const scheduleEvents = useMemo<EventItem[]>(() => {
        if (!classData.weeklySchedules || !Array.isArray(classData.weeklySchedules)) {
            return [];
        }

        const colors: Array<NonNullable<EventItem["colorTheme"]>> = ["blue", "purple", "green", "orange"];

        return classData.weeklySchedules.map((schedule, index) => ({
            id: `schedule-${index}`,
            title: `${classData.name} - ${DAY_LABELS[schedule.dayOfWeek] ?? `Thứ ${schedule.dayOfWeek + 1}`}`,
            day: schedule.dayOfWeek,
            start: schedule.startTime?.substring(0, 5) || "",
            end: schedule.endTime?.substring(0, 5) || "",
            colorTheme: colors[index % colors.length],
        }));
    }, [classData]);

    const handleScheduleChange = (index: number, field: keyof ClassSchedule, value: number | string) => {
        setSchedules((prev) => prev.map((item, currentIndex) => (currentIndex === index ? { ...item, [field]: value } : item)));
    };

    const addSchedule = () => {
        setSchedules((prev) => [...prev, { dayOfWeek: 1, startTime: "07:00", endTime: "09:00" }]);
    };

    const removeSchedule = (index: number) => {
        setSchedules((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
    };

    const resetForm = () => {
        setSchedules([]);
    };

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            resetForm();
        }
        setOpen(nextOpen);
    };

    const handleCloseModal = () => {
        resetForm();
        close();
    };

    return (
        <section>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                <div className="md:col-span-8">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Danh sách học sinh</h2>
                        <Button variant={!isPendingFilter ? "outline" : "primary"} onClick={() => setIsPendingFilter(!isPendingFilter)}>
                            Đang chờ duyệt ({classData.totalPendingStudent})
                        </Button>
                    </div>
                    <UsersTable classId={classId} isPendingFilter={isPendingFilter} />
                </div>

                <div className="md:col-span-4">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Lịch học trong tuần</h2>
                        <Button variant="primary" onPress={() => setOpen(true)}>
                            Chỉnh sửa lịch
                        </Button>
                    </div>
                    <Modal>
                        <Modal.Backdrop isOpen={isOpen} onOpenChange={handleOpenChange}>
                            <Modal.Container size="lg">
                                <Modal.Dialog>
                                    <Modal.Header>
                                        <Modal.Heading>Chỉnh sửa lịch học</Modal.Heading>
                                    </Modal.Header>
                                    <Modal.Body className="px-2">
                                        <div className="mt-4 flex flex-col gap-4">
                                            <div className="mt-2 pt-4">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <h3 className="text-md font-semibold">Lịch học cố định</h3>
                                                    <Button variant="secondary" onPress={addSchedule}>
                                                        <Icon icon="lucide:plus" width="16" />
                                                        Thêm buổi học
                                                    </Button>
                                                </div>

                                                {schedules.length === 0 ? (
                                                    <p className="text-sm text-muted">Chưa có buổi học nào. Nhấn "Thêm buổi học" để thêm lịch học.</p>
                                                ) : (
                                                    <div className="flex flex-col gap-3">
                                                        {schedules.map((schedule, index) => (
                                                            <ScheduleRow key={index} schedule={schedule} index={index} onChange={handleScheduleChange} onRemove={removeSchedule} />
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
                                        <Button variant="primary">Chỉnh sửa</Button>
                                    </Modal.Footer>
                                </Modal.Dialog>
                            </Modal.Container>
                        </Modal.Backdrop>
                    </Modal>
                    <WeeklySchedule events={scheduleEvents} />
                </div>
            </div>
        </section>
    );
}
