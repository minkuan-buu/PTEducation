import { Description, FieldError, Fieldset, FieldsetLegend, Input, Label, Modal, TextField, useOverlayState, Select, ListBox, Switch, Button, Spinner, Avatar, toast, Skeleton } from "@heroui/react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { useGetUserDetail } from "@/hooks/users/use-get-user-detail";
import { useUpdateUserDetail } from "@/hooks/users/use-update-user-detail";
import { useUploadAvatar } from "@/hooks/users/use-upload-avatar";
import type { UserEditResModel } from "@/services/api/v2";
import { FaCamera } from "react-icons/fa";
import styles from "./scroll-style.module.css";
import ModalEditResetPassword from "./modal-edit-reset-password";
import { useUser } from "@/context/user-context";

interface User {
    name: string;
    email: string;
    phone: string;
    class: string;
    school: string;
    avatarUrl: string;
}

export default function ModalEditStudent({ isOpen, setOpen, close, studentId, isSelf, initialData }: any) {
    const { user } = useUser();
    const isStaff = user?.role?.toLowerCase() === "admin" || user?.role?.toLowerCase() === "manager";
    const [isMounted, setIsMounted] = useState(false);
    const { resolvedTheme } = useTheme();
    const [editStudent, setEditStudent] = useState<User>({ name: "", email: "", phone: "", class: "", school: "", avatarUrl: "" });
    const [guardianList, setGuardianList] = useState<Array<{ id: string; name: string; email: string; phone: string; relation: string; isPrimary: boolean }>>([{ id: "g-0", name: "", email: "", phone: "", relation: "Ba", isPrimary: true }]);

    const [isImageLoading, setIsImageLoading] = useState(false);
    const { isOpen: isOpenResetPassword, setOpen: setOpenResetPasswordModal, close: closeResetPasswordModal } = useOverlayState();
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [selectedUserName, setSelectedUserName] = useState<string>("");

    const shouldFetch = (!isSelf || !initialData) && isOpen;
    const { data: fetchedDetail, isLoading: isDetailLoading } = useGetUserDetail(studentId, isSelf, shouldFetch);
    const studentDetail = isSelf && initialData ? initialData : fetchedDetail;
    const isTargetStaff = studentDetail?.role?.toLowerCase() === "admin" || studentDetail?.role?.toLowerCase() === "manager";
    const isTargetGuardian = studentDetail?.role?.toLowerCase() === "guardian";
    const isTargetStudent = !isTargetStaff && !isTargetGuardian;
    const updateStudentMutation = useUpdateUserDetail(studentId, () => {
        close();
    }, isSelf);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadAvatarMutation = useUploadAvatar(studentId, undefined, isSelf);

    const [isHovered, setIsHovered] = useState(false);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const localUrl = URL.createObjectURL(file);
            setEditStudent((prev) => ({ ...prev, avatarUrl: localUrl }));
            setIsImageLoading(true);
            uploadAvatarMutation.mutate(file);
        }
    };

    const showOverlay = isHovered || uploadAvatarMutation.isPending;
    const maskRadius = showOverlay ? 28 : 0;
    const avatarStyle = {
        WebkitMaskImage: `radial-gradient(circle at calc(100% - 32px) calc(100% - 32px), transparent ${maskRadius}px, black ${maskRadius + 0.5}px)`,
        maskImage: `radial-gradient(circle at calc(100% - 32px) calc(100% - 32px), transparent ${maskRadius}px, black ${maskRadius + 0.5}px)`,
    };

    useEffect(() => {
        if (isOpen && studentDetail) {
            setEditStudent({
                name: studentDetail.name || "",
                email: studentDetail.email || "",
                phone: studentDetail.phone || "",
                class: "",
                school: studentDetail.schoolInfo || "",
                avatarUrl: studentDetail.avatarUrl || "",
            });
            setIsImageLoading(!!studentDetail.avatarUrl);
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
        } else if (!isOpen) {
            setEditStudent({ name: "", email: "", phone: "", class: "", school: "", avatarUrl: "" });
            setGuardianList([{ id: "g-0", name: "", email: "", phone: "", relation: "Ba", isPrimary: true }]);
            setIsImageLoading(false);
        }
    }, [studentDetail, isOpen]);

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
            guardians: (isTargetStaff || isTargetGuardian) ? [] : guardianList.map((g) => ({
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

    const hanndleSelectResetPasswordModal = (id: string, name: string) => {
        setSelectedUserId(id);
        setSelectedUserName(name);
        setOpenResetPasswordModal(true);
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
        <>
            <Modal>
                <Modal.Backdrop isOpen={isOpen} onOpenChange={setOpen}>
                    <Modal.Container size="lg">
                        <Modal.Dialog className={`w-full max-w-none sm:max-w-3xl md:max-w-4xl lg:max-w-5xl ${styles.scrollable}`}>
                            <Modal.Header className="flex flex-col gap-2 pb-2">
                                <h2 className="text-xl font-bold text-foreground">Chỉnh sửa thông tin người dùng</h2>
                                <Description className="text-muted">Điền thông tin cần chỉnh sửa</Description>
                            </Modal.Header>
                            <Modal.Body className="px-6 min-h-[300px] py-6 border-t border-gray-200 dark:border-gray-800">
                                {isDetailLoading ? (
                                    <div className="flex flex-col items-center justify-center gap-4 py-12 w-full">
                                        <Spinner size="lg" />
                                        <span className="text-sm text-muted-foreground font-medium">Đang tải thông tin học viên...</span>
                                    </div>
                                ) : (
                                    <form autoComplete="on" onSubmit={handleEditSubmit} className="w-full" aria-label="form-edit-user">
                                        <Fieldset className="w-full">
                                            <Fieldset.Group>
                                                <div className="grid grid-cols-1 md:grid-cols-3 w-full pb-4">
                                                    <div className="col-span-1 flex justify-center items-center">
                                                        <div
                                                            role="button"
                                                            aria-label="Thay đổi ảnh đại diện"
                                                            onMouseEnter={() => setIsHovered(true)}
                                                            onMouseLeave={() => setIsHovered(false)}
                                                            onClick={() => fileInputRef.current?.click()}
                                                            className="relative cursor-pointer select-none rounded-full"
                                                        >
                                                            <Avatar
                                                                key={studentId}
                                                                aria-label="Ảnh đại diện học viên"
                                                                style={avatarStyle}
                                                                className={`w-56 h-56 transition-all duration-300 ${showOverlay ? "brightness-95" : ""}`}
                                                            >
                                                                {isImageLoading && (
                                                                    <Skeleton className="absolute inset-0 w-full h-full rounded-full z-10" />
                                                                )}
                                                                <Avatar.Image
                                                                    alt={editStudent.name}
                                                                    src={editStudent.avatarUrl || undefined}
                                                                    onLoad={() => setIsImageLoading(false)}
                                                                    onError={() => setIsImageLoading(false)}
                                                                />
                                                                <Avatar.Fallback className="border-none bg-gradient-to-br from-[#00b4d8] to-[#90e0ef] text-white text-4xl select-none">
                                                                    {editStudent.name.split(" ").map((part) => part[0]).join("").slice(editStudent.name.split(" ").length - 2, editStudent.name.split(" ").length).toUpperCase()}
                                                                </Avatar.Fallback>
                                                            </Avatar>
                                                            <div className={`absolute inset-0 bg-black/10 rounded-full transition-all duration-300 pointer-events-none ${showOverlay ? "opacity-100" : "opacity-0"}`} />
                                                            <div className={`absolute bottom-2 right-2 w-12 h-12 flex items-center justify-center bg-[#27272a] hover:bg-[#3f3f46] text-white rounded-full shadow-lg transition-all duration-300 ease-out transform ${showOverlay ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}>
                                                                {uploadAvatarMutation.isPending ? (
                                                                    <Spinner size="sm" aria-label="Đang tải ảnh đại diện" />
                                                                ) : (
                                                                    <FaCamera className="w-5 h-5" />
                                                                )}
                                                            </div>
                                                            <input
                                                                type="file"
                                                                ref={fileInputRef}
                                                                onChange={handleAvatarChange}
                                                                accept="image/*"
                                                                className="hidden"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-span-2 flex flex-col gap-2">
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
                                                        {isTargetStudent && (
                                                            <TextField
                                                                isRequired
                                                                name="school"
                                                            >
                                                                <Label htmlFor="school" className="font-medium text-foreground/80">
                                                                    Lớp - Trường đang học
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
                                                        )}
                                                    </div>
                                                </div>
                                                {isStaff && !isSelf && (
                                                    <div className="flex flex-row items-center justify-end">
                                                        <Button onPress={() => hanndleSelectResetPasswordModal(studentId, studentDetail.name || "")}>
                                                            Đặt lại mật khẩu
                                                        </Button>
                                                    </div>
                                                )}
                                                {isTargetStudent && (
                                                    <>
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
                                                                                aria-label="Quan hệ"
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
                                                                            <Switch aria-label="Liên hệ chính" isSelected={guardian.isPrimary} onChange={() => handleGuardianPrimaryChange(guardian.id)}>
                                                                                <Switch.Control>
                                                                                    <Switch.Thumb />
                                                                                </Switch.Control>
                                                                            </Switch>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-row justify-end gap-2">
                                                                    {isStaff && !guardian.id.startsWith("g-") && (
                                                                        <Button onPress={() => hanndleSelectResetPasswordModal(guardian.id, guardian.name || "")}>
                                                                            Đặt lại mật khẩu
                                                                        </Button>
                                                                    )}
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
                                                    </>
                                                )}
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
            <ModalEditResetPassword isOpen={isOpenResetPassword} close={closeResetPasswordModal} setOpen={setOpenResetPasswordModal} userId={selectedUserId} userName={selectedUserName} />
        </>
    )
}