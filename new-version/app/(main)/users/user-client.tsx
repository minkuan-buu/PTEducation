"use client";

import { Button, Description, FieldError, Fieldset, FieldsetLegend, Input, Label, Modal, Tabs, TextField, useOverlayState, toast } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";

import { useTheme } from "next-themes";
import { useCreateNewUser } from "@/hooks/users/use-create-new-user";
import { StudentsTab } from "./_components/students-tab";
import { TeachersTab } from "./_components/teachers-tab";

type UserClientProps = {
    initialData?: any[];
};

export default function UserClient({ initialData }: UserClientProps) {
    const { isOpen: isOpenAdd, setOpen: setOpenAdd, open: openAdd, close: closeAdd } = useOverlayState();
    const [newUser, setNewUser] = useState({
        email: "",
        phone: "",
        name: "",
    });

    const [formErrors, setFormErrors] = useState({
        email: "",
        phone: "",
        name: "",
    });

    const [isMounted, setIsMounted] = useState(false);
    const { resolvedTheme } = useTheme();
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const getInputVariant = (): "primary" | "secondary" | undefined => {
        return isMounted && resolvedTheme === "dark" ? "secondary" : undefined;
    };

    const resetForm = () => {
        setNewUser({ email: "", phone: "", name: "" });
        setFormErrors({ email: "", phone: "", name: "" });
    };

    const validateForm = () => {
        const errors: typeof formErrors = { email: "", phone: "", name: "" };
        let isValid = true;

        if (!newUser.name.trim()) {
            errors.name = "Vui lòng nhập họ và tên";
            isValid = false;
        }

        if (!newUser.email.trim()) {
            errors.email = "Vui lòng nhập email";
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
            errors.email = "Email không hợp lệ";
            isValid = false;
        }

        if (!newUser.phone.trim()) {
            errors.phone = "Vui lòng nhập số điện thoại";
            isValid = false;
        } else if (!/^0\d{9}$/.test(newUser.phone)) {
            errors.phone = "Số điện thoại không hợp lệ (phải có 10 số bắt đầu bằng 0)";
            isValid = false;
        }

        setFormErrors(errors);
        return isValid;
    };

    const handleCreateSuccess = () => {
        setOpenAdd(false);
        toast.success("Tạo người dùng thành công!");
        resetForm();
    };

    const { mutate, isPending } = useCreateNewUser(handleCreateSuccess);

    const handleCreateUser = async () => {
        if (!validateForm()) {
            return;
        }

        const payload = [
            {
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
            }
        ];

        mutate(payload);
    };

    return (
        <main className="min-h-screen pt-4 flex flex-col justify-start">
            <div className="p-8">
                <div className="flex flex-row justify-between items-center gap-2">
                    <div>
                        <h1 className="text-2xl font-bold">Người dùng</h1>
                        <p className="text-muted mt-2">Trang quản lý người dùng</p>
                    </div>
                    <Button aria-label="create-user" variant="primary" onPress={openAdd}>
                        <Icon icon="lucide:plus" width="20" />
                        Thêm người dùng
                    </Button>
                    <Modal>
                        <Modal.Backdrop isOpen={isOpenAdd} onOpenChange={setOpenAdd}>
                            <Modal.Container size="lg">
                                <Modal.Dialog>
                                    <Modal.Body className="px-2 pb-2">
                                        <Fieldset className="w-full">
                                            <FieldsetLegend className="text-xl font-bold text-foreground">Người dùng mới</FieldsetLegend>
                                            <Description className="text-muted">Điền thông tin của người dùng</Description>
                                            <Fieldset.Group>
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
                                                        value={newUser.name}
                                                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                                        fullWidth
                                                        name="reg-username"
                                                        placeholder="Họ và tên"
                                                        type="text"
                                                    />
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
                                                        value={newUser.email}
                                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                                        fullWidth
                                                        name="email"
                                                        placeholder="Nhập email"
                                                        type="email"
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
                                                            value={newUser.phone}
                                                            onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                                                        />
                                                    </div>
                                                    <FieldError />
                                                </TextField>
                                            </Fieldset.Group>
                                        </Fieldset>

                                    </Modal.Body>
                                    <Modal.Footer>
                                        <Button variant="ghost" onPress={close}>
                                            Hủy
                                        </Button>
                                        <Button variant="primary" isDisabled={isPending} onPress={handleCreateUser}>
                                            {isPending ? "Đang thêm..." : "Thêm"}
                                        </Button>
                                    </Modal.Footer>
                                </Modal.Dialog>
                            </Modal.Container>
                        </Modal.Backdrop>
                    </Modal>
                </div>
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
                            <StudentsTab />
                        </Tabs.Panel>
                        <Tabs.Panel className="pt-2" id="teachers">
                            <TeachersTab />
                        </Tabs.Panel>
                    </Tabs>
                </div>
            </div>
        </main>
    );
}