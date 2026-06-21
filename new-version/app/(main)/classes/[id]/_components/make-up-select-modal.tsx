import { Button, Modal } from "@heroui/react";
import { useState } from "react";

type MakeUpSelectModalProp = {
    isOpen: boolean;
    handleOpenChange: (isOpen: boolean) => void;
    handleCloseModal: () => void;
    classId: string;
    studentClassId: string;
}

export default function MakeUpSelectModal({ classId, studentClassId, isOpen, handleOpenChange, handleCloseModal }: MakeUpSelectModalProp) {

    return (
        <Modal>
            <Modal.Backdrop isOpen={isOpen} onOpenChange={handleOpenChange}>
                <Modal.Container size="cover">
                    <Modal.Dialog>
                        <Modal.Header>
                            <Modal.Heading>Tạo điểm kiểm tra mới</Modal.Heading>
                        </Modal.Header>
                        <Modal.Body className="px-2">

                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="ghost" onPress={handleCloseModal}>
                                Hủy
                            </Button>
                            {/* <Button
                        variant="primary"
                        isDisabled={!testDate || isPending || isLoadingStudents}
                        onPress={handleSubmit}
                      >
                        {isPending ? <Spinner size="sm" /> : "Tạo điểm kiểm tra"}
                      </Button> */}
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}