"use client";

import { useState, useMemo } from "react";
import { useManagers } from "@/hooks/users/use-get-managers";
import { Table, Pagination, Spinner, Chip, Tooltip, Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";

export function TeachersTab() {
    const router = useRouter();
    const [pageIndex, setPageIndex] = useState(1);
    const { data, isLoading } = useManagers({ pageIndex, keyword: "" });

    const tableData = useMemo(() => data?.data ?? [], [data]);
    const totalPages = Math.max(1, data?.totalPages ?? 1);

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case "active":
            case "approved":
                return "success";
            case "pending":
            case "pendingapproved":
                return "warning";
            case "rejected":
            case "inactive":
                return "danger";
            default:
                return "default";
        }
    };

    return (
        <div className="w-full">
            <Table>
                <Table.ScrollContainer>
                    <Table.Content
                        aria-label="Managers management table"
                        selectionMode="none"
                    >
                        <Table.Header>
                            <Table.Column id="id" isRowHeader>ID</Table.Column>
                            <Table.Column id="name">Họ Tên</Table.Column>
                            <Table.Column id="email">Email</Table.Column>
                            <Table.Column id="phone">Điện thoại</Table.Column>
                            <Table.Column id="status">Trạng thái</Table.Column>
                            <Table.Column id="actions">Thao tác</Table.Column>
                        </Table.Header>

                        <Table.Body items={tableData}>
                            {(item) => (
                                <Table.Row id={item.id}>
                                    <Table.Cell>{item.id}</Table.Cell>
                                    <Table.Cell>{item.name}</Table.Cell>
                                    <Table.Cell>{item.email}</Table.Cell>
                                    <Table.Cell>{item.phone}</Table.Cell>
                                    <Table.Cell>
                                        <Chip color={getStatusColor(item.status) as any} variant="soft" size="sm">
                                            <Chip.Label>{item.status}</Chip.Label>
                                        </Chip>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Tooltip delay={0}>
                                            <Button className="rounded-full" size="md" variant="outline" onPress={() => router.push(`/profile?id=${item.id}`)}>
                                                <Icon icon="lucide:info" width="1024" height="1024" />
                                                <Tooltip.Content placement="bottom">
                                                    <p>Thông tin chi tiết</p>
                                                </Tooltip.Content>
                                            </Button>
                                        </Tooltip>
                                    </Table.Cell>
                                </Table.Row>
                            )}
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
