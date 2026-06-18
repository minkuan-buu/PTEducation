"use client";

import { Button, Chip, cn, Pagination, Spinner, Table, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";
import type { Key } from "@react-types/shared";
import { useEffect, useMemo, useState } from "react";

import { v2 } from "@/services/api";
import type { AdminGuardian, AdminStudent } from "@/services/api/v2";
import { useUsers } from "@/hooks/users/use-users";
import { useQueryClient } from "@tanstack/react-query";

export type GuardianData = AdminGuardian;
export type UserData = AdminStudent;

const ROLE_LABELS: Record<string, string> = {
    Student: "Học sinh",
    Teacher: "Giảng viên",
};

const getRoleLabel = (role: string) => {
    return ROLE_LABELS[role] ?? role;
};

const StudentApproveActions = ({
    studentId,
    onAction
}: {
    studentId: string,
    onAction: (id: string, status: string) => Promise<void>
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
                <Button
                    className="rounded-full"
                    size="md"
                    variant="outline"
                    onPress={() => handlePress("Approved")}
                >
                    <Icon icon="simple-line-icons:check" color="#38b000" width="20" height="20" />
                </Button>
            </Tooltip>
            <Tooltip delay={0}>
                <Button
                    className="rounded-full"
                    size="md"
                    variant="outline"
                    onPress={() => handlePress("Rejected")}
                >
                    <Icon icon="oui:cross-in-circle-empty" color="#fd0a3a" width="20" height="20" />
                </Button>
            </Tooltip>
        </div>
    );
};

const StudentActions = ({
    studentId,
    onAction
}: {
    studentId: string,
    onAction: (id: string) => Promise<void>
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
                    <Icon icon="lucide:edit" width="1024" height="1024" />
                    <Tooltip.Content placement="bottom">
                        <p>Chỉnh sửa</p>
                    </Tooltip.Content>
                </Button>
            </Tooltip>
            <Tooltip delay={0}>
                <Button className="rounded-full" size="md" variant="outline">
                    <Icon icon="ep:remove" width="1024" height="1024" />
                    <Tooltip.Content placement="bottom">
                        <p>Vô hiệu hóa</p>
                    </Tooltip.Content>
                </Button>
            </Tooltip>
            <Tooltip delay={0}>
                <Button className="rounded-full" size="md" variant="outline" onPress={() => handlePress()}>
                    <Icon icon="mingcute:delete-2-fill" color="#fd0a3a" width="1024" height="1024" />
                    <Tooltip.Content placement="bottom">
                        <p>Xóa</p>
                    </Tooltip.Content>
                </Button>
            </Tooltip>
        </div>
    );
};

export function StudentsTab() {
    const queryClient = useQueryClient();
    const [pageIndex, setPageIndex] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const pageSize = 10;
    const keyword = searchTerm.trim();
    const { data, isLoading } = useUsers({ pageIndex, pageSize, keyword });
    const tableData = useMemo(() => data?.data ?? [], [data]);
    const totalPages = Math.max(1, data?.totalPages ?? 1);
    const hasNextPage = (data?.pageNumber ?? 1) < totalPages;

    useEffect(() => {
        setPageIndex((prev) => (prev === 1 ? prev : 1));
    }, [keyword]);

    useEffect(() => {
        if (!hasNextPage) return;

        queryClient.prefetchQuery({
            queryKey: ["users", "pagination", pageIndex + 1, pageSize, keyword],
            queryFn: () => v2.getAdminStudents({ pageIndex: pageIndex + 1, pageSize, keyword }),
            staleTime: 3 * 60 * 1000, // 3 minutes
        });
    }, [hasNextPage, keyword, pageIndex, pageSize, queryClient]);

    async function handleApproveStudent(studentId: string, accessStatus: string) {
        try {
            await v2.approveStudent(studentId, accessStatus);
            await queryClient.invalidateQueries({ queryKey: ["users", "pagination"] });
        } catch (err) {
            console.error("Error approving student:", err);
        }
    }

    async function handleDeleteStudent(studentId: string) {
        try {
            await v2.deleteStudent(studentId);
            await queryClient.invalidateQueries({ queryKey: ["users", "pagination"] });
        } catch (err) {
            console.error("Error deleting student:", err);
        }
    }

    const renderExpandableRow = (item: UserData | GuardianData) => {
        const isGuardian = 'relationship' in item;

        return (
            <Table.Row id={item.id} textValue={item.name}>
                <Table.Cell textValue={item.id}>
                    {({ hasChildItems, isExpanded, isTreeColumn }) => (
                        <div className="flex items-center gap-2">
                            {hasChildItems && isTreeColumn && (
                                <Button
                                    isIconOnly
                                    aria-label="Toggle row"
                                    size="sm"
                                    slot="chevron"
                                    variant="ghost"
                                >
                                    <Icon
                                        icon="gravity-ui:chevron-right"
                                        className={cn(
                                            "size-4 transition-transform",
                                            isExpanded ? "rotate-90" : ""
                                        )}
                                    />
                                </Button>
                            )}
                            <span className={isGuardian ? "pl-6 text-muted-foreground" : ""}>
                                {item.id}
                            </span>
                        </div>
                    )}
                </Table.Cell>

                <Table.Cell>
                    <div className="flex flex-row items-center gap-4">
                        <span>{item.name}</span>
                        {isGuardian && item.isPrimary ? (
                            <Chip color="accent">
                                <Chip.Label>Liên hệ chính</Chip.Label>
                            </Chip>
                        ) : null}
                    </div>
                </Table.Cell>
                <Table.Cell>{item.email}</Table.Cell>
                <Table.Cell>{item.phone}</Table.Cell>

                <Table.Cell>
                    {isGuardian ? (
                        <span className="italic text-primary">PH: {item.relationship}</span>
                    ) : (
                        getRoleLabel((item as UserData).role)
                    )}
                </Table.Cell>

                <Table.Cell>
                    {isGuardian ? "-" : (item as UserData).className}
                </Table.Cell>
                <Table.Cell>
                    {!isGuardian ? (
                        <>
                            {(item as UserData).status === "PendingApproved" ? (
                                <StudentApproveActions
                                    studentId={item.id}
                                    onAction={handleApproveStudent}
                                />
                            ) : (
                                <StudentActions
                                    studentId={item.id}
                                    onAction={handleDeleteStudent}
                                />
                            )}
                        </>
                    ) : null}
                </Table.Cell>

                <Table.Collection items={'guardians' in item ? item.guardians : []}>
                    {(child) => renderExpandableRow(child)}
                </Table.Collection>
            </Table.Row>
        );
    };

    const [expandedKeys, setExpandedKeys] = useState<Set<Key>>(() => new Set(["1"]));

    return (
        <div className="w-full">
            <Table>
                <Table.ScrollContainer>
                    <Table.Content
                        aria-label="User management table"
                        selectionMode="none"
                        treeColumn="id"
                        expandedKeys={expandedKeys}
                        onExpandedChange={setExpandedKeys}
                    >
                        <Table.Header>
                            <Table.Column id="id" isRowHeader>ID</Table.Column>
                            <Table.Column id="name">Họ Tên</Table.Column>
                            <Table.Column id="email">Email</Table.Column>
                            <Table.Column id="phone">Điện thoại</Table.Column>
                            <Table.Column id="role">Vai trò/Quan hệ</Table.Column>
                            <Table.Column id="className">Lớp</Table.Column>
                            <Table.Column id="actions">Hành động</Table.Column>
                        </Table.Header>

                        <Table.Body items={tableData}>
                            {(item) => renderExpandableRow(item)}
                        </Table.Body>
                    </Table.Content>
                </Table.ScrollContainer>
                <Table.Footer>
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
                </Table.Footer>
            </Table>
            {isLoading ? <p className="mt-3 text-sm text-center text-muted-foreground">Đang tải dữ liệu...</p> : null}
        </div>
    );
}
