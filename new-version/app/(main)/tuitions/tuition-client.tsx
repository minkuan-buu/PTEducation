"use client";

import { Button, Description, FieldError, Fieldset, FieldsetLegend, Input, Label, Modal, Tabs, TextField, useOverlayState, toast } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";

import { useTheme } from "next-themes";
import { useCreateTuitions } from "@/hooks/tuitions/use-create-tuitions";
import { v2 } from "@/services/api";

type TuitionClientProps = {
    initialData?: any[];
};

export default function TuitionClient({ initialData }: TuitionClientProps) {
    const { isOpen: isOpenAdd, setOpen: setOpenAdd, open: openAdd, close: closeAdd } = useOverlayState();
    const [newTuition, setNewTuition] = useState<v2.AddTuitionPayload>({
        amount: 0,
        gradeId: 0,
        dueDate: "",
        fromDate: "",
        toDate: "",
        title: "",
    });

    const [formErrors, setFormErrors] = useState({
        amount: "",
        gradeId: "",
        dueDate: "",
        fromDate: "",
        toDate: "",
        title: "",
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
        setNewTuition({ amount: 0, gradeId: 0, dueDate: "", fromDate: "", toDate: "", title: "" });
        setFormErrors({ amount: "", gradeId: "", dueDate: "", fromDate: "", toDate: "", title: "" });
    };

    const validateForm = () => {
        const errors: typeof formErrors = { amount: "", gradeId: "", dueDate: "", fromDate: "", toDate: "", title: "" };
        let isValid = true;

        if (!newTuition.title.trim()) {
            errors.title = "Vui lòng nhập tên học phí";
            isValid = false;
        }

        if (newTuition.amount <= 0) {
            errors.amount = "Vui lòng nhập số tiền";
            isValid = false;
        }

        if (newTuition.gradeId <= 0) {
            errors.gradeId = "Vui lòng chọn khối";
            isValid = false;
        }

        if (!newTuition.dueDate) {
            errors.dueDate = "Vui lòng chọn ngày đến hạn";
            isValid = false;
        }

        if (!newTuition.fromDate) {
            errors.fromDate = "Vui lòng chọn ngày bắt đầu";
            isValid = false;
        }

        if (!newTuition.toDate) {
            errors.toDate = "Vui lòng chọn ngày kết thúc";
            isValid = false;
        }

        setFormErrors(errors);
        return isValid;
    };

    const handleCreateSuccess = () => {
        setOpenAdd(false);
        toast.success("Tạo học phí thành công!");
        resetForm();
    };

    const { mutate, isPending } = useCreateTuitions(handleCreateSuccess);

    const handleCreateTuition = async () => {
        if (!validateForm()) {
            return;
        }

        const payload: v2.AddTuitionPayload = {
            gradeId: newTuition.gradeId,
            title: newTuition.title,
            amount: newTuition.amount,
            dueDate: newTuition.dueDate,
            fromDate: newTuition.fromDate,
            toDate: newTuition.toDate,
        }

        mutate(payload);
    };

    return (
        <main className="min-h-screen pt-4 flex flex-col justify-start">
            <div className="p-8">
                <div className="flex flex-row justify-between items-center gap-2">
                    <div>
                        <h1 className="text-2xl font-bold">Học phí</h1>
                        <p className="text-muted mt-2">Trang quản lý học phí</p>
                    </div>
                    <Button aria-label="create-user" variant="primary" onPress={openAdd}>
                        <Icon icon="lucide:plus" width="20" />
                        Thêm học phí
                    </Button>
                    <Modal>
                        <Modal.Backdrop isOpen={isOpenAdd} onOpenChange={setOpenAdd}>
                            <Modal.Container size="lg">
                                <Modal.Dialog>
                                    <Modal.Body className="px-2 pb-2">
                                        <Fieldset className="w-full">
                                            <FieldsetLegend className="text-xl font-bold text-foreground">Học phí mới</FieldsetLegend>
                                            <Description className="text-muted">Điền thông tin của học phí</Description>
                                            <Fieldset.Group>
                                                <TextField
                                                    isRequired
                                                    name="title"
                                                    isInvalid={!!formErrors.title}
                                                >
                                                    <Label htmlFor="title" className="font-medium text-foreground/80">
                                                        Tên học phí
                                                    </Label>
                                                    <Input
                                                        suppressHydrationWarning
                                                        variant={getInputVariant()}
                                                        id="title"
                                                        value={newTuition.title}
                                                        onChange={(e) => setNewTuition({ ...newTuition, title: e.target.value })}
                                                        fullWidth
                                                        name="title"
                                                        placeholder="Nhập tên học phí"
                                                        type="text"
                                                    />
                                                    {formErrors.title && <div className="text-danger text-sm mt-1">{formErrors.title}</div>}
                                                    <FieldError />
                                                </TextField>
                                                <TextField
                                                    isRequired
                                                    name="amount"
                                                    isInvalid={!!formErrors.amount}
                                                >
                                                    <Label htmlFor="amount" className="font-medium text-foreground/80">
                                                        Số tiền
                                                    </Label>
                                                    <Input
                                                        suppressHydrationWarning
                                                        variant={getInputVariant()}
                                                        id="amount"
                                                        value={newTuition.amount ? String(newTuition.amount) : ""}
                                                        onChange={(e) => setNewTuition({ ...newTuition, amount: Number(e.target.value) })}
                                                        fullWidth
                                                        name="amount"
                                                        placeholder="Nhập số tiền"
                                                        type="number"
                                                    />
                                                    {formErrors.amount && <div className="text-danger text-sm mt-1">{formErrors.amount}</div>}
                                                    <FieldError />
                                                </TextField>
                                                <TextField
                                                    isRequired
                                                    name="gradeId"
                                                    isInvalid={!!formErrors.gradeId}
                                                >
                                                    <Label htmlFor="gradeId" className="font-medium text-foreground/80">
                                                        Khối (ID)
                                                    </Label>
                                                    <Input
                                                        suppressHydrationWarning
                                                        variant={getInputVariant()}
                                                        id="gradeId"
                                                        value={newTuition.gradeId ? String(newTuition.gradeId) : ""}
                                                        onChange={(e) => setNewTuition({ ...newTuition, gradeId: Number(e.target.value) })}
                                                        fullWidth
                                                        name="gradeId"
                                                        placeholder="Nhập ID khối"
                                                        type="number"
                                                    />
                                                    {formErrors.gradeId && <div className="text-danger text-sm mt-1">{formErrors.gradeId}</div>}
                                                    <FieldError />
                                                </TextField>
                                                <TextField
                                                    isRequired
                                                    name="fromDate"
                                                    isInvalid={!!formErrors.fromDate}
                                                >
                                                    <Label htmlFor="fromDate" className="font-medium text-foreground/80">
                                                        Ngày bắt đầu
                                                    </Label>
                                                    <Input
                                                        suppressHydrationWarning
                                                        variant={getInputVariant()}
                                                        id="fromDate"
                                                        value={newTuition.fromDate}
                                                        onChange={(e) => setNewTuition({ ...newTuition, fromDate: e.target.value })}
                                                        fullWidth
                                                        name="fromDate"
                                                        type="date"
                                                    />
                                                    {formErrors.fromDate && <div className="text-danger text-sm mt-1">{formErrors.fromDate}</div>}
                                                    <FieldError />
                                                </TextField>
                                                <TextField
                                                    isRequired
                                                    name="toDate"
                                                    isInvalid={!!formErrors.toDate}
                                                >
                                                    <Label htmlFor="toDate" className="font-medium text-foreground/80">
                                                        Ngày kết thúc
                                                    </Label>
                                                    <Input
                                                        suppressHydrationWarning
                                                        variant={getInputVariant()}
                                                        id="toDate"
                                                        value={newTuition.toDate}
                                                        onChange={(e) => setNewTuition({ ...newTuition, toDate: e.target.value })}
                                                        fullWidth
                                                        name="toDate"
                                                        type="date"
                                                    />
                                                    {formErrors.toDate && <div className="text-danger text-sm mt-1">{formErrors.toDate}</div>}
                                                    <FieldError />
                                                </TextField>
                                                <TextField
                                                    isRequired
                                                    name="dueDate"
                                                    isInvalid={!!formErrors.dueDate}
                                                >
                                                    <Label htmlFor="dueDate" className="font-medium text-foreground/80">
                                                        Hạn chót
                                                    </Label>
                                                    <Input
                                                        suppressHydrationWarning
                                                        variant={getInputVariant()}
                                                        id="dueDate"
                                                        value={newTuition.dueDate}
                                                        onChange={(e) => setNewTuition({ ...newTuition, dueDate: e.target.value })}
                                                        fullWidth
                                                        name="dueDate"
                                                        type="date"
                                                    />
                                                    {formErrors.dueDate && <div className="text-danger text-sm mt-1">{formErrors.dueDate}</div>}
                                                    <FieldError />
                                                </TextField>
                                            </Fieldset.Group>
                                        </Fieldset>

                                    </Modal.Body>
                                    <Modal.Footer>
                                        <Button variant="ghost" onPress={closeAdd}>
                                            Hủy
                                        </Button>
                                        <Button variant="primary" isDisabled={isPending} onPress={handleCreateTuition}>
                                            {isPending ? "Đang thêm..." : "Thêm"}
                                        </Button>
                                    </Modal.Footer>
                                </Modal.Dialog>
                            </Modal.Container>
                        </Modal.Backdrop>
                    </Modal>
                </div>
            </div>
        </main>
    );
}