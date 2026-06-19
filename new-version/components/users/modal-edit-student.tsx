import { Description, FieldError, Fieldset, FieldsetLegend, Input, Label, Modal, TextField, useOverlayState, Select, ListBox, Switch, Button, Spinner, Avatar } from "@heroui/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useGetUserDetail } from "@/hooks/users/use-get-user-detail";
import { useUpdateUserDetail } from "@/hooks/users/use-update-user-detail";
import type { UserEditResModel } from "@/services/api/v2";

interface User {
    name: string;
    email: string;
    phone: string;
    class: string;
    school: string;
    avatarUrl: string;
}

export default function ModalEditStudent({ isOpen, setOpen, close, studentId }: any) {
    const [isMounted, setIsMounted] = useState(false);
    const { resolvedTheme } = useTheme();
    const [editStudent, setEditStudent] = useState<User>({ name: "", email: "", phone: "", class: "", school: "", avatarUrl: "" });
    const [guardianList, setGuardianList] = useState<Array<{ id: string; name: string; email: string; phone: string; relation: string; isPrimary: boolean }>>([{ id: "g-0", name: "", email: "", phone: "", relation: "Ba", isPrimary: true }]);

    const { data: studentDetail, isLoading: isDetailLoading } = useGetUserDetail(studentId);
    const updateStudentMutation = useUpdateUserDetail(studentId, () => {
        close();
    });

    useEffect(() => {
        if (studentDetail) {
            setEditStudent({
                name: studentDetail.name || "",
                email: studentDetail.email || "",
                phone: studentDetail.phone || "",
                class: "",
                school: studentDetail.schoolInfo || "",
                avatarUrl: studentDetail.avatarUrl || "",
            });
            if (studentDetail.guardians && studentDetail.guardians.length > 0) {
                setGuardianList(
                    studentDetail.guardians.map((g) => ({
                        id: g.id || generateId(),
                        name: g.name || "",
                        email: g.email || "",
                        phone: g.phone || "",
                        relation: g.relationship || "Ba",
                        isPrimary: g.isPrimary ?? false,
                    }))
                );
            }
        }
    }, [studentDetail]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const getInputVariant = (): "primary" | "secondary" | undefined => {
        return isMounted && resolvedTheme === "dark" ? "secondary" : undefined;
    };

    const handleEditSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
        if (event) {
            event.preventDefault();
        }

        const payload: UserEditResModel = {
            name: editStudent.name,
            email: editStudent.email,
            phone: editStudent.phone,
            schoolInfo: editStudent.school,
            avatarUrl: editStudent.avatarUrl,
            guardians: guardianList.map((g) => ({
                id: g.id.startsWith("g-") && g.id.split("-").length > 2 ? "" : g.id,
                name: g.name,
                email: g.email,
                phone: g.phone,
                relationship: g.relation,
                isPrimary: g.isPrimary,
            })),
        };

        updateStudentMutation.mutate(payload);
    };

    function generateId() {
        return `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function handleAddGuardian() {
        setGuardianList((prev) => [...prev, { id: generateId(), name: "", email: "", phone: "", relation: "Ba", isPrimary: false }]);
    }

    function handleGuardianPrimaryChange(id: string) {
        setGuardianList((prev) =>
            prev.map((g) => (g.id === id ? { ...g, isPrimary: true } : { ...g, isPrimary: false }))
        );
    }

    function handleGuardianFieldChange(
        id: string,
        field: "name" | "email" | "phone" | "relation",
        value: string,
    ) {
        setGuardianList((prev) =>
            prev.map((g) => (g.id === id ? { ...g, [field]: value } : g))
        );
    }

    function handleRemoveGuardian(id: string) {
        setGuardianList((prev) => {
            const removed = prev.find((g) => g.id === id);
            const next = prev.filter((g) => g.id !== id);

            if (!removed?.isPrimary || next.length === 0) {
                return next;
            }

            return next.map((g, index) => ({ ...g, isPrimary: index === 0 }));
        });
    }

    const guardianOptions = [
        { value: "Ba", label: "Ba" },
        { value: "Mẹ", label: "Mẹ" },
        { value: "Anh", label: "Anh" },
        { value: "Chị", label: "Chị" },
        { value: "Em", label: "Em" },
        { value: "Cô", label: "Cô" },
        { value: "Dì", label: "Dì" },
        { value: "Chú", label: "Chú" },
        { value: "Bác", label: "Bác" },
        { value: "Ông", label: "Ông" },
        { value: "Bà", label: "Bà" },
        { value: "Khác", label: "Khác" },
    ];

    return (
        <Modal>
            <Modal.Backdrop isOpen={isOpen} onOpenChange={setOpen}>
                <Modal.Container size="lg">
                    <Modal.Dialog className="w-full max-w-none sm:max-w-3xl md:max-w-4xl lg:max-w-5xl">
                        <Modal.Header className="flex flex-col gap-2 pb-2">
                            <h2 className="text-xl font-bold text-foreground">Chỉnh sửa thông tin người dùng</h2>
                            <Description className="text-muted">Điền thông tin và chọn lớp phù hợp</Description>
                        </Modal.Header>
                        <Modal.Body className="px-2 min-h-[300px] py-6 border-t border-gray-200 dark:border-gray-800">
                            {isDetailLoading ? (
                                <div className="flex flex-col items-center justify-center gap-4 py-12 w-full">
                                    <Spinner size="lg" />
                                    <span className="text-sm text-muted-foreground font-medium">Đang tải thông tin học viên...</span>
                                </div>
                            ) : (
                                <form autoComplete="on" onSubmit={handleEditSubmit} className="w-full">
                                    <Fieldset className="w-full">
                                        <Fieldset.Group>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full pb-4">
                                                <div className="col-span-1">
                                                    <Avatar size="lg">
                                                        <Avatar.Image
                                                            alt={editStudent.name}
                                                            src={editStudent.avatarUrl}
                                                        />
                                                        <Avatar.Fallback className="border-none bg-gradient-to-br from-[#00b4d8] to-[#90e0ef] text-white">
                                                            {editStudent.name.split(" ").map((part) => part[0]).join("").slice(editStudent.name.split(" ").length - 2, editStudent.name.split(" ").length).toUpperCase()}
                                                        </Avatar.Fallback>
                                                    </Avatar>
                                                </div>
                                                <TextField
                                                    isRequired
                                                    name="reg-username"
                                                >
                                                    <Label htmlFor="reg-username" className="font-medium text-foreground/80">
                                                        Họ và tên
                                                    </Label>
                                                    <Input
                                                        suppressHydrationWarning
                                                        variant={getInputVariant()}
                                                        autoComplete="name"
                                                        id="reg-username"
                                                        value={editStudent.name}
                                                        onChange={(e) => setEditStudent({ ...editStudent, name: e.target.value })}
                                                        fullWidth
                                                        name="reg-username"
                                                        placeholder="Họ và tên"
                                                        type="text"
                                                    />
                                                    <FieldError />
                                                </TextField>
                                                <TextField
                                                    isRequired
                                                    name="phone"
                                                >
                                                    <Label htmlFor="phone" className="font-medium text-foreground/80">
                                                        Số điện thoại
                                                    </Label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            suppressHydrationWarning
                                                            variant={getInputVariant()}
                                                            id="phone"
                                                            fullWidth
                                                            name="phone"
                                                            placeholder="Vị dụ: 0909xxxxxx"
                                                            type="tel"
                                                            value={editStudent.phone}
                                                            onChange={(e) => setEditStudent({ ...editStudent, phone: e.target.value })}
                                                        />
                                                    </div>
                                                    <FieldError />
                                                </TextField>
                                                <TextField
                                                    isRequired
                                                    name="email"
                                                >
                                                    <Label htmlFor="email" className="font-medium text-foreground/80">
                                                        Email
                                                    </Label>
                                                    <Input
                                                        suppressHydrationWarning
                                                        variant={getInputVariant()}
                                                        autoComplete="email"
                                                        id="email"
                                                        value={editStudent.email}
                                                        onChange={(e) => setEditStudent({ ...editStudent, email: e.target.value })}
                                                        fullWidth
                                                        name="email"
                                                        placeholder="Nhập email"
                                                        type="email"
                                                    />
                                                    <FieldError />
                                                </TextField>
                                                <TextField
                                                    isRequired
                                                    name="school"
                                                >
                                                    <Label htmlFor="school" className="font-medium text-foreground/80">
                                                        Lớp - Trường đang học (bổ sung nếu chưa có)
                                                    </Label>
                                                    <Input
                                                        suppressHydrationWarning
                                                        variant={getInputVariant()}
                                                        id="school"
                                                        fullWidth
                                                        name="school"
                                                        value={editStudent.school}
                                                        onChange={(e) => setEditStudent({ ...editStudent, school: e.target.value })}
                                                        placeholder="Vị dụ: Lớp 10A1 - Trần Đại Nghĩa"
                                                        type="text"
                                                    />
                                                    <FieldError />
                                                </TextField>
                                            </div>
                                            <div className="space-y-4 border-t border-divider" />
                                            <h3 className="font-semibold text-foreground">Thông tin phụ huynh</h3>
                                            {guardianList.map((guardian) => (
                                                <div key={guardian.id} className="space-y-4 border border-divider p-5 rounded-2xl">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <TextField isRequired name="parent-name">
                                                            <Label htmlFor="parent-name" className="font-medium text-foreground/80">
                                                                Họ và tên
                                                            </Label>
                                                            <Input
                                                                suppressHydrationWarning
                                                                variant={getInputVariant()}
                                                                id="parent-name"
                                                                fullWidth
                                                                value={guardian.name}
                                                                name="parent-name"
                                                                placeholder="Họ và tên"
                                                                type="text"
                                                                onChange={(e) => handleGuardianFieldChange(guardian.id, "name", e.target.value)}
                                                            />
                                                            <FieldError />
                                                        </TextField>
                                                        <TextField isRequired name="parent-phone">
                                                            <Label htmlFor="parent-phone" className="font-medium text-foreground/80">
                                                                SDT phụ huynh
                                                            </Label>
                                                            <Input
                                                                suppressHydrationWarning
                                                                variant={getInputVariant()}
                                                                id="parent-phone"
                                                                fullWidth
                                                                value={guardian.phone}
                                                                name="parent-phone"
                                                                placeholder="Vị dụ: 0909xxxxxx"
                                                                type="tel"
                                                                onChange={(e) => handleGuardianFieldChange(guardian.id, "phone", e.target.value)}
                                                            />
                                                            <FieldError />
                                                        </TextField>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                                        <TextField name="parent-email" isRequired>
                                                            <Label htmlFor="parent-email" className="font-medium text-foreground/80">
                                                                Email
                                                            </Label>
                                                            <Input
                                                                suppressHydrationWarning
                                                                variant={getInputVariant()}
                                                                id="parent-email"
                                                                fullWidth
                                                                value={guardian.email}
                                                                name="parent-email"
                                                                placeholder="Email"
                                                                type="email"
                                                                onChange={(e) => handleGuardianFieldChange(guardian.id, "email", e.target.value)}
                                                            />
                                                            <FieldError />
                                                        </TextField>
                                                        <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
                                                            <div className="flex gap-4 items-center flex-1 min-w-[200px]">
                                                                <Label htmlFor="relation" className="font-medium text-foreground/80 shrink-0">
                                                                    Quan hệ
                                                                </Label>
                                                                <Select
                                                                    variant={resolvedTheme === "dark" ? "secondary" : undefined}
                                                                    className="w-full"
                                                                    placeholder="Chọn quan hệ"
                                                                    value={guardian.relation || guardianOptions[0].value}
                                                                    onChange={(value) => {
                                                                        if (value !== null) {
                                                                            handleGuardianFieldChange(guardian.id, "relation", String(value));
                                                                        }
                                                                    }}
                                                                >
                                                                    <Select.Trigger>
                                                                        <Select.Value />
                                                                        <Select.Indicator />
                                                                    </Select.Trigger>
                                                                    <Select.Popover>
                                                                        <ListBox>
                                                                            {guardianOptions.map((option) => (
                                                                                <ListBox.Item key={option.value} id={option.value} textValue={option.label}>
                                                                                    {option.label}
                                                                                    <ListBox.ItemIndicator />
                                                                                </ListBox.Item>
                                                                            ))}
                                                                        </ListBox>
                                                                    </Select.Popover>
                                                                </Select>
                                                            </div>
                                                            <div className="flex gap-2 items-center shrink-0">
                                                                <span className="text-md text-muted">Liên hệ chính</span>
                                                                <Switch isSelected={guardian.isPrimary} onChange={() => handleGuardianPrimaryChange(guardian.id)}>
                                                                    <Switch.Control>
                                                                        <Switch.Thumb />
                                                                    </Switch.Control>
                                                                </Switch>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-row justify-end">
                                                        <Button
                                                            variant="secondary"
                                                            className="text-red-400"
                                                            onClick={() => handleRemoveGuardian(guardian.id)}
                                                            isDisabled={guardianList.length === 1}
                                                        >
                                                            Xóa phụ huynh
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                            <Button variant="primary" className="text-white" onClick={handleAddGuardian}>
                                                Thêm phụ huynh
                                            </Button>
                                        </Fieldset.Group>

                                    </Fieldset>
                                </form>
                            )}
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="ghost" onPress={() => close()} isDisabled={isDetailLoading}>
                                Hủy
                            </Button>
                            <Button variant="primary" isPending={updateStudentMutation.isPending} onPress={() => handleEditSubmit()} isDisabled={isDetailLoading}>
                                Chỉnh sửa
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}