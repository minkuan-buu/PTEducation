"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Accordion,
  Avatar,
  Button,
  Chip,
  Input,
  Modal,
  Spinner,
  Skeleton,
  useOverlayState,
} from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { FaChevronDown, FaPlus, FaTrash, FaEdit } from "react-icons/fa";

import { useClassScores } from "@/hooks/classes/detail/use-class-scores";
import { useScoreDetail } from "@/hooks/classes/detail/use-score-detail";
import { useUpdateScoreDetail } from "@/hooks/classes/detail/use-update-score-detail";
import { useDeleteScore } from "@/hooks/classes/detail/use-delete-score";
import CreateScoreModal from "./create-score-modal";
import styles from "./class-attendance-panel.module.css"; // Reuse scroll styles if needed

const formatDateOnly = (value: string | Date | null) => {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return "-";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

type GroupedScores = {
  monthYear: string; // e.g. "06/2026"
  label: string; // e.g. "Tháng 06/2026"
  tests: any[];
  averageScore: number;
};

export function ClassScorePanel({ classId }: { classId: string }) {
  const queryClient = useQueryClient();
  const [selectedScoreId, setSelectedScoreId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [studentKeyword, setStudentKeyword] = useState("");
  const { isOpen: isCreateOpen, setOpen: setCreateOpen, close: closeCreate } = useOverlayState();
  const { isOpen: isDeleteOpen, setOpen: setDeleteOpen, close: closeDelete } = useOverlayState();

  // Fetch list of tests
  const { data: scoreSessions = [], isLoading: isLoadingScores, isError: isScoresError } = useClassScores(classId);

  // Fetch detail for selected test
  const { data: scoreDetail, isPending: isDetailPending, isError: isDetailError } = useScoreDetail(selectedScoreId);

  // Local editing state for student scores
  const [editedScores, setEditedScores] = useState<Record<string, { score: string; note: string }>>({});

  // Group scores by month-year
  const groupedMonths = useMemo(() => {
    const groups: Record<string, any[]> = {};
    scoreSessions.forEach((session) => {
      const date = new Date(session.testDateAt);
      if (isNaN(date.getTime())) return;
      const key = `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(session);
    });

    return Object.entries(groups).map(([key, tests]) => {
      // Calculate month average score
      const totalScore = tests.reduce((sum, test) => sum + test.averageScore, 0);
      const averageScore = tests.length > 0 ? totalScore / tests.length : 0;

      return {
        monthYear: key,
        label: `Tháng ${key}`,
        tests: tests.sort((a, b) => new Date(b.testDateAt).getTime() - new Date(a.testDateAt).getTime()),
        averageScore,
      } as GroupedScores;
    }).sort((a, b) => {
      const [mA, yA] = a.monthYear.split("/").map(Number);
      const [mB, yB] = b.monthYear.split("/").map(Number);
      return yB !== yA ? yB - yA : mB - mA; // descending month-year order
    });
  }, [scoreSessions]);

  // Initializing edit state
  useEffect(() => {
    if (scoreDetail?.scoreDetails) {
      const initial: Record<string, { score: string; note: string }> = {};
      scoreDetail.scoreDetails.forEach((s) => {
        initial[s.studentClassId] = {
          score: s.score !== undefined ? String(s.score) : "",
          note: s.note ?? "",
        };
      });
      setEditedScores(initial);
    }
  }, [scoreDetail]);

  const handleSelectScore = (id: string) => {
    if (isEditMode) {
      if (confirm("Bạn có các thay đổi chưa lưu, có chắc muốn rời đi?")) {
        setIsEditMode(false);
        setSelectedScoreId(id);
      }
    } else {
      setSelectedScoreId(id);
    }
  };

  const handleToggleEdit = () => {
    if (isEditMode) {
      setIsEditMode(false);
    } else {
      setIsEditMode(true);
    }
  };

  const handleEditChange = (studentClassId: string, field: "score" | "note", value: string) => {
    setEditedScores((prev) => ({
      ...prev,
      [studentClassId]: {
        ...prev[studentClassId],
        [field]: value,
      },
    }));
  };

  // Mutations
  const { mutate: updateMutate, isPending: isSaving } = useUpdateScoreDetail(
    () => {
      setIsEditMode(false);
    },
    selectedScoreId,
    classId
  );

  const { mutate: deleteMutate, isPending: isDeleting } = useDeleteScore(() => {
    setSelectedScoreId(null);
    closeDelete();
  }, classId);

  const handleSaveEdit = () => {
    if (!selectedScoreId) return;

    const scoreReqList = Object.entries(editedScores).map(([studentClassId, val]) => {
      const normalizedScore = val.score.replace(",", ".");
      const scoreVal = Number(normalizedScore);
      return {
        studentClassId,
        score: isNaN(scoreVal) || !val.score ? 0 : scoreVal,
        note: val.note || null,
      };
    });

    updateMutate({
      id: selectedScoreId,
      scoreReqList,
    });
  };

  const handleDeleteConfirm = () => {
    if (selectedScoreId) {
      deleteMutate(selectedScoreId);
    }
  };

  const filteredDetails = useMemo(() => {
    const roster = scoreDetail?.scoreDetails ?? [];
    const keyword = studentKeyword.trim().toLowerCase();
    if (!keyword) return roster;

    return roster.filter((student) => {
      return (
        student.name.toLowerCase().includes(keyword) ||
        student.id.toLowerCase().includes(keyword)
      );
    });
  }, [scoreDetail, studentKeyword]);

  const getScoreColor = (score: number) => {
    if (score >= 8.0) return "success";
    if (score >= 5.0) return "warning";
    return "danger";
  };

  const getStudentInitials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "HS";

  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Left Column: Monthly aggregations and Test list */}
      <div className="xl:col-span-4 space-y-4 self-start sticky top-5">
        <div className="rounded-2xl border border-divider bg-background p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold">Điểm kiểm tra</h2>
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-1"
              onPress={() => setCreateOpen(true)}
            >
              <FaPlus className="h-3 w-3" />
              Tạo điểm kiểm tra
            </Button>
          </div>

          <div className={`space-y-4 max-h-[80vh] overflow-y-auto pr-1 ${styles.scrollable}`}>
            {isLoadingScores ? (
              <div className="space-y-3">
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
              </div>
            ) : groupedMonths.length === 0 ? (
              <p className="text-sm text-muted py-4 text-center">Chưa có điểm kiểm tra nào.</p>
            ) : (
              <Accordion variant="surface" className="w-full transition-all duration-100 rounded-xl overflow-hidden">
                {groupedMonths.map((group) => (
                  <Accordion.Item
                    id={group.monthYear}
                    key={group.monthYear}
                    className="border-none"
                  >
                    <Accordion.Heading>
                      <Accordion.Trigger className="w-full flex items-center justify-between py-3 px-4 m-0 rounded-xl transition-colors aria-[expanded=false]:hover:bg-gray-200 dark:aria-[expanded=false]:hover:bg-zinc-800">
                        <div className="flex flex-col gap-1 text-left">
                          <span className="font-semibold text-sm">{group.label}</span>
                          <span className="text-xs text-muted">
                            {group.tests.length} bài kiểm tra · TB tháng: {group.averageScore.toFixed(2)}
                          </span>
                        </div>
                        <Accordion.Indicator>
                          <FaChevronDown />
                        </Accordion.Indicator>
                      </Accordion.Trigger>
                    </Accordion.Heading>
                    <Accordion.Panel>
                      <Accordion.Body className="px-4 py-2 flex flex-col gap-2">
                        {group.tests.map((test) => {
                          const isSelected = selectedScoreId === test.id;
                          const scoreTone = getScoreColor(test.averageScore);
                          return (
                            <button
                              key={test.id}
                              type="button"
                              onClick={() => handleSelectScore(test.id)}
                              className={`w-full text-left rounded-xl border border-divider p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${isSelected
                                ? "border-primary/60 bg-primary/5 shadow-sm ring-1 ring-primary/20"
                                : "bg-background hover:bg-muted/10"
                                }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <p className="text-xs font-semibold">
                                    Ngày {formatDateOnly(test.testDateAt)}
                                  </p>
                                  <p className="text-[10px] text-muted mt-0.5">
                                    Cập nhật: {test.modifiedAt ? formatDateOnly(test.modifiedAt) : formatDateOnly(test.createdAt)}
                                  </p>
                                </div>
                                <Chip size="sm" color={scoreTone} variant="soft">
                                  TB: {test.averageScore.toFixed(2)}
                                </Chip>
                              </div>
                            </button>
                          );
                        })}
                      </Accordion.Body>
                    </Accordion.Panel>
                  </Accordion.Item>
                ))}
              </Accordion>
            )}
            {isScoresError && (
              <p className="text-xs text-danger text-center">Không thể tải danh sách điểm kiểm tra.</p>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Detailed student score table */}
      <div className="xl:col-span-8 space-y-4 h-full flex flex-col">
        {!selectedScoreId ? (
          <div className="flex-1 flex flex-col justify-center items-center gap-2 text-muted border border-dashed border-divider rounded-2xl min-h-[50vh] p-8 bg-background">
            <p className="text-lg font-medium">Chi tiết điểm kiểm tra</p>
            <p className="text-sm text-muted">Chọn một điểm kiểm tra ở cột trái để xem điểm số chi tiết của cả lớp.</p>
          </div>
        ) : isDetailPending ? (
          <div className="rounded-2xl border border-divider bg-background p-6 shadow-sm space-y-4">
            <Skeleton className="h-12 w-1/3 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        ) : isDetailError || !scoreDetail ? (
          <div className="rounded-2xl border border-divider bg-background p-6 shadow-sm text-center text-danger">
            Không thể tải thông tin chi tiết điểm kiểm tra.
          </div>
        ) : (
          <div className="rounded-2xl border border-divider bg-background p-6 shadow-sm space-y-4">
            {/* Session Summary Header Card */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-divider pb-4">
              <div>
                <h2 className="text-xl font-bold">
                  Điểm kiểm tra ngày {formatDateOnly(scoreDetail.testDateAt)}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-muted">Điểm trung bình lớp</p>
                  <p className="text-xl font-bold text-primary">
                    {(
                      scoreDetail.scoreDetails.reduce((s, x) => s + x.score, 0) /
                      (scoreDetail.scoreDetails.length || 1)
                    ).toFixed(2)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={isEditMode ? "primary" : "secondary"}
                    onPress={handleToggleEdit}
                    isDisabled={isSaving}
                    className="flex items-center gap-1"
                  >
                    <FaEdit className="h-3.5 w-3.5" />
                    {isEditMode ? "Hủy sửa" : "Sửa điểm"}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onPress={() => setDeleteOpen(true)}
                    isDisabled={isDeleting}
                    className="flex items-center gap-1"
                  >
                    <FaTrash className="h-3.5 w-3.5" />
                    Xóa
                  </Button>
                </div>
              </div>
            </div>

            {/* Filter and Save Button bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Input
                aria-label="Tìm học sinh"
                placeholder="Tìm theo tên học sinh, mã học sinh..."
                value={studentKeyword}
                onChange={(e) => setStudentKeyword(e.target.value)}
                className="max-w-md"
              />
              {isEditMode && (
                <Button
                  variant="primary"
                  className="flex items-center gap-1"
                  onPress={handleSaveEdit}
                  isPending={isSaving}
                >
                  Lưu thay đổi
                </Button>
              )}
            </div>

            {/* Student Scores Roster Grid */}
            <div className="border border-divider rounded-2xl overflow-hidden mt-4">
              {filteredDetails.length === 0 ? (
                <div className="text-center text-muted py-8 text-sm">
                  Không tìm thấy học sinh phù hợp.
                </div>
              ) : (
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-divider bg-muted/30 text-muted font-semibold">
                      <th className="p-4">Học sinh</th>
                      <th className="p-4 w-32">Điểm số</th>
                      <th className="p-4">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDetails.map((student) => {
                      const scoreVal = isEditMode
                        ? Number(editedScores[student.studentClassId]?.score)
                        : student.score;
                      const scoreColor = getScoreColor(isNaN(scoreVal) ? 0 : scoreVal);

                      return (
                        <tr
                          key={student.studentClassId}
                          className="border-b border-divider last:border-0 hover:bg-muted/5 transition-colors"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar size="sm">
                                <Avatar.Fallback className="border-none bg-gradient-to-br from-[#00b4d8] to-[#90e0ef] text-white">
                                  {getStudentInitials(student.name)}
                                </Avatar.Fallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-foreground">{student.name}</p>
                                <p className="text-xs text-muted">{student.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            {isEditMode ? (
                              <Input
                                type="text"
                                inputMode="decimal"
                                placeholder="0"
                                value={editedScores[student.studentClassId]?.score ?? ""}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9.,]/g, "");
                                  handleEditChange(student.studentClassId, "score", val);
                                }}
                                className="w-24"
                              />
                            ) : (
                              <Chip color={scoreColor} variant="soft" className="font-semibold">
                                {student.score.toFixed(2)}
                              </Chip>
                            )}
                          </td>
                          <td className="p-4">
                            {isEditMode ? (
                              <Input
                                type="text"
                                placeholder="Không có ghi chú"
                                value={editedScores[student.studentClassId]?.note ?? ""}
                                onChange={(e) =>
                                  handleEditChange(student.studentClassId, "note", e.target.value)
                                }
                                className="w-full max-w-xs"
                              />
                            ) : (
                              <p className="text-muted text-sm">{student.note || "-"}</p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateScoreModal
        isOpen={isCreateOpen}
        handleOpenChange={setCreateOpen}
        handleCloseModal={closeCreate}
        classId={classId}
      />

      {/* Delete Confirmation Modal */}
      <Modal>
        <Modal.Backdrop isOpen={isDeleteOpen} onOpenChange={setDeleteOpen}>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Xác nhận xóa</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="py-2 text-md">
                Bạn có chắc chắn muốn xóa điểm kiểm tra này? Hành động này sẽ xóa vĩnh viễn tất cả điểm số của học sinh trong điểm kiểm tra này và không thể hoàn tác.
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" onPress={closeDelete}>
                  Hủy
                </Button>
                <Button variant="danger" onPress={handleDeleteConfirm} isPending={isDeleting}>
                  Xác nhận xóa
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </section>
  );
}
