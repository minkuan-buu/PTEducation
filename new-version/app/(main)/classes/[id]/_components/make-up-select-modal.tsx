import React, { useEffect, useState } from "react";
import { useGetAbsentSessions } from "@/hooks/classes/attendance/use-get-absent-sessions";
import { Button, ListBox, Modal, Select, Spinner } from "@heroui/react";
import { useTheme } from "next-themes";
import { useCheckAttendance } from "@/hooks/classes/attendance/use-check-attendance";

type MakeUpSelectModalProp = {
    isOpen: boolean;
    handleOpenChange: (isOpen: boolean) => void;
    handleCloseModal: () => void;
    classId: string;
    studentClassId: string | null;
    attendanceId: string | null;
}

function MakeUpSelectModal({ classId, studentClassId, attendanceId, isOpen, handleOpenChange, handleCloseModal }: MakeUpSelectModalProp) {
    // Only enable query and fetch when the modal is open
    const { data: absentSessions, isPending } = useGetAbsentSessions(
        isOpen ? (studentClassId || "") : "",
        isOpen ? classId : ""
    );
    const { resolvedTheme } = useTheme();
    const [selectedMakeUpSession, setSelectedMakeUpSession] = useState<string>("");

    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen && absentSessions && absentSessions.length > 0) {
            setSelectedMakeUpSession(absentSessions[0].id);
        } else if (!isOpen) {
            setSelectedMakeUpSession("");
        }
    }, [isOpen, absentSessions]);

    const getInputVariant = (): "primary" | "secondary" | undefined => {
        return isMounted && resolvedTheme === "dark" ? "secondary" : undefined;
    };

    const { mutateAsync: checkAttendanceMutateAsync, isPending: isPendingCheckAttendance } = useCheckAttendance(
        attendanceId ?? "",
    );

    const handleCheckAttendanceMakeUp = async () => {
        if (!studentClassId) return;
        try {
            await checkAttendanceMutateAsync({
                studentClassId,
                makeUpSessionId: selectedMakeUpSession
            });
            handleCloseModal();
        } catch (error) {
            console.error("Failed to check makeup attendance:", error);
        }
    };

    return (
        <Modal>
            <Modal.Backdrop isOpen={isOpen} onOpenChange={handleOpenChange}>
                <Modal.Container size="lg">
                    <Modal.Dialog>
                        <Modal.Header>
                            <Modal.Heading>Chọn buổi học mà học sinh đã vắng mặt</Modal.Heading>
                        </Modal.Header>
                        <Modal.Body className="px-2 py-4">
                            {isPending && (
                                <div className="flex flex-col items-center justify-center h-20">
                                    <Spinner size="sm" />
                                    <span>Đang tải danh sách buổi học...</span>
                                </div>
                            )}
                            {!isPending && absentSessions?.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-20">
                                    <span>Không có buổi học nào để bù</span>
                                </div>
                            )}
                            {absentSessions?.length > 0 && (
                                <Select
                                    variant={getInputVariant()}
                                    id="class"
                                    className="w-full"
                                    placeholder="Chọn lớp học"
                                    value={selectedMakeUpSession}
                                    onChange={(value) => {
                                        if (value !== null) {
                                            setSelectedMakeUpSession(String(value));
                                        }
                                    }}
                                >
                                    <Select.Trigger>
                                        <Select.Value />
                                        <Select.Indicator />
                                    </Select.Trigger>
                                    <Select.Popover>
                                        <ListBox>
                                            {absentSessions.map((option) => (
                                                <ListBox.Item key={option.id} id={option.id} textValue={option.name}>
                                                    {option.name}
                                                    <ListBox.ItemIndicator />
                                                </ListBox.Item>
                                            ))}
                                        </ListBox>
                                    </Select.Popover>
                                </Select>
                            )}
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="ghost" onPress={handleCloseModal}>
                                Hủy
                            </Button>
                            <Button
                                variant="primary"
                                isDisabled={isPendingCheckAttendance || !selectedMakeUpSession}
                                onPress={handleCheckAttendanceMakeUp}
                            >
                                {isPendingCheckAttendance ? <Spinner size="sm" /> : "Xác nhận"}
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}

export default React.memo(MakeUpSelectModal);