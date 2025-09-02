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
import { DELETESTUDENT } from "../api/api";
import { Logout } from "@/pages/logout";
import { useFormik } from "formik";
import * as Yup from "yup";

export function DeleteStudentModal({
    isOpen,
    closeModal,
    studentClassId,
    studentName
}) {
    const [onLoading, setOnLoading] = useState(false);

    const formikDelete = useFormik({
        initialValues: {},
        onSubmit: async (values) => {
            setOnLoading(true);

            try {
                const { isSuccess, res } = await DELETESTUDENT(
                    localStorage.getItem("token"),
                    studentClassId
                );

                if (!isSuccess) {
                    if (res.status === 401) {
                        Logout();
                    }
                    let result = await res.json();
                    alert(result.message);
                } else {
                    alert("Xóa học sinh thành công!");
                    formikDelete.resetForm();
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
                        <ModalBody>
                            <p>Bạn đang thao tác xóa học sinh <strong>{studentName}</strong> ra khỏi hệ thống. Mọi thông tin và dữ liệu liên quan như <strong>Điểm</strong> và <strong>Điểm danh</strong> sẽ bị xóa vĩnh viễn. Tiếp tục?</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button onClick={onClose}>Hủy</Button>
                            <form onSubmit={formikDelete.handleSubmit}>
                                <Button type="submit" color="danger" isDisabled={onLoading}>
                                    {onLoading ? "Đang xử lý..." : "Xóa"}
                                </Button>
                            </form>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
