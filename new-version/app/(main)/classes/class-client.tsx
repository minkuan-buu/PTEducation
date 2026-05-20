"use client";

import {
    Button,
    Chip,
    Input,
    Modal,
    Table,
    Tooltip,
    useOverlayState,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";

import { v2 } from "@/services/api";
import type { ClassData, ClassSchedule } from "@/services/api/v2/classes";

const DAY_LABELS: Record<number, string> = {
    1: "Thứ 2",
    2: "Thứ 3",
    3: "Thứ 4",
    4: "Thứ 5",
    5: "Thứ 6",
    6: "Thứ 7",
    7: "Chủ nhật",
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
        <div className="flex items-end gap-2">
            <select
                className="w-28 rounded-lg border border-divider bg-background px-3 py-2 text-sm"
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
                    className="w-32 rounded-lg border border-divider bg-background px-3 py-2 text-sm"
                />
                <span className="text-muted">→</span>
                <input
                    type="time"
                    value={schedule.endTime}
                    onChange={(e) => onChange(index, "endTime", e.target.value)}
                    className="w-32 rounded-lg border border-divider bg-background px-3 py-2 text-sm"
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
    const { isOpen, setOpen } = useOverlayState();
    const [data, setData] = useState<ClassData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [startAt, setStartAt] = useState("");
    const [endAt, setEndAt] = useState("");
    const [schedules, setSchedules] = useState<ClassSchedule[]>([]);

    const loadClasses = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const classes = await v2.getAdminClasses();
            setData(classes);
        } catch {
            setError("Không thể tải danh sách lớp học.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadClasses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
            setIsSaving(true);
            await v2.createClass({
                name,
                startAt: new Date(startAt).toISOString(),
                endAt: new Date(endAt).toISOString(),
                schedules,
            });
            resetForm();
            setOpen(false);
            await loadClasses();
        } catch (err) {
            console.error("Error creating class:", err);
            alert("Có lỗi xảy ra khi tạo lớp học.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (classId: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa lớp học này?")) return;
        try {
            await v2.deleteClass(classId);
            await loadClasses();
        } catch (err) {
            console.error("Error deleting class:", err);
            alert("Có lỗi xảy ra khi xóa lớp học.");
        }
    };

    const handleCloseModal = () => {
        resetForm();
        setOpen(false);
    };

    return (
        <main className="min-h-screen pt-4 flex flex-col justify-start">
            <div className="p-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Lớp học</h1>
                        <p className="text-muted mt-2">Trang quản lý lớp học</p>
                    </div>
                    <Button
                        variant="primary"
                        onPress={() => setOpen(true)}
                    >
                        <Icon icon="lucide:plus" width="20" />
                        Tạo lớp học
                    </Button>
                </div>

                <Modal isOpen={isOpen} onOpenChange={setOpen}>
                    <Modal.Backdrop />
                    <Modal.Container size="lg">
                        <Modal.Dialog>
                            <Modal.Header>
                                <Modal.Heading>Tạo lớp học mới</Modal.Heading>
                            </Modal.Header>
                            <Modal.Body>
                                <div className="flex flex-col gap-4">
                                    <Input
                                        placeholder="Tên lớp"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                    <div className="flex gap-4">
                                        <Input
                                            type="date"
                                            placeholder="Ngày bắt đầu"
                                            value={startAt}
                                            onChange={(e) => setStartAt(e.target.value)}
                                        />
                                        <Input
                                            type="date"
                                            placeholder="Ngày kết thúc"
                                            value={endAt}
                                            onChange={(e) => setEndAt(e.target.value)}
                                        />
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
                                    isDisabled={isSaving}
                                    onPress={handleCreate}
                                >
                                    {isSaving ? "Đang tạo..." : "Tạo lớp"}
                                </Button>
                            </Modal.Footer>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal>

                <div className="mt-6">
                    <Table>
                        <Table.ScrollContainer>
                            <Table.Content aria-label="Classes table">
                                <Table.Header>
                                    <Table.Column id="name" isRowHeader>
                                        Tên lớp
                                    </Table.Column>
                                    <Table.Column id="startAt">Ngày bắt đầu</Table.Column>
                                    <Table.Column id="endAt">Ngày kết thúc</Table.Column>
                                    <Table.Column id="schedules">Lịch học</Table.Column>
                                    <Table.Column id="totalStudent">Sĩ số</Table.Column>
                                    <Table.Column id="createdBy">Người tạo</Table.Column>
                                    <Table.Column id="status">Trạng thái</Table.Column>
                                    <Table.Column id="actions">Hành động</Table.Column>
                                </Table.Header>
                                <Table.Body items={data}>
                                    {(item: ClassData) => (
                                        <Table.Row id={item.id} textValue={item.name}>
                                            <Table.Cell>
                                                <span className="font-medium">{item.name}</span>
                                            </Table.Cell>
                                            <Table.Cell>
                                                {formatDateTime(item.startAt)}
                                            </Table.Cell>
                                            <Table.Cell>{formatDateTime(item.endAt)}</Table.Cell>
                                            <Table.Cell>
                                                {item.schedules && item.schedules.length > 0 ? (
                                                    <div className="flex flex-col gap-1">
                                                        {item.schedules.map((s, i) => (
                                                            <span key={i} className="text-xs">
                                                                {getDayLabel(s.dayOfWeek)}: {s.startTime} - {s.endTime}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted">-</span>
                                                )}
                                            </Table.Cell>
                                            <Table.Cell>{item.totalStudent ?? 0}</Table.Cell>
                                            <Table.Cell>
                                                {item.createdBy?.name ?? "-"}
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Chip
                                                    variant={item.status === "Active" ? "primary" : "secondary"}
                                                >
                                                    {item.status === "Active" ? "Hoạt động" : "Vô hiệu"}
                                                </Chip>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Tooltip>
                                                    <Button
                                                        variant="secondary"
                                                        onPress={() => handleDelete(item.id)}
                                                    >
                                                        <Icon icon="mingcute:delete-2-fill" width="20" height="20" />
                                                    </Button>
                                                    <Tooltip.Content placement="bottom">
                                                        <p>Xóa lớp</p>
                                                    </Tooltip.Content>
                                                </Tooltip>
                                            </Table.Cell>
                                        </Table.Row>
                                    )}
                                </Table.Body>
                            </Table.Content>
                        </Table.ScrollContainer>
                    </Table>
                    {isLoading ? <p className="mt-3 text-sm text-center text-muted-foreground">Đang tải dữ liệu...</p> : null}
                    {error ? <p className="mt-3 text-sm text-danger text-center">{error}</p> : null}
                </div>
            </div>
        </main>
    );
}