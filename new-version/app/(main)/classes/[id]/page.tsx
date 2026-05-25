"use client";

import { Card } from "@/components/classes/card";
import { LoadingDots } from "@/components/loading-dots";
import { useClasses } from "@/hooks/classes/detail/use-class-detail";
import { Breadcrumbs, Button, Chip, cn, Pagination, Spinner, Table, Tooltip } from "@heroui/react";
import { useParams, useRouter } from "next/navigation";
import { FaUsers } from "react-icons/fa";
import { HiClipboardDocumentList } from "react-icons/hi2";
import { IoCalendarOutline } from "react-icons/io5";
import { TbPresentationAnalytics } from "react-icons/tb";
import { Icon } from "@iconify/react";
import type { Key } from "@react-types/shared";
import { useEffect, useMemo, useState } from "react";

import { v2 } from "@/services/api";
import type { AdminGuardian, AdminStudent } from "@/services/api/v2";
import { useUsers } from "@/hooks/users/use-users";
import { useQueryClient } from "@tanstack/react-query";
import { useClassStudents } from "@/hooks/classes/detail/use-class-student";

/* Users table component (copied from user-client) */
function UsersTable({ classId, isPendingFilter }: { classId: string; isPendingFilter: boolean }) {
    const queryClient = useQueryClient();
    const [pageIndex, setPageIndex] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
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
            queryKey: [
                "class-students",
                classId,
                "pagination",
                pageIndex,
                pageSize,
                keyword,
                isPendingFilter,
            ],
            queryFn: () => v2.getStudentsInClass(classId, { pageIndex: pageIndex + 1, pageSize, keyword, isPendingFilter }),
            staleTime: 3 * 60 * 1000, // 3 minutes
        });
    }, [hasNextPage, keyword, pageIndex, pageSize, queryClient, isPendingFilter]);

    async function handleApproveStudent(studentId: string, accessStatus: string) {
        try {
            await v2.approveStudent(studentId, accessStatus);
            await queryClient.invalidateQueries({
                queryKey: [
                    "class-students",
                    classId,
                    "pagination",
                    pageIndex,
                    pageSize,
                    keyword,
                    true,
                ],
            });
            await queryClient.invalidateQueries({
                queryKey: [
                    "class-students",
                    classId,
                    "pagination",
                    pageIndex,
                    pageSize,
                    keyword,
                    false,
                ],
            });
            await queryClient.invalidateQueries({
                queryKey: ["classes", classId]
            });
        } catch (err) {
            console.error("Error approving student:", err);
        }
    }

    async function handleDeleteStudent(studentId: string) {
        try {
            await v2.deleteStudent(studentId);
            await queryClient.invalidateQueries({
                queryKey: [
                    "class-students",
                    classId,
                    "pagination",
                    pageIndex,
                    pageSize,
                    keyword,
                    true,
                ],
            });
            await queryClient.invalidateQueries({
                queryKey: [
                    "class-students",
                    classId,
                    "pagination",
                    pageIndex,
                    pageSize,
                    keyword,
                    false,
                ],
            });
            await queryClient.invalidateQueries({
                queryKey: ["classes", classId]
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
            <div className="flex gap-2 h-10">
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
            <div className="flex gap-2 h-10">
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
            <Table.Row id={item.id} textValue={item.name} key={item.id}>
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

                <Table.Cell>
                    {isGuardian ? <span className="italic text-primary">{(item as AdminGuardian).relationship}</span> : "-" /*(item as AdminStudent).role*/}
                </Table.Cell>

                {/* <Table.Cell>{isGuardian ? "-" : (item as AdminStudent).className}</Table.Cell> */}
                <Table.Cell>
                    {!isGuardian ? (isPendingFilter ? (
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
                <Table.Content aria-label="User management table" selectionMode="none" treeColumn="id" expandedKeys={expandedKeys} onExpandedChange={setExpandedKeys}>
                    <Table.Header>
                        <Table.Column id="id" isRowHeader>
                            ID
                        </Table.Column>
                        <Table.Column id="name">Họ Tên</Table.Column>
                        <Table.Column id="email">Email</Table.Column>
                        <Table.Column id="phone">Điện thoại</Table.Column>
                        <Table.Column id="role">Vai trò/Quan hệ</Table.Column>
                        {/* <Table.Column id="className">Lớp</Table.Column> */}
                        <Table.Column id="actions">Hành động</Table.Column>
                    </Table.Header>

                    <Table.Body items={tableData}>{(item) => renderExpandableRow(item as AdminStudent)}</Table.Body>
                </Table.Content>
            </Table.ScrollContainer>
            <Table.Footer>
                {tableData.length === 0 && !isPending ? (
                    <div className="w-full flex items-center justify-center py-4">
                        <p className="text-sm text-center text-muted-foreground">Danh sách trống</p>
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
                {isPending ? <p className="mt-3 text-sm text-center text-muted-foreground">Đang tải dữ liệu...</p> : null}
            </Table.Footer>
        </Table>
    );
}

export default function ClassDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const classId = params?.id ?? "";
    const [isPendingFilter, setIsPendingFilter] = useState(false);

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

    if (!classId) {
        return router.push("/classes");
    }

    const { data: classData, isLoading: isLoadingClass, isError: isErrorClass } = useClasses({ classId });

    if (isLoadingClass) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingDots size={14} gap={12} />
            </div>
        );
    }

    if (isErrorClass || !classData) {
        return <div>Could not load class details</div>;
    }

    return (
        <main className="min-h-screen flex flex-col justify-start">
            <div className="py-6 px-8">
                <Breadcrumbs className="mb-4">
                    <Breadcrumbs.Item href="/classes">Lớp học</Breadcrumbs.Item>
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 pt-4">
                    <Card
                        logo={<FaUsers className="w-5 h-5" />}
                        title="Tổng số học sinh"
                        description={`${classData.totalStudent}`}
                    />
                    <Card
                        logo={<HiClipboardDocumentList className="w-5 h-5" />}
                        title="Điểm trung bình của lớp"
                        description={classData.averageScore.toFixed(2)}
                    />
                    <Card
                        logo={<IoCalendarOutline className="w-5 h-5" />}
                        title="Số buổi học đã diễn ra"
                        description={`${classData.completedSessions}/${classData.totalSessions}`}
                    />
                    <Card
                        logo={<TbPresentationAnalytics className="w-5 h-5" />}
                        title="Tỉ lệ chuyên cần"
                        description={
                            classData.totalSessions > 0
                                ? `${Math.round(
                                    (classData.completedSessions / classData.totalSessions) * 100,
                                )}%`
                                : "0%"
                        }
                    />
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-12 pt-6">
                    <div className="md:col-span-9">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Danh sách học sinh</h2>
                            <Button variant={!isPendingFilter ? "outline" : "primary"} onClick={() => setIsPendingFilter(!isPendingFilter)}>
                                Đang chờ duyệt ({classData.totalPendingStudent})
                            </Button>
                        </div>
                        {/* Left column content (e.g. student list/table) */}
                        {/* Users table copied from user-client */}
                        <UsersTable classId={classId} isPendingFilter={isPendingFilter} />
                    </div>
                    <div className="md:col-span-3">
                        <h2 className="text-lg font-semibold mb-4">Thông tin</h2>
                        {/* Right column content (e.g. filters, stats, actions) */}
                    </div>
                </div>
            </div>
        </main>
    );
}