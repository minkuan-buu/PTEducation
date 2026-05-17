"use client";

import { Button, Chip, cn, Spinner, Table, Tabs, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";
import type { Key } from "@react-types/shared";
import { useEffect, useState } from "react";

import { v2 } from "@/services/api";
import type { AdminGuardian, AdminStudent } from "@/services/api/v2";

type UserClientProps = {
    initialData?: UserData[];
};

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
    // Tự quản lý state loading cục bộ
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
    // Tự quản lý state loading cục bộ
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

export default function UserClient({ initialData }: UserClientProps) {
    const [data, setData] = useState<UserData[]>(() => initialData ?? []);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isActive = true;

        const loadStudents = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const students = await v2.getAdminStudents();

                if (isActive) {
                    setData(students);
                }
            } catch {
                if (isActive) {
                    setError("Không thể tải danh sách học sinh.");
                }
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        };

        if (isLoading) {
            void loadStudents();
        }

        return () => {
            isActive = false;
        };
    }, [isLoading]);

    async function handleApproveStudent(studentId: string, accessStatus: string) {
        try {
            // Hãy chắc chắn bạn đã BỎ COMMENT dòng gọi API này
            await v2.approveStudent(studentId, accessStatus);

            // Gọi lại dữ liệu để table tự cập nhật sau khi duyệt thành công
            setIsLoading(true);
        } catch (err) {
            console.error("Error approving student:", err);
        }
    }

    async function handleDeleteStudent(studentId: string) {
        try {
            // Hãy chắc chắn bạn đã BỎ COMMENT dòng gọi API này
            await v2.deleteStudent(studentId);
            // Gọi lại dữ liệu để table tự cập nhật sau khi xóa thành công
            setIsLoading(true);
        } catch (err) {
            console.error("Error deleting student:", err);
        }
    }

    const renderExpandableRow = (item: UserData | GuardianData) => {
        // Kiểm tra xem đây là Guardian hay User để hiển thị thông tin phù hợp
        const isGuardian = 'relationship' in item;

        return (
            <Table.Row id={item.id} textValue={item.name}>
                {/* Cột ID + Nút Toggle */}
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

                {/* Cột Role hoặc Relationship */}
                <Table.Cell>
                    {isGuardian ? (
                        <span className="italic text-primary">PH: {item.relationship}</span>
                    ) : (
                        getRoleLabel((item as UserData).role)
                    )}
                </Table.Cell>

                {/* Cột Lớp */}
                <Table.Cell>
                    {isGuardian ? "-" : (item as UserData).className}
                </Table.Cell>
                <Table.Cell>
                    {/* {!isGuardian && (item as UserData).status === "PendingApproved" ? (
                        <StudentApproveActions
                            studentId={item.id}
                            onAction={handleApproveStudent}
                        />
                    ) : (
                        <StudentActions
                            studentId={item.id}
                            onAction={handleDeleteStudent}
                        />
                    )} */}
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

                {/* Phần đệ quy: HeroUI sẽ tìm field này để mở rộng */}
                <Table.Collection items={'guardians' in item ? item.guardians : []}>
                    {(child) => renderExpandableRow(child)}
                </Table.Collection>
            </Table.Row>
        );
    };

    const [expandedKeys, setExpandedKeys] = useState<Set<Key>>(() => new Set(["1"]));

    return (
        <main className="min-h-screen pt-4 flex flex-col justify-start">
            <div className="p-8">
                <h1 className="text-2xl font-bold">Người dùng</h1>
                <p className="text-muted mt-2">Trang quản lý người dùng</p>
                <div className="mt-4">
                    <Tabs className="w-full">
                        <Tabs.ListContainer>
                            <Tabs.List aria-label="Options">
                                <Tabs.Tab id="students">
                                    Học sinh
                                    <Tabs.Indicator />
                                </Tabs.Tab>
                                <Tabs.Tab id="teachers">
                                    Giảng viên
                                    <Tabs.Indicator />
                                </Tabs.Tab>
                            </Tabs.List>
                        </Tabs.ListContainer>
                        <Tabs.Panel className="pt-2" id="students">
                            {/* <p>View your project overview and recent activity.</p> */}
                            <Table>
                                <Table.ScrollContainer>
                                    <Table.Content
                                        aria-label="User management table"
                                        selectionMode="none"
                                        // Chỉ định ID của cột chứa nút bung ra (thường là cột đầu tiên hoặc cột tên)
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

                                        {/* Sử dụng hàm render đệ quy ở trên */}
                                        <Table.Body items={data}>
                                            {(item) => renderExpandableRow(item)}
                                        </Table.Body>
                                    </Table.Content>
                                </Table.ScrollContainer>
                            </Table>
                            {isLoading ? <p className="mt-3 text-sm text-center text-muted-foreground">Đang tải dữ liệu...</p> : null}
                            {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
                        </Tabs.Panel>
                        <Tabs.Panel className="pt-2" id="teachers">
                            <p>Track your metrics and analyze performance data.</p>
                        </Tabs.Panel>
                    </Tabs>
                </div>
            </div>
        </main>
    );
}