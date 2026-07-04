"use client";

import { Button, Description, FieldError, Input, InputGroup, Label, Modal, Spinner, TextField } from "@heroui/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { useMutation } from "@tanstack/react-query";
import { v2 } from "@/services/api";
import { AxiosError } from "axios";
import { toast } from "@heroui/react";

export default function ModalChangePassword({
    isOpen,
    setOpen,
    close,
}: {
    isOpen: boolean;
    setOpen: (value: boolean) => void;
    close: () => void;
}) {
    const [isShowOld, setIsShowOld] = useState(false);
    const [isShowNew, setIsShowNew] = useState(false);
    const [isShowConfirm, setIsShowConfirm] = useState(false);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [isMounted, setIsMounted] = useState(false);
    const { resolvedTheme } = useTheme();

    const changePasswordMutation = useMutation({
        mutationFn: async () => {
            return await v2.changePassword({
                oldPassword,
                newPassword,
                confirmPassword,
            });
        },
        onSuccess: () => {
            toast.success("Đổi mật khẩu thành công!");
            close();
        },
        onError: (error) => {
            const axiosError = error as AxiosError;
            const responseData = axiosError.response?.data;
            const message =
                typeof responseData === "object" &&
                responseData !== null &&
                "message" in responseData
                    ? String((responseData as { message?: unknown }).message)
                    : axiosError.message;
            toast.danger(message);
        },
    });

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setIsShowOld(false);
            setIsShowNew(false);
            setIsShowConfirm(false);
        }
    }, [isOpen]);

    const handleEditSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (oldPassword.length < 6 || newPassword.length < 6 || confirmPassword !== newPassword) {
            return;
        }
        changePasswordMutation.mutate();
    };

    const isSubmitDisabled =
        oldPassword.length < 6 ||
        newPassword.length < 6 ||
        confirmPassword !== newPassword ||
        changePasswordMutation.isPending;

    return (
        <Modal>
            <Modal.Backdrop isOpen={isOpen} onOpenChange={setOpen}>
                <Modal.Container size="lg">
                    <Modal.Dialog className="w-full md:max-w-xl">
                        <Modal.Header className="flex flex-col gap-2 pb-2">
                            <h2 className="text-xl font-bold text-foreground">Đổi mật khẩu</h2>
                            <Description className="text-muted">Nhập mật khẩu cũ và mật khẩu mới của bạn</Description>
                        </Modal.Header>
                        <form onSubmit={handleEditSubmit}>
                            <Modal.Body className="px-6 py-6 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-6">
                                {/* Old Password */}
                                <TextField isRequired name="old-password">
                                    <Label htmlFor="old-password" className="font-medium text-foreground/80">
                                        Mật khẩu cũ
                                    </Label>
                                    <InputGroup>
                                        <InputGroup.Input
                                            suppressHydrationWarning
                                            autoComplete="current-password"
                                            id="old-password"
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            placeholder="Nhập mật khẩu cũ"
                                            type={isShowOld ? "text" : "password"}
                                        />
                                        <InputGroup.Suffix>
                                            <button
                                                className="focus:outline-none flex items-center justify-center"
                                                type="button"
                                                onClick={() => setIsShowOld(!isShowOld)}
                                                aria-label="Toggle password visibility"
                                            >
                                                {isShowOld ? (
                                                    <FaRegEyeSlash className="text-xl text-default-400" />
                                                ) : (
                                                    <FaRegEye className="text-xl text-default-400" />
                                                )}
                                            </button>
                                        </InputGroup.Suffix>
                                    </InputGroup>
                                </TextField>

                                {/* New Password */}
                                <TextField
                                    isRequired
                                    name="new-password"
                                    validate={(val) => {
                                        if (val.length < 6) {
                                            return "Mật khẩu cần ít nhất 6 ký tự";
                                        }
                                        return null;
                                    }}
                                >
                                    <Label htmlFor="new-password" className="font-medium text-foreground/80">
                                        Mật khẩu mới
                                    </Label>
                                    <InputGroup>
                                        <InputGroup.Input
                                            suppressHydrationWarning
                                            autoComplete="new-password"
                                            id="new-password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Nhập mật khẩu mới"
                                            type={isShowNew ? "text" : "password"}
                                        />
                                        <InputGroup.Suffix>
                                            <button
                                                className="focus:outline-none flex items-center justify-center"
                                                type="button"
                                                onClick={() => setIsShowNew(!isShowNew)}
                                                aria-label="Toggle password visibility"
                                            >
                                                {isShowNew ? (
                                                    <FaRegEyeSlash className="text-xl text-default-400" />
                                                ) : (
                                                    <FaRegEye className="text-xl text-default-400" />
                                                )}
                                            </button>
                                        </InputGroup.Suffix>
                                    </InputGroup>
                                    <FieldError />
                                </TextField>

                                {/* Confirm Password */}
                                <TextField
                                    isRequired
                                    name="confirm-password"
                                    validate={(val) => {
                                        if (val !== newPassword) {
                                            return "Mật khẩu xác nhận không trùng khớp";
                                        }
                                        return null;
                                    }}
                                >
                                    <Label htmlFor="confirm-password" className="font-medium text-foreground/80">
                                        Xác nhận mật khẩu mới
                                    </Label>
                                    <InputGroup>
                                        <InputGroup.Input
                                            suppressHydrationWarning
                                            autoComplete="new-password"
                                            id="confirm-password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Nhập lại mật khẩu mới"
                                            type={isShowConfirm ? "text" : "password"}
                                        />
                                        <InputGroup.Suffix>
                                            <button
                                                className="focus:outline-none flex items-center justify-center"
                                                type="button"
                                                onClick={() => setIsShowConfirm(!isShowConfirm)}
                                                aria-label="Toggle password visibility"
                                            >
                                                {isShowConfirm ? (
                                                    <FaRegEyeSlash className="text-xl text-default-400" />
                                                ) : (
                                                    <FaRegEye className="text-xl text-default-400" />
                                                )}
                                            </button>
                                        </InputGroup.Suffix>
                                    </InputGroup>
                                    <FieldError />
                                </TextField>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button variant="ghost" onPress={() => close()} isDisabled={changePasswordMutation.isPending}>
                                    Hủy
                                </Button>
                                <Button
                                    variant="primary"
                                    type="submit"
                                    isDisabled={isSubmitDisabled}
                                >
                                    {changePasswordMutation.isPending && <Spinner size="sm" color="current" className="mr-2" />}
                                    Đổi mật khẩu
                                </Button>
                            </Modal.Footer>
                        </form>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}
