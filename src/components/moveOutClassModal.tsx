import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { useEffect, useState } from "react";
import { GETLISTCLASSSELECT, MOVEOUTSTUDENT } from "../api/api";
import { useParams } from "react-router-dom";
import CustomSelect from "../components/custom-select"; // import custom select của bạn
import { Logout } from "@/pages/logout";

export function MoveOutClassModal({ isOpen, onOpenChange, studentId }) {
    const [classListSelect, setClassListSelect] = useState([]);
    const [onLoading, setOnLoading] = useState(false);
    const [selectedKeys, setSelectedKeys] = useState < Set < string >> (new Set());
    const { id } = useParams();

    useEffect(() => {
        if (isOpen) {
            const fetchClassSelectData = async (token) => {
                setOnLoading(true);
                try {
                    const { isSuccess, res } = await GETLISTCLASSSELECT(token, id);
                    if (!isSuccess) {
                        if (res.status === 401) {
                            Logout();
                        }
                        let result = await res.json();
                        alert(result.message);
                    } else {
                        let result = await res.json();
                        setClassListSelect(result.data || []);
                    }
                } catch (error) {
                    console.log(error);
                } finally {
                    setOnLoading(false);
                }
            };
            fetchClassSelectData(localStorage.getItem("token"));
        }
    }, [isOpen, id]);

    const handleMoveOut = async () => {
        const token = localStorage.getItem("token");
        const targetClassId = Array.from(selectedKeys)[0]; // lấy id lớp được chọn

        if (!targetClassId) {
            alert("Vui lòng chọn lớp để chuyển!");
            return;
        }

        try {
            const { isSuccess, res } = await MOVEOUTSTUDENT(token, { targetClassId, studentId });
            const result = await res.json();
            if (!isSuccess) {
                if (res.status === 401) {
                    Logout();
                }
                alert(result.message);
            } else {
                alert(result.message);
                onOpenChange();
            }
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <Modal isOpen={isOpen} size="xl" onOpenChange={onOpenChange}>
            <ModalContent className="h-fit overflow-auto">
                {(onClose) => (
                    <>
                        <ModalHeader>Chuyển lớp</ModalHeader>
                        <ModalBody>
                            <CustomSelect
                                label="Chọn lớp để chuyển"
                                placeholder="Chọn lớp"
                                options={classListSelect.map((item) => ({
                                    id: item.id,
                                    name: item.name
                                }))}
                                selectedKeys={selectedKeys}
                                onSelectionChange={setSelectedKeys}
                            />
                        </ModalBody>
                        <ModalFooter>
                            <Button onClick={onClose}>Hủy</Button>
                            <Button color="danger" onClick={handleMoveOut} isDisabled={onLoading}>
                                {onLoading ? "Đang xử lý..." : "Chuyển lớp"}
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
