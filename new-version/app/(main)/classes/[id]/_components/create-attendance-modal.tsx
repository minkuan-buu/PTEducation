import React, { useEffect, useState } from "react";

import { Button, Input, ListBox, Modal, Select } from "@heroui/react";
import { useCreateAttendance } from "@/hooks/classes/attendance/use-create-attendance";
import { useUpdateAttendanceSession } from "@/hooks/classes/attendance/use-update-attendance-session";

type AttendanceSessionType = "Adhoc" | "Makeup" | "Fixed";

type CreateAttendanceModalProps = {
  data: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    sessionType: AttendanceSessionType;
    note: string;
  } | null;
  isOpen: boolean;
  handleOpenChange: (isOpen: boolean) => void;
  handleCloseModal: () => void;
  defaultDate?: string;
  classId: string;
};

type AttendanceFormState = {
  date: string;
  startTime: string;
  endTime: string;
  sessionType: AttendanceSessionType;
  note: string;
};

const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const createInitialForm = (defaultDate?: string): AttendanceFormState => ({
  date: defaultDate ?? getTodayDate(),
  startTime: "",
  endTime: "",
  sessionType: "Adhoc",
  note: "",
});

const isEndTimeAfterStartTime = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) {
    return true;
  }

  return endTime > startTime;
};

const CreateAttendanceModal = ({
  data,
  isOpen,
  handleOpenChange,
  handleCloseModal,
  defaultDate,
  classId,
}: CreateAttendanceModalProps) => {
  const [form, setForm] = useState<AttendanceFormState>(() =>
    data != null
      ? {
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        sessionType: data.sessionType,
        note: data.note,
      }
      : createInitialForm(defaultDate)
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (data != null) {
      setForm({
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        sessionType: data.sessionType,
        note: data.note || "",
      });
    } else {
      setForm(createInitialForm(defaultDate));
    }
  }, [data, defaultDate, isOpen]);

  useEffect(() => {
    if (form.sessionType === "Makeup") {
      return;
    }

    if (form.note) {
      setForm((current) => ({ ...current, note: "" }));
    }
  }, [form.note, form.sessionType]);

  const updateField = <K extends keyof AttendanceFormState>(
    field: K,
    value: AttendanceFormState[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const { mutate: createMutate, isPending: isCreating } = useCreateAttendance(
    () => handleSuccess(),
    classId,
  );

  const { mutate: updateMutate, isPending: isUpdating } = useUpdateAttendanceSession(
    () => handleSuccess(),
    classId,
  );

  const isPending = isCreating || isUpdating;

  const handleSubmit = () => {
    if (!form.date || !form.startTime || !form.endTime) {
      alert("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    if (!isEndTimeAfterStartTime(form.startTime, form.endTime)) {
      alert("Giờ kết thúc phải sau giờ bắt đầu.");
      return;
    }

    if (form.sessionType === "Makeup" && !form.note) {
      alert("Vui lòng nhập note cho buổi học bù.");
      return;
    }

    try {
      if (data != null) {
        updateMutate({
          id: data.id,
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          sessionType: form.sessionType,
          note: form.note,
        });
      } else {
        createMutate({
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          sessionType: form.sessionType,
          note: form.note,
        });
      }
    } catch (error) {
      console.error("Failed to submit attendance session:", error);
    }
  };

  const handleSuccess = () => {
    handleCloseModal();
    setForm(createInitialForm(defaultDate));
  };

  const isEndTimeValid = isEndTimeAfterStartTime(form.startTime, form.endTime);

  return (
    <Modal>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={handleOpenChange}>
        <Modal.Container size="lg">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>{data != null ? "Chỉnh sửa buổi học" : "Tạo buổi học mới"}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="px-2">
              <form
                className="my-4 flex flex-col gap-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSubmit();
                }}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
                    Ngày
                    <Input
                      className="rounded-xl border border-divider bg-background px-3 text-sm outline-none transition-colors focus:border-primary"
                      type="date"
                      placeholder="Ngày bắt đầu"
                      value={form.date}
                      onChange={(e) => updateField("date", e.target.value)}
                    />
                    {/* <input
                      className="h-11 rounded-xl border border-divider bg-background px-3 text-sm outline-none transition-colors focus:border-primary"
                      type="date"
                      value={form.date}
                      onChange={(event) =>
                        updateField("date", event.target.value)
                      }
                    /> */}
                  </label>

                  <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
                    Loại buổi học
                    <Select
                      className="w-full"
                      placeholder="Chọn loại buổi học"
                      value={form.sessionType}
                      onChange={(value) => {
                        if (value !== null) {
                          updateField(
                            "sessionType",
                            String(value) as AttendanceSessionType,
                          );
                        }
                      }}
                    >
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          <ListBox.Item id="Adhoc" textValue="Bổ sung">
                            Bổ sung
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                          <ListBox.Item id="Makeup" textValue="Bù">
                            Bù
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                          {form.sessionType === "Fixed" && (
                            <ListBox.Item id="Fixed" textValue="Cố định">
                              Cố định
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          )}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </label>

                  <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
                    Giờ bắt đầu
                    <Input
                      className="w-full rounded-lg border border-divider bg-background px-3 py-2 text-sm"
                      type="time"
                      value={form.startTime}
                      onChange={(event) =>
                        updateField("startTime", event.target.value)
                      }
                    />
                  </label>

                  <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
                    Giờ kết thúc
                    <Input
                      className="w-full rounded-lg border border-divider bg-background px-3 py-2 text-sm"
                      type="time"
                      min={form.startTime || undefined}
                      value={form.endTime}
                      onChange={(event) =>
                        updateField("endTime", event.target.value)
                      }
                    />
                    {!isEndTimeValid ? (
                      <span className="text-xs font-normal text-danger">
                        Giờ kết thúc phải sau giờ bắt đầu.
                      </span>
                    ) : null}
                  </label>
                </div>

                {form.sessionType === "Makeup" ? (
                  <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
                    Note
                    <Input
                      className="h-11 rounded-xl border border-divider bg-background px-3 text-sm outline-none transition-colors focus:border-primary"
                      type="date"
                      value={form.note}
                      onChange={(event) =>
                        updateField("note", event.target.value)
                      }
                    />
                    {/* <span className="text-xs font-normal text-muted">
                      Chỉ hiển thị khi chọn Makeup.
                    </span> */}
                  </label>
                ) : null}
              </form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="ghost" onPress={handleCloseModal}>
                Hủy
              </Button>
              <Button
                variant="primary"
                isDisabled={
                  !form.date ||
                  !form.startTime ||
                  !form.endTime ||
                  !isEndTimeValid ||
                  (form.sessionType === "Makeup" && !form.note) ||
                  isPending
                }
                onPress={handleSubmit}
              >
                {data != null ? "Cập nhật" : "Tạo buổi học"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};

export default React.memo(CreateAttendanceModal);
