import { Button, Input, Modal, ModalBody, ModalContent, ModalHeader, Textarea } from "@heroui/react";
import { GETEXPORTREPORT } from "../api/api";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { MdClear } from "react-icons/md";

// Nội dung mặc định
const DEFAULT_VALUES = {
    point1: 6, // Mốc điểm 1 mặc định
    point2: 8, // Mốc điểm 2 mặc định
    comment1: "",
    comment2: "",
    comment3: ""
};

export const ExportReportModal = ({
    isOpen,
    classId,
    onOpenChange
}: {
    isOpen: boolean;
    classId: string;
    onOpenChange: () => void;
}) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);

    function CloseModal() {
        onOpenChange();
        formikExport.resetForm();
    }

    const formikExport = useFormik({
        initialValues: {
            FromDate: "",
            ToDate: "",
            // Các mốc điểm tùy chỉnh
            PointMilestone1: DEFAULT_VALUES.point1,
            PointMilestone2: DEFAULT_VALUES.point2,
            // Các nội dung nhận xét
            CommentLow: DEFAULT_VALUES.comment1,
            CommentMid: DEFAULT_VALUES.comment2,
            CommentHigh: DEFAULT_VALUES.comment3,
        },
        validationSchema: Yup.object({
            FromDate: Yup.date()
                .nullable()
                .test(
                    "at-least-one-required",
                    "Vui lòng chọn ít nhất Từ ngày hoặc Đến ngày",
                    function (value) {
                        // Lấy giá trị của ToDate từ cùng object cha
                        const { ToDate } = this.parent;
                        // Trả về True (hợp lệ) nếu: Có FromDate HOẶC có ToDate
                        return !!value || !!ToDate;
                    }
                ),

            ToDate: Yup.date()
                .nullable()
                .test(
                    "at-least-one-required",
                    "Vui lòng chọn ít nhất Từ ngày hoặc Đến ngày",
                    function (value) {
                        // Lấy giá trị của FromDate
                        const { FromDate } = this.parent;
                        // Trả về True (hợp lệ) nếu: Có ToDate HOẶC có FromDate
                        return !!value || !!FromDate;
                    }
                )
                // Logic kiểm tra ngày kết thúc phải lớn hơn ngày bắt đầu (chỉ chạy khi cả 2 cùng có dữ liệu)
                .test("is-greater", "Ngày kết thúc phải lớn hơn ngày bắt đầu", function (value) {
                    const { FromDate } = this.parent;
                    // Nếu thiếu 1 trong 2 thì bỏ qua check logic này (để cái test bên trên lo)
                    if (!value || !FromDate) return true;
                    return new Date(value) >= new Date(FromDate);
                }),

            // --- Các phần giữ nguyên ---
            PointMilestone1: Yup.number()
                .required("Bắt buộc")
                .min(0, "Min là 0")
                .max(10, "Max là 10"),
            PointMilestone2: Yup.number()
                .required("Bắt buộc")
                .max(10, "Max là 10")
                .test("greater-than-p1", "Mốc 2 phải lớn hơn Mốc 1", function (value) {
                    return value > this.parent.PointMilestone1;
                }),
            CommentLow: Yup.string().required("Vui lòng nhập nhận xét"),
            CommentMid: Yup.string().required("Vui lòng nhập nhận xét"),
            CommentHigh: Yup.string().required("Vui lòng nhập nhận xét"),
        }),
        onSubmit: async (values) => {
            setIsLoading(true);
            try {
                var token = localStorage.getItem("token");

                var commentReqBody = {
                    pointMilestone1: values.PointMilestone1,
                    pointMilestone2: values.PointMilestone2,
                    commentLow: values.CommentLow,
                    commentMid: values.CommentMid,
                    commentHigh: values.CommentHigh
                }

                console.log("commentReqBody:", commentReqBody);

                // CẬP NHẬT API: Truyền thêm cả mốc điểm và nội dung
                const callback = await GETEXPORTREPORT(
                    token,
                    classId,
                    values.FromDate,
                    values.ToDate,
                    commentReqBody
                );

                if (!callback.isSuccess) {
                    // ... xử lý lỗi (giữ nguyên code cũ) ...
                    let result = await callback.res.json();
                    alert(result.message);
                } else {
                    // ... xử lý download file (giữ nguyên code cũ) ...
                    const disposition = callback.res.headers.get('Content-Disposition');
                    let fileName = 'Download.zip';
                    if (disposition) {
                        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                        const matches = filenameRegex.exec(disposition);
                        if (matches != null && matches[1]) fileName = matches[1].replace(/['"]/g, '');
                    }
                    let result = await callback.res.blob();
                    const blobUrl = URL.createObjectURL(result);
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.download = fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(blobUrl);
                }
            } catch (e) {
                console.error(e);
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
            size="5xl" // Tăng size modal để chứa đủ thông tin
            scrollBehavior="inside"
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader>Tùy chỉnh & Xuất phiếu liên lạc</ModalHeader>
                        <ModalBody>
                            <form onSubmit={formikExport.handleSubmit} className="flex flex-col gap-5 pb-4">

                                {/* 1. Chọn ngày tháng */}
                                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg border border-dashed border-gray-300">
                                    <h3 className="col-span-2 text-sm font-bold text-gray-500 uppercase">1. Phạm vi dữ liệu</h3>

                                    <div className="flex flex-row gap-4 items-center">
                                        <Input
                                            name="FromDate" label="Từ ngày" type="date"
                                            value={formikExport.values.FromDate} onChange={formikExport.handleChange}
                                            errorMessage={formikExport.errors.FromDate} isInvalid={!!formikExport.errors.FromDate}
                                        />


                                        {formikExport.values.FromDate !== "" && (
                                            <button className="hover:rounded-full p-4 hover:bg-gray-400 hover:text-black" type="reset" onClick={() => formikExport.setFieldValue("FromDate", "")}>
                                                <MdClear />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex flex-row gap-4 items-center">
                                        <Input
                                            name="ToDate" label="Đến ngày" type="date"
                                            value={formikExport.values.ToDate} onChange={formikExport.handleChange}
                                            errorMessage={formikExport.errors.ToDate} isInvalid={!!formikExport.errors.ToDate}
                                        />

                                        {formikExport.values.ToDate !== "" && (

                                            <button className="hover:rounded-full p-4 hover:bg-gray-400 hover:text-black" type="reset" onClick={() => formikExport.setFieldValue("ToDate", "")}>

                                                <MdClear />

                                            </button>

                                        )}

                                    </div>
                                </div>

                                {/* 2. Cấu hình Mốc điểm và Nhận xét */}
                                <div className="flex flex-col gap-4">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase border-b pb-2">2. Cấu hình thang điểm & Nhận xét</h3>

                                    {/* MỨC 1: DƯỚI MỐC 1 */}
                                    <div className="flex flex-row gap-4 items-start">
                                        <div className="w-1/4">
                                            <Input
                                                type="number"
                                                label="Mốc điểm thấp"
                                                placeholder="VD: 6.0"
                                                name="PointMilestone1"
                                                value={formikExport.values.PointMilestone1.toString()}
                                                onChange={formikExport.handleChange}
                                                endContent={<div className="pointer-events-none flex items-center"><span className="text-default-400 text-small">điểm</span></div>}
                                                isInvalid={!!formikExport.errors.PointMilestone1}
                                                errorMessage={formikExport.errors.PointMilestone1}
                                            />
                                            <p className="text-tiny text-gray-400 mt-1 pl-1">
                                                Khoảng: 0 - {formikExport.values.PointMilestone1 || "..."}
                                            </p>
                                        </div>
                                        <div className="w-3/4">
                                            <Textarea
                                                label={`Nhận xét: Điểm dưới ${formikExport.values.PointMilestone1}`}
                                                name="CommentLow"
                                                placeholder="Nhập đánh giá"
                                                value={formikExport.values.CommentLow}
                                                onChange={formikExport.handleChange}
                                                minRows={2}
                                                color="danger"
                                                variant="faded"
                                            />
                                        </div>
                                    </div>

                                    {/* MỨC 2: TỪ MỐC 1 ĐẾN MỐC 2 */}
                                    <div className="flex flex-row gap-4 items-start">
                                        <div className="w-1/4">
                                            <Input
                                                type="number"
                                                label="Mốc điểm cao"
                                                placeholder="VD: 8.0"
                                                name="PointMilestone2"
                                                value={formikExport.values.PointMilestone2.toString()}
                                                onChange={formikExport.handleChange}
                                                endContent={<div className="pointer-events-none flex items-center"><span className="text-default-400 text-small">điểm</span></div>}
                                                isInvalid={!!formikExport.errors.PointMilestone2}
                                                errorMessage={formikExport.errors.PointMilestone2}
                                            />
                                            <p className="text-tiny text-gray-400 mt-1 pl-1">
                                                Khoảng: {formikExport.values.PointMilestone1 || "..."} - {formikExport.values.PointMilestone2 || "..."}
                                            </p>
                                        </div>
                                        <div className="w-3/4">
                                            <Textarea
                                                label={`Nhận xét: Điểm từ ${formikExport.values.PointMilestone1} đến ${formikExport.values.PointMilestone2}`}
                                                name="CommentMid"
                                                placeholder="Nhập đánh giá"
                                                value={formikExport.values.CommentMid}
                                                onChange={formikExport.handleChange}
                                                minRows={2}
                                                color="warning"
                                                variant="faded"
                                            />
                                        </div>
                                    </div>

                                    {/* MỨC 3: TRÊN MỐC 2 */}
                                    <div className="flex flex-row gap-4 items-start">
                                        <div className="w-1/4 flex flex-col justify-center h-full pt-4">
                                            <span className="font-semibold text-gray-600 pl-2">Mức điểm cao</span>
                                            <p className="text-tiny text-gray-400 pl-2">
                                                Khoảng: {formikExport.values.PointMilestone2 || "..."} - 10
                                            </p>
                                        </div>
                                        <div className="w-3/4">
                                            <Textarea
                                                label={`Nhận xét: Điểm trên ${formikExport.values.PointMilestone2}`}
                                                name="CommentHigh"
                                                placeholder="Nhập đánh giá"
                                                value={formikExport.values.CommentHigh}
                                                onChange={formikExport.handleChange}
                                                minRows={2}
                                                color="success"
                                                variant="faded"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button fullWidth color="primary" isLoading={isLoading} type="submit" className="mt-4 font-semibold text-lg">
                                    XUẤT BÁO CÁO
                                </Button>
                            </form>
                        </ModalBody>
                    </>
                )}
            </ModalContent>
        </Modal>
    )
}