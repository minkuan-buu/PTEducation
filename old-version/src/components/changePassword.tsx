import { Button, Input, Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/react"
import { CHANGEPASSWORD } from "../api/api";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";

export const ChangePassword = ({
    isOpen,
    isMobile,
    setHandling,
    handling,
    onOpenChange
}: {
    isOpen: boolean;
    isMobile: boolean;
    setHandling: (handling: boolean) => void;
    handling: boolean;
    onOpenChange: () => void;
}) => {
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    function CloseModal() {
        onOpenChange();
        formikChangePassword.resetForm();
    }
    const formikChangePassword = useFormik({
        initialValues: {
            oldPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
        validationSchema: Yup.object({
            oldPassword: Yup.string().min(6, "Must be at least 6 characters").required("Bắt buộc"),
            newPassword: Yup.string().min(6, "Must be at least 6 characters").required("Bắt buộc"),
            confirmPassword: Yup.string().min(6, "Must be at least 6 characters").required("Bắt buộc"),
        }),
        onSubmit: async (values) => {
            setHandling(true);
            var token = localStorage.getItem("token");
            const { isSuccess, res } = await CHANGEPASSWORD(token, values);

            if (!isSuccess) {
                if (res.status == 401) {
                    alert("Phiên đăng nhập hết hạn");
                    window.location.href = "/";
                } else {
                    var result = await res.json();

                    alert(result.message);
                }
            } else {
                var result = await res.json();

                alert("Đổi mật khẩu thành công");
                CloseModal();
            }
            setHandling(false);
        }
    });
    return (
        <Modal
            isDismissable={false}
            isKeyboardDismissDisabled={true}
            placement={isMobile ? "top" : "center"}
            isOpen={isOpen}
            onOpenChange={CloseModal}
            size="4xl"
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader>Đổi mật khẩu</ModalHeader>
                        <ModalBody>
                            <p>Thay đổi mật khẩu mới</p>
                            <form onSubmit={formikChangePassword.handleSubmit}>
                                <Input
                                    label="Mật khẩu cũ"
                                    name="oldPassword"
                                    placeholder="Nhập mật khẩu cũ"
                                    type={showOldPassword ? "text" : "password"}
                                    value={formikChangePassword.values.oldPassword}
                                    onChange={formikChangePassword.handleChange}
                                    endContent={
                                        <div
                                            className="w-12 h-10 flex items-center justify-center cursor-pointer 
                                                                rounded-full transition-colors duration-200 ease-in-out 
                                                                hover:bg-slate-400"
                                            onClick={() => setShowOldPassword(!showOldPassword)}
                                        >
                                            {showOldPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                                        </div>
                                    }
                                />
                                {formikChangePassword.errors.oldPassword &&
                                    formikChangePassword.touched.oldPassword && (
                                        <p style={{ color: "red" }}>
                                            {formikChangePassword.errors.oldPassword}
                                        </p>
                                    )}
                                <Input
                                    className="mt-3"
                                    label="Mật khẩu mới"
                                    name="newPassword"
                                    placeholder="Nhập mật khẩu mới"
                                    type={showNewPassword ? "text" : "password"}
                                    value={formikChangePassword.values.newPassword}
                                    onChange={formikChangePassword.handleChange}
                                    endContent={
                                        <div
                                            className="w-12 h-10 flex items-center justify-center cursor-pointer 
                                                                rounded-full transition-colors duration-200 ease-in-out 
                                                                hover:bg-slate-400"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                        >
                                            {showNewPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                                        </div>
                                    }
                                />
                                {formikChangePassword.errors.newPassword &&
                                    formikChangePassword.touched.newPassword && (
                                        <p style={{ color: "red" }}>
                                            {formikChangePassword.errors.newPassword}
                                        </p>
                                    )}
                                <Input
                                    className="mt-3"
                                    label="Xác nhận mật khẩu"
                                    name="confirmPassword"
                                    placeholder="Nhập lại mật khẩu mới"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={formikChangePassword.values.confirmPassword}
                                    onChange={formikChangePassword.handleChange}
                                    endContent={
                                        <div
                                            className="w-12 h-10 flex items-center justify-center cursor-pointer 
                                                            rounded-full transition-colors duration-200 ease-in-out 
                                                            hover:bg-slate-400"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                                        </div>
                                    }
                                />
                                {formikChangePassword.errors.confirmPassword &&
                                    formikChangePassword.touched.confirmPassword && (
                                        <p style={{ color: "red" }}>
                                            {formikChangePassword.errors.confirmPassword}
                                        </p>
                                    )}
                                <Button
                                    fullWidth
                                    color="primary"
                                    id="send-code-button"
                                    isLoading={handling}
                                    style={{ marginTop: "2vh", marginBottom: "2vh" }}
                                    type="submit"
                                >
                                    Đổi
                                </Button>
                            </form>
                        </ModalBody>
                    </>
                )}
            </ModalContent>
        </Modal>
    )
}