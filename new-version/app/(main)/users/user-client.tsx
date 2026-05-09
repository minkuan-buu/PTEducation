"use client";

import { Button, cn, Table, Tabs, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";
import type { Key } from "@react-types/shared";
import { useState } from "react";

type UserClientProps = {
    data: UserData[];
};

export type GuardianData = {
    id: string;
    name: string;
    email: string;
    phone: string;
    relationship?: string; // Thuộc tính riêng của Guardian
};

export type UserData = {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    className: string;
    guardians?: (UserData | GuardianData)[]; // Có thể chứa cả 2 loại
};

const ROLE_LABELS: Record<string, string> = {
    Student: "Học sinh",
    Teacher: "Giảng viên",
};

const getRoleLabel = (role: string) => {
    return ROLE_LABELS[role] ?? role;
};

export default function UserClient({ data }: UserClientProps) {

    // const data: UserData[] = [
    //     {
    //         "id": "112001",
    //         "name": "Đoàn Ngọc Minh Quân",
    //         "email": "doanngocminhquan.9a4@gmail.com",
    //         "phone": "0934177280",
    //         "role": "Student",
    //         "status": "PendingApproved",
    //         "className": "12A1",
    //         "guardians": [
    //             {
    //                 "id": "2120002",
    //                 "name": "Đoàn Đức Hùng",
    //                 "email": "hungdr1969@gmail.com",
    //                 "phone": "0908108855",
    //                 "relationship": "Ba"
    //             },
    //             {
    //                 "id": "2120001",
    //                 "name": "Trần Thị Tuyết Mai",
    //                 "email": "mtran0170@gmail.com",
    //                 "phone": "0906022137",
    //                 "relationship": "Mẹ"
    //             }
    //         ]
    //     }
    // ];

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

                <Table.Cell>{item.name}</Table.Cell>
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
                    {!isGuardian && (
                        <>
                            {(item as UserData).status === "PendingApproved" ? (
                                <div className="flex gap-2">
                                    <Tooltip delay={0}>
                                        <Button className="rounded-full" size="md" variant="outline">
                                            {/* Xem chi tiết */}
                                            <Icon icon="simple-line-icons:check" color="#38b000" width="1024" height="1024" />
                                            <Tooltip.Content placement="bottom">
                                                <p>Duyệt</p>
                                            </Tooltip.Content>
                                        </Button>
                                    </Tooltip>
                                    <Tooltip delay={0}>
                                        <Button className="rounded-full" size="md" variant="outline">
                                            {/* Xem chi tiết */}
                                            <Icon icon="oui:cross-in-circle-empty" width="84" height="84" color="#fd0a3a" />
                                            <Tooltip.Content placement="bottom">
                                                <p>Từ chối</p>
                                            </Tooltip.Content>
                                        </Button>
                                    </Tooltip>
                                </div>
                            ) : null}
                        </>
                    )}
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
        <main className="min-h-screen pt-15 flex flex-col justify-start">
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