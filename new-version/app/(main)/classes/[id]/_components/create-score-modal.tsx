"use client";

import { useEffect, useState, useMemo } from "react";
import { Button, Input, Modal, Spinner } from "@heroui/react";
import { useClassStudentsForScore } from "@/hooks/classes/detail/use-class-students-for-score";
import { useCreateScore } from "@/hooks/classes/detail/use-create-score";

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
      const scoreVal = Number(item.score);
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
        <Modal.Container size="lg">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Tạo bài kiểm tra mới</Modal.Heading>
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

                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-foreground">Nhập điểm cho học sinh</span>
                  <div className="border border-divider rounded-2xl overflow-hidden max-h-[40vh] overflow-y-auto">
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
                        <thead>
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
                                  type="number"
                                  placeholder="0.0"
                                  min={0}
                                  max={10}
                                  step={0.1}
                                  value={student.score}
                                  onChange={(e) => updateStudentScore(student.studentClassId, e.target.value)}
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
                {isPending ? <Spinner size="sm" /> : "Tạo bài kiểm tra"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
