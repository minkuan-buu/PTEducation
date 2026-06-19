"use client";

import { useEffect, useState, useMemo } from "react";
import { Button, Input, Modal, Spinner, toast } from "@heroui/react";
import { useClassStudentsForScore } from "@/hooks/classes/detail/use-class-students-for-score";
import { useCreateScore } from "@/hooks/classes/detail/use-create-score";
import * as XLSX from "xlsx";
import { getApiBaseUrl } from "@/services/api/config";
import axios from "axios";

type CreateScoreModalProps = {
  isOpen: boolean;
  handleOpenChange: (isOpen: boolean) => void;
  handleCloseModal: () => void;
  classId: string;
  defaultDate?: string;
};

type StudentScoreInput = {
  studentClassId: string;
  studentId: string;
  name: string;
  score: string;
  note: string;
};

const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function CreateScoreModal({
  isOpen,
  handleOpenChange,
  handleCloseModal,
  classId,
  defaultDate,
}: CreateScoreModalProps) {
  const [testDate, setTestDate] = useState(() => defaultDate ?? getTodayDate());
  const [shift, setShift] = useState("");
  const [studentScores, setStudentScores] = useState<StudentScoreInput[]>([]);

  const handleDownloadTemplate = async () => {
    try {
      const baseUrl = getApiBaseUrl().replace(/\/$/, "");
      const response = await axios.get(`${baseUrl}/api/template/import-score`, {
        params: { ClassId: classId },
        responseType: "blob",
        withCredentials: true,
      });

      const blob = new Blob([response.data], { type: String(response.headers["content-type"] || "") });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `StudentsScore_${classId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download template:", error);
      toast.danger("Không thể tải file mẫu. Vui lòng thử lại sau.");
    }
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
          toast.danger("Không tìm thấy trang tính nào trong file Excel.");
          return;
        }

        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        if (jsonData.length === 0) {
          toast.danger("File Excel không có dữ liệu học sinh.");
          return;
        }

        const parsedScores: Record<string, { score: string; note: string }> = {};
        jsonData.forEach((row: any) => {
          const studentClassId = row.StudentClassID || row.studentClassId || row.studentClassID || row.StudentClassId;
          const scoreVal = row.Score !== undefined ? String(row.Score) : "";
          const noteVal = row.Note !== undefined ? String(row.Note) : "";
          if (studentClassId) {
            parsedScores[String(studentClassId).trim().toLowerCase()] = { score: scoreVal, note: noteVal };
          }
        });

        let updatedCount = 0;
        setStudentScores((prev) =>
          prev.map((student) => {
            const match = parsedScores[student.studentClassId.toLowerCase()];
            if (match) {
              updatedCount++;
              return {
                ...student,
                score: match.score,
                note: match.note,
              };
            }
            return student;
          })
        );

        toast.success(`Đã nhập điểm từ Excel thành công cho ${updatedCount} học sinh!`);
      } catch (err) {
        console.error("Failed to parse Excel file:", err);
        toast.danger("Có lỗi xảy ra khi đọc file Excel. Vui lòng kiểm tra lại định dạng file.");
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Fetch all students in the class
  const { data: studentsData, isLoading: isLoadingStudents } = useClassStudentsForScore(
    classId
  );

  // Initialize students scores on open or when student list loads
  useEffect(() => {
    if (!isOpen) return;

    if (studentsData) {
      setStudentScores(
        studentsData.map((student) => ({
          studentClassId: student.studentClassId,
          studentId: student.id,
          name: student.name,
          score: "",
          note: "",
        }))
      );
    } else {
      setStudentScores([]);
    }
  }, [studentsData, isOpen]);

  const updateStudentScore = (studentClassId: string, value: string) => {
    setStudentScores((prev) =>
      prev.map((item) =>
        item.studentClassId === studentClassId ? { ...item, score: value } : item
      )
    );
  };

  const updateStudentNote = (studentClassId: string, value: string) => {
    setStudentScores((prev) =>
      prev.map((item) =>
        item.studentClassId === studentClassId ? { ...item, note: value } : item
      )
    );
  };

  const handleSuccess = () => {
    handleCloseModal();
    setTestDate(defaultDate ?? getTodayDate());
    setShift("");
    setStudentScores([]);
  };

  const { mutate: createScoreMutate, isPending } = useCreateScore(
    handleSuccess,
    classId
  );

  const handleSubmit = () => {
    if (!testDate) {
      alert("Vui lòng nhập ngày kiểm tra.");
      return;
    }

    const scoreReqList = studentScores.map((item) => {
      const normalizedScore = item.score.replace(",", ".");
      const scoreVal = Number(normalizedScore);
      return {
        studentClassId: item.studentClassId,
        score: isNaN(scoreVal) || !item.score ? 0 : scoreVal,
        note: item.note ? item.note : null,
      };
    });

    createScoreMutate({
      testDateAt: new Date(testDate).toISOString(),
      classId,
      shift: shift || null,
      scoreReqList,
    });
  };

  return (
    <Modal>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={handleOpenChange}>
        <Modal.Container size="cover">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Tạo điểm kiểm tra mới</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="px-2">
              <div className="flex flex-col gap-4 py-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
                    Ngày kiểm tra
                    <Input
                      type="date"
                      value={testDate}
                      onChange={(e) => setTestDate(e.target.value)}
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
                    Ca học (không bắt buộc)
                    <Input
                      type="text"
                      placeholder="Ví dụ: Ca 1, Ca chiều..."
                      value={shift}
                      onChange={(e) => setShift(e.target.value)}
                    />
                  </label>
                </div>
                <div className="flex flex-col gap-3 bg-default-100/50 dark:bg-default-50/30 p-4 rounded-2xl border border-divider">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-foreground">Nhập điểm từ Excel</span>
                    <span className="text-xs text-muted">Bạn có thể tải file mẫu xuống, điền điểm số và tải lên lại tại đây.</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onPress={handleDownloadTemplate}
                    >
                      Tải file mẫu
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onPress={() => document.getElementById("excel-upload-input")?.click()}
                    >
                      Tải lên file điểm (.xlsx)
                    </Button>
                    <input
                      id="excel-upload-input"
                      type="file"
                      accept=".xlsx, .xls"
                      style={{ display: "none" }}
                      onChange={handleExcelUpload}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-foreground">Nhập điểm cho học sinh</span>
                  <div className="border border-divider rounded-2xl overflow-hidden max-h-[48vh] overflow-y-auto">
                    {isLoadingStudents ? (
                      <div className="flex justify-center items-center py-8">
                        <Spinner size="md" />
                      </div>
                    ) : studentScores.length === 0 ? (
                      <div className="text-center text-muted py-8 text-sm">
                        Không tìm thấy học sinh trong lớp này.
                      </div>
                    ) : (
                      <table className="w-full text-sm text-left border-collapse">
                        <thead className="sticky top-0 z-10 bg-background">
                          <tr className="border-b border-divider bg-muted/40 text-muted font-semibold">
                            <th className="p-3">Học sinh</th>
                            <th className="p-3 w-32">Điểm (0 - 10)</th>
                            <th className="p-3">Ghi chú</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentScores.map((student) => (
                            <tr key={student.studentClassId} className="border-b border-divider last:border-0 hover:bg-muted/10">
                              <td className="p-3">
                                <p className="font-medium">{student.name}</p>
                                <p className="text-xs text-muted">{student.studentId}</p>
                              </td>
                              <td className="p-3">
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="0"
                                  value={student.score}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9.,]/g, "");
                                    updateStudentScore(student.studentClassId, val);
                                  }}
                                  className="w-24"
                                />
                              </td>
                              <td className="p-3">
                                <Input
                                  type="text"
                                  placeholder="Thêm ghi chú..."
                                  value={student.note}
                                  onChange={(e) => updateStudentNote(student.studentClassId, e.target.value)}
                                  className="w-full"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="ghost" onPress={handleCloseModal}>
                Hủy
              </Button>
              <Button
                variant="primary"
                isDisabled={!testDate || isPending || isLoadingStudents}
                onPress={handleSubmit}
              >
                {isPending ? <Spinner size="sm" /> : "Tạo điểm kiểm tra"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
