import {
    Button,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Input,
    Checkbox
} from "@heroui/react";
import { useEffect, useState } from "react";
import { UPDATESTUDENTINFO } from "../api/api";
import { Logout } from "@/pages/logout";
import { useFormik } from "formik";
import * as Yup from "yup";

type StudentInfo = {
    studentClassId: string;
    name: string;
    email: string;
    phone: string;
} | null;

export function UpdateInfoModal({
    isOpen,
    closeModal,
    selectedStudentInfo
}: {
    isOpen: boolean;
    closeModal: () => void;
    selectedStudentInfo: StudentInfo;
}) {
    const [onLoading, setOnLoading] = useState(false);
    const [isResendInfo, setIsResendInfo] = useState(false);

    const { studentClassId = "", name = "", email = "", phone = "" } =
        selectedStudentInfo || {};

    const formikUpdateInfo = useFormik({
        enableReinitialize: true,
        initialValues: {
            name,
            email,
            phone,
            defaultPassword: ""
        },
        validationSchema: Yup.object({
            name: Yup.string().required("Tên học sinh là bắt buộc"),
            email: Yup.string()
                .email("Email không hợp lệ")
                .required("Email là bắt buộc"),
        }),
        onSubmit: async (values) => {
            setOnLoading(true);

            var body = {
                name: values.name,
                email: values.email,
                phone: values.phone.toString().length > 0 ? values.phone.toString() : "-",
                defaultPassword: values.defaultPassword.length < 1 ? null : values.defaultPassword,
                isResendInfo: isResendInfo
            };

            // console.log("Submitting form with values:", body);

            try {
                const { isSuccess, res } = await UPDATESTUDENTINFO(
                    localStorage.getItem("token"),
                    body,
                    studentClassId
                );

                if (!isSuccess) {
                    if (res.status === 401) {
                        Logout();
                    }
                    let result = await res.json();
                    alert(result.message);
                } else {
                    alert("Cập nhật thông tin thành công!");
                    formikUpdateInfo.resetForm();
                    closeModal();
                }
            } catch (error) {
                console.log(error);
            } finally {
                setOnLoading(false);
            }
        }
    });

    return (
        <Modal isOpen={isOpen} size="xl" onOpenChange={closeModal}>
            <ModalContent className="h-fit overflow-auto">
                {(onClose) => (
                    <>
                        <ModalHeader>Cập nhật thông tin học sinh</ModalHeader>
                        <form onSubmit={formikUpdateInfo.handleSubmit}>
                            <ModalBody>
                                <div className="flex flex-col gap-4">
                                    <Input
                                        name="name"
                                        type="text"
                                        label="Tên học sinh"
                                        placeholder="Nhập tên học sinh"
                                        value={formikUpdateInfo.values.name}
                                        onChange={formikUpdateInfo.handleChange}
                                        isInvalid={!!formikUpdateInfo.errors.name}
                                        errorMessage={formikUpdateInfo.errors.name}
                                    />
                                    <Input
                                        name="email"
                                        type="text"
                                        label="Email học sinh"
                                        placeholder="Nhập email học sinh"
                                        value={formikUpdateInfo.values.email}
                                        onChange={formikUpdateInfo.handleChange}
                                        isInvalid={!!formikUpdateInfo.errors.email}
                                        errorMessage={formikUpdateInfo.errors.email}
                                    />
                                    <Input
                                        name="phone"
                                        type="text"
                                        label="Số điện thoại"
                                        placeholder="Nhập số điện thoại"
                                        value={formikUpdateInfo.values.phone}
                                        onChange={formikUpdateInfo.handleChange}
                                        isInvalid={!!formikUpdateInfo.errors.phone}
                                        errorMessage={formikUpdateInfo.errors.phone}
                                    />
                                    <Input
                                        name="defaultPassword"
                                        type="password"
                                        label="Mật khẩu mặc định"
                                        placeholder="Nhập mật khẩu mặc định (không bắt buộc)"
                                        value={formikUpdateInfo.values.defaultPassword}
                                        onChange={formikUpdateInfo.handleChange}
                                        isInvalid={!!formikUpdateInfo.errors.defaultPassword}
                                        errorMessage={formikUpdateInfo.errors.defaultPassword}
                                    />
                                    <Checkbox isSelected={isResendInfo} onValueChange={setIsResendInfo} name="isResendInfo">
                                        Gửi lại thông tin đăng nhập cho học sinh qua email
                                    </Checkbox>
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button onClick={onClose}>Hủy</Button>
                                <Button type="submit" color="warning" isDisabled={onLoading}>
                                    {onLoading ? "Đang xử lý..." : "Cập nhật"}
                                </Button>
                            </ModalFooter>
                        </form>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
