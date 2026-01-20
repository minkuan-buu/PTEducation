import { Button, Input, Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/react"
import { GETEXPORTREPORT } from "../api/api";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { Logout } from "@/pages/logout";
import { MdClear } from "react-icons/md";

export const ExportReportModal = ({
    isOpen,
    classId,
    onOpenChange
}: {
    isOpen: boolean;
    classId: string;
    onOpenChange: () => void;
}) => {
    const [isLoading, setIsLoading] = useState<boolean>();

    function CloseModal() {
        onOpenChange();
        formikExport.resetForm();
    }

    const formikExport = useFormik({
        initialValues: {
            FromDate: "",
            ToDate: "",
        },
        validationSchema: Yup.object({
            FromDate: Yup.date()
                .nullable() // Cho phép giá trị null
                .notRequired(), // Khai báo rõ là không bắt buộc (optional)

            ToDate: Yup.date()
                .nullable()
                .notRequired()
                .test(
                    "is-greater",
                    "Ngày kết thúc phải lớn hơn ngày bắt đầu",
                    function (value) {
                        const { FromDate } = this.parent;
                        if (!value || !FromDate) {
                            return true;
                        }
                        return new Date(value) >= new Date(FromDate);
                    }
                ),
        }),
        onSubmit: async (values) => {
            setIsLoading(true);
            try {
                var token = localStorage.getItem("token");
                const callback = await GETEXPORTREPORT(token, classId, values.FromDate, values.ToDate);

                if (!callback.isSuccess) {
                    if (callback.res.status === 401) {
                        Logout();
                    }
                    let result = await callback.res.json();
                    alert(result.message);
                } else {
                    // --- [SỬA ĐOẠN NÀY] ---

                    // 1. Lấy tên file từ Header trước khi lấy Blob
                    // Header trả về thường có dạng: "attachment; filename=TenFile.zip"
                    const disposition = callback.res.headers.get('Content-Disposition');
                    let fileName = 'Download.zip'; // Tên mặc định phòng hờ

                    if (disposition) {
                        // Dùng Regex để tách lấy phần tên file sau dấu bằng
                        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                        const matches = filenameRegex.exec(disposition);
                        if (matches != null && matches[1]) {
                            fileName = matches[1].replace(/['"]/g, ''); // Xóa dấu ngoặc kép nếu có
                        }
                    }

                    // 2. Lấy dữ liệu file (Blob)
                    let result = await callback.res.blob();

                    // 3. Tạo link và tải xuống
                    const blobUrl = URL.createObjectURL(result);
                    const link = document.createElement('a');
                    link.href = blobUrl;

                    // Gán tên file đã lấy được từ BE
                    link.download = fileName;

                    document.body.appendChild(link); // Cần thiết cho một số trình duyệt (Firefox)
                    link.click();
                    document.body.removeChild(link);

                    // Giải phóng
                    URL.revokeObjectURL(blobUrl);
                    setIsLoading(false); // Nhớ tắt loading
                }
            } catch (e) {

            } finally {
                setIsLoading(false);
            }

        }
    });
    return (
        <Modal
            isDismissable={false}
            isKeyboardDismissDisabled={true}
            isOpen={isOpen}
            onOpenChange={CloseModal}
            size="4xl"
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader>Chọn ngày muốn xuất phiếu liên lạc</ModalHeader>
                        <ModalBody>
                            <form onSubmit={formikExport.handleSubmit}>

                                <div className="flex flex-row gap-4 items-center">
                                    <Input name="FromDate" label="Từ ngày" type="date" value={formikExport.values.FromDate} onChange={formikExport.handleChange} placeholder="Nhập từ ngày muốn lấy dữ liệu" />
                                    {formikExport.values.FromDate !== "" && (
                                        <button className="hover:rounded-full p-4 hover:bg-gray-400 hover:text-black" type="reset" onClick={() => formikExport.setFieldValue("FromDate", "")}>
                                            <MdClear />
                                        </button>
                                    )}
                                </div>
                                {formikExport.errors.FromDate && formikExport.touched.FromDate && (
                                    <p style={{ color: "red" }}>{formikExport.errors.FromDate}</p>
                                )}
                                <div className="flex flex-row gap-4 items-center">
                                    <Input name="ToDate" className="mt-3" label="Đến ngày" type="date" value={formikExport.values.ToDate} onChange={formikExport.handleChange} placeholder="Nhập đến ngày muốn lấy dữ liệu" />
                                    {formikExport.values.ToDate !== "" && (
                                        <button className="hover:rounded-full p-4 hover:bg-gray-400 hover:text-black" type="reset" onClick={() => formikExport.setFieldValue("ToDate", "")}>
                                            <MdClear />
                                        </button>
                                    )}
                                </div>
                                {formikExport.errors.ToDate && formikExport.touched.ToDate && (
                                    <p style={{ color: "red" }}>{formikExport.errors.ToDate}</p>
                                )}
                                <Button
                                    fullWidth
                                    color="primary"
                                    id="send-code-button"
                                    isLoading={isLoading}
                                    style={{ marginTop: "2vh", marginBottom: "2vh" }}
                                    type="submit"
                                >
                                    Truy xuất
                                </Button>
                            </form>
                        </ModalBody>
                    </>
                )}
            </ModalContent>
        </Modal>
    )
}