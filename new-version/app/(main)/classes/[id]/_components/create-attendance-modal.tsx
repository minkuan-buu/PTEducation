import { Modal, Button } from "@heroui/react";

const CreateAttendanceModal = () => {
  return (
    <Modal>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={handleOpenChange}>
        <Modal.Container size="lg">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Chỉnh sửa lịch học</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="px-2">
              <div className="mt-4 flex flex-col gap-4"></div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="ghost" onPress={handleCloseModal}>
                Hủy
              </Button>
              <Button variant="primary">Chỉnh sửa</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};

export default CreateAttendanceModal;
