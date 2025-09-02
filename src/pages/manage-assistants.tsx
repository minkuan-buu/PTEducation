import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import { useEffect, useState } from "react";
import {
    ADDMANAGERS,
    GETMANAGERS,
    DEACTIVATEMANAGERS,
    REACTIVATEMANAGERS,
    GETTEMPLATEIMPORTMANAGER,
} from "../api/api";
import { Button, CalendarDate, DatePicker, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Pagination, Popover, PopoverContent, PopoverTrigger, RadioGroup, Radio, Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tooltip, useDisclosure } from "@heroui/react";
import { useLocation, useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { Field, useFormik } from "formik";
import { DeleteIcon, EditIcon, SearchIcon } from "@/components/icons";
import { MdOutlineFilterList, MdOutlineRestore } from "react-icons/md";
import { DateTime } from 'luxon';
import { format, set } from "date-fns";
import { MdOutlineSettingsBackupRestore } from "react-icons/md";
import { Workbook } from 'exceljs';
import { Logout } from "../pages/logout";
import { FaTrash, FaUserTimes } from "react-icons/fa";
import { GrStatusDisabledSmall } from "react-icons/gr";

export default function ManageAssistantsPage() {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [rawData, setRawData] = useState({});
    const [assistants, setAssistants] = useState([]);
    const location = useLocation();
    const filterParams = new URLSearchParams(location.search);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isFilter, setIsFilter] = useState(false);
    const navigate = useNavigate();
    const [handling, setHandling] = useState(false);
    const [loadForm, setloadForm] = useState(false);
    const [tableData, setTableData] = useState([]);
    const [selected, setSelected] = useState("personal");

    useEffect(() => {
        if (localStorage.getItem("role") !== "Admin" && localStorage.getItem("role") !== "Manager") {
            window.location.href = "/";
        }
    }, []);

    // Hàm xử lý sắp xếp
    const sortedAssistants = [...assistants].sort((a, b) => {
        if (sortConfig.key) {
            const sortOrder = sortConfig.direction === 'ascending' ? 1 : -1;

            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (typeof aValue === "string" && typeof bValue === "string") {
                return aValue.localeCompare(bValue, 'vi', { sensitivity: 'base' }) * sortOrder;
            }

            if (aValue < bValue) return -1 * sortOrder;
            if (aValue > bValue) return 1 * sortOrder;
            return 0;
        }
        return 0;
    });

    // Hàm thay đổi cột sắp xếp và thứ tự sắp xếp
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const formikAddManager = useFormik({
        initialValues: {
            "name": "",
            "email": "",
            "phone": ""
        },
        validationSchema: Yup.object({
            // id: Yup.string().required("Required"),
            // defaultPassword: Yup.string(),
            // studentId: Yup.string().required("Required"),
            // studentName: Yup.string().required("Required"),
            // studentEmail: Yup.string().email("Invalid email").required("Required"),
            // studentPhone: Yup.string(),
        }),
        onSubmit: async (values) => {
            setHandling(true);
            var token = localStorage.getItem("token");
            var body = [];
            if (selected === "list") {
                tableData.forEach((user) => {
                    var student = {
                        name: user.name,
                        email: user.email,
                        phone: user.phone.toString().length > 0 ? user.phone.toString() : "-",
                    };
                    body.push(student);
                });
            } else {
                var user = {
                    name: formikAddManager.values.name,
                    email: formikAddManager.values.email,
                    phone: formikAddManager.values.phone.toString().length > 0 ? formikAddManager.values.phone.toString() : "-",
                };
                body.push(user);
            }
            try {
                const { isSuccess, res } = await ADDMANAGERS(token, body);

                if (!isSuccess) {
                    if (res.status === 401) {
                        Logout();
                    }
                    let result = await res.json();
                    alert(result.message);
                } else {
                    CloseModal();
                    setloadForm(false);
                    setIsLoading(true);
                    let result = await res.json();
                    alert(result.message);
                }
            } catch (error) {
                console.log(error);
            } finally {
                setHandling(false);
            }
        },
    });

    const formikFilter = useFormik({
        initialValues: {
            StartAt: filterParams.get("StartAt") || "",
        },
        validationSchema: Yup.object().shape({
            StartAt: Yup.date().nullable(),
        }),
        onSubmit: async (values) => {
            for (const param in values) {
                if (values[param]) {
                    // Kiểm tra giá trị filterParams[param] có tồn tại không
                    filterParams.set(param, values[param]);
                } else {
                    filterParams.delete(param);
                }
            }
            if (Object.keys(filterParams.toString()).length === 0) {
                filterParams.forEach((value, key) => {
                    filterParams.delete(key);
                });
                formikFilter.setFieldValue("StartAt", "");
                setIsFilter(false);
                setCurrentPage(1);
                navigate(`${location.pathname}`);
            } else {
                navigate(`${location.pathname}?${filterParams.toString()}`);
                setIsLoading(true);
                setloadForm(false);
                setCurrentPage(1);
            }
        },
    });

    document.title = "Quản lý lớp học";

    useEffect(() => {
        let request = "";
        if (Object.keys(filterParams.toString()).length !== 0) {
            request = filterParams.toString() + `&pageIndex=${currentPage}`;
        } else {
            request = `pageIndex=${currentPage}`;
        }
        var token = localStorage.getItem("token");
        const fetchData = async () => {
            try {
                const { isSuccess, res } = await GETMANAGERS(token, request);
                if (!isSuccess) {
                    if (res.status === 401) {
                        Logout();
                    }
                    let result = await res.json();
                    alert(result.message);
                } else {
                    let result = await res.json();
                    setloadForm(true);
                    setAssistants(result.data);
                    setRawData(result);
                }
            }
            catch (error) {
                console.log(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [loadForm, filterParams.toString(), currentPage, isLoading]);

    // Hàm xử lý khi click vào một hàng
    const handleRowClick = (id) => {
        if (!handling) {
            // window.location.href = `/class/${id}`;
            navigate(`/class/${id}`);
        }
    };

    // Định dạng ngày theo định dạng 'dd/MM/yyyy'
    const formatDate = (date: Date): string => {
        return format(date, 'dd/MM/yyyy, HH:mm');
    };

    function handleDeactive(id: string) {
        setHandling(true);
        var token = localStorage.getItem("token");
        const fetchData = async () => {
            try {
                const { isSuccess, res } = await DEACTIVATEMANAGERS(token, id);

                if (!isSuccess) {
                    if (res.status === 401) {
                        Logout();
                    }
                    let result = await res.json();

                    alert(result.message);
                } else {
                    let result = await res.json();

                }
            } catch (error) {
                console.log(error);
            } finally {
                setloadForm(false);
                setIsLoading(true);
                setHandling(false);
            }
        };
        fetchData();
    }

    function handleReactive(id: string) {
        setHandling(true);
        var token = localStorage.getItem("token");
        const fetchData = async () => {
            try {
                const { isSuccess, res } = await REACTIVATEMANAGERS(token, id);

                if (!isSuccess) {
                    if (res.status === 401) {
                        Logout();
                    }
                    let result = await res.json();

                    alert(result.message);
                } else {
                    let result = await res.json();

                }
            } catch (error) {
                console.log(error);
            } finally {
                setloadForm(false);
                setIsLoading(true);
                setHandling(false);
            }
        };
        fetchData();
    }

    function handleDownloadTemplate() {
        var token = localStorage.getItem("token");
        const fetchData = async () => {
            try {
                const { isSuccess, res } = await GETTEMPLATEIMPORTMANAGER(token);

                if (!isSuccess) {
                    if (res.status === 401) {
                        Logout();
                    }
                    let result = await res.json();

                    alert(result.message);
                } else {
                    let result = await res.blob();
                    // Bước 2: Tạo URL cho Blob
                    const blobUrl = URL.createObjectURL(result);
                    // Bước 3: Tạo link và kích hoạt tải xuống
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.download = 'ImportManagers'; // Đặt tên file cho file tải xuống
                    link.click();

                    // Giải phóng URL tạm thời
                    URL.revokeObjectURL(blobUrl);
                }
            } catch (error) {
                console.log(error);
            }
        };
        fetchData();
    }

    function CloseModal() {
        onOpenChange();
        formikAddManager.resetForm();
        setTableData([]);
        setSelected("personal");
        setFile(null);
    }

    const [file, setFile] = useState < File | null > (null);

    const clearFileInput = () => {
        setFile(null);
        setTableData([]);
        const fileInput = document.getElementById("fileUpload") as HTMLInputElement;
        if (fileInput) {
            fileInput.value = ""; // reset giá trị input file
        }
    };

    const handleFileAddAssistantsUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = event.target.files?.[0];
        setTableData([]);

        if (!uploadedFile) return;

        setFile(uploadedFile);

        const reader = new FileReader();
        reader.onload = async (e: ProgressEvent<FileReader>) => {
            const arrayBuffer = e.target?.result as ArrayBuffer;

            const workbook = new Workbook();
            await workbook.xlsx.load(arrayBuffer);

            const worksheet = workbook.getWorksheet("ImportManagers");

            if (!worksheet) {
                console.error('Worksheet "ImportManagers" không tồn tại.');
                return;
            }

            const jsonData: any[] = [];
            let headers: string[] = [];

            worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
                if (rowNumber === 1) {
                    headers = row.values.slice(1).map(header => header?.toString().toLowerCase()) as string[];
                } else {
                    const rowData: any = {};
                    const rowValues = row.values.slice(1);

                    headers.forEach((header, index) => {
                        const cell = row.getCell(index + 1);

                        if (cell && typeof cell === "object" && "text" in cell) {
                            // Nếu là object có text
                            rowData[header] = cell.text;
                        } else if (typeof rowValues[index] === "object" && rowValues[index]?.text) {
                            // fallback trường hợp rowValues có object
                            rowData[header] = rowValues[index].text;
                        } else {
                            // số hoặc chuỗi
                            rowData[header] = rowValues[index] ?? null;
                        }
                    });


                    jsonData.push(rowData);
                }
            });

            console.log(jsonData);
            setTableData(jsonData);
        };

        reader.readAsArrayBuffer(uploadedFile);
    };


    return (
        <DefaultLayout>
            <section className="flex flex-col gap-4 py-8 md:py-10">
                <div className="inline-block">
                    <div className="flex justify-between items-center">
                        <h3 className={title()}>Danh sách trợ giảng</h3>
                        <Modal
                            isDismissable={false}
                            isKeyboardDismissDisabled={true}
                            isOpen={isOpen}
                            onOpenChange={CloseModal}
                            size="4xl"
                        >
                            <ModalContent
                                className="max-h-screen overflow-auto">
                                {(onClose) => (
                                    <>
                                        <ModalHeader>Thêm trợ giảng</ModalHeader>
                                        <form onSubmit={formikAddManager.handleSubmit}>
                                            <ModalBody>
                                                <RadioGroup className="my-4" label="Chọn kiểu thêm" orientation="horizontal" value={selected} onValueChange={setSelected}>
                                                    <Radio value="personal">Cá nhân</Radio>
                                                    <Radio value="list">Danh sách</Radio>
                                                </RadioGroup>
                                                {selected === "list" ? (
                                                    <>
                                                        <div className="flex justify-between gap-1 min-w-full mt-3">
                                                            <Button
                                                                color="success"
                                                                variant="bordered"
                                                                style={{ width: "420px" }}
                                                                onPress={() => handleDownloadTemplate()}
                                                            >
                                                                Tải mẫu nhập dữ liệu
                                                            </Button>

                                                            <Input
                                                                id="fileUpload"
                                                                color="primary"
                                                                variant="bordered"
                                                                type="file"
                                                                accept=".xlsx"
                                                                style={{ width: "420px" }}
                                                                onChange={handleFileAddAssistantsUpload}
                                                            />

                                                            {file && (
                                                                <Button
                                                                    color="danger"
                                                                    variant="bordered"
                                                                    style={{ width: "50px" }}
                                                                    onPress={clearFileInput}
                                                                >
                                                                    <FaTrash />
                                                                </Button>
                                                            )}
                                                        </div>
                                                        <Table selectionMode="multiple" selectionBehavior="replace" aria-label="Example table with dynamic content" className="mt-7 max-h-[300px]" fullWidth>
                                                            <TableHeader>
                                                                <TableColumn key="1" width="70px">No.</TableColumn>
                                                                <TableColumn key="2" width="300px" allowsSorting onClick={() => requestSort('name')}>
                                                                    Tên
                                                                    {sortConfig.key === 'totalStudent' && (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼')}
                                                                </TableColumn>
                                                                <TableColumn key="3" width="300px">Email</TableColumn>
                                                                <TableColumn key="4" width="300px">Số điện thoại</TableColumn>
                                                                <TableColumn key="5" width="200px">Hành động</TableColumn>
                                                            </TableHeader>
                                                            <TableBody items={tableData} emptyContent={"Chưa có dữ liệu"}>
                                                                {tableData.map((row, index) => (
                                                                    <TableRow key={index}>
                                                                        <TableCell>{index + 1}</TableCell>
                                                                        <TableCell>{row.name}</TableCell>
                                                                        <TableCell>{row.email}</TableCell>
                                                                        <TableCell>{row.phone}</TableCell>
                                                                        <TableCell>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col gap-4">
                                                        <Input
                                                            name="name"
                                                            type="text"
                                                            label="Tên trợ giảng"
                                                            placeholder="Nhập tên trợ giảng"
                                                            value={formikAddManager.values.name}
                                                            onChange={formikAddManager.handleChange}
                                                            required
                                                        />
                                                        <Input
                                                            name="email"
                                                            type="text"
                                                            label="Email trợ giảng"
                                                            placeholder="Nhập email trợ giảng"
                                                            value={formikAddManager.values.email}
                                                            onChange={formikAddManager.handleChange}
                                                            required
                                                        />
                                                        <Input
                                                            name="phone"
                                                            type="text"
                                                            label="Số điện thoại"
                                                            placeholder="Nhập số điện thoại"
                                                            value={formikAddManager.values.phone}
                                                            onChange={formikAddManager.handleChange}
                                                        />
                                                    </div>
                                                )}
                                            </ModalBody>
                                            <ModalFooter>
                                                <Button fullWidth id="send-code-button" color="primary" type="submit" isLoading={handling} style={{ marginTop: "2vh", marginBottom: "2vh" }}>
                                                    Thêm
                                                </Button>
                                            </ModalFooter>
                                        </form>
                                    </>
                                )}
                            </ModalContent>
                        </Modal>
                        <Button className="text-md" color="success" variant="bordered" onPress={onOpen}>
                            Thêm trợ giảng
                        </Button>
                    </div>
                    <div>
                        <form onSubmit={formikFilter.handleSubmit} className="mt-10">
                            <Input
                                name="Keyword"
                                type="text"
                                placeholder="Tìm kiếm..."
                                value={formikFilter.values.Keyword}
                                onChange={formikFilter.handleChange}
                                size="md"
                                endContent={<SearchIcon />}
                            />
                        </form>
                    </div>
                    <div className="flex justify-center items-center">
                        <Table
                            selectionMode="multiple"
                            selectionBehavior="replace"
                            aria-label="Example table with dynamic content"
                            className="mt-7"
                            fullWidth
                            bottomContent={
                                rawData && rawData.totalPages > 0 ? (
                                    <div className="flex w-full justify-center">
                                        <Pagination
                                            isCompact
                                            showControls
                                            showShadow
                                            color="primary"
                                            page={currentPage}
                                            total={rawData.totalPages}
                                            onChange={(page) => setCurrentPage(page)}
                                        />
                                    </div>
                                ) : null
                            }
                        >
                            <TableHeader>
                                <TableColumn key="1" width="70px">No.</TableColumn>
                                <TableColumn key="2" width="300px" allowsSorting onClick={() => requestSort('name')}>
                                    Tên
                                    {sortConfig.key === 'totalStudent' && (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼')}
                                </TableColumn>
                                <TableColumn key="3" width="300px">Email</TableColumn>
                                <TableColumn key="4" width="300px">Số điện thoại</TableColumn>
                                <TableColumn key="5" width="200px">Hành động</TableColumn>
                            </TableHeader>
                            <TableBody
                                items={sortedAssistants}
                                emptyContent={"Chưa có dữ liệu"}
                                loadingContent={
                                    isLoading ? (
                                        <div className="flex w-full justify-center">
                                            <Spinner color="white" />
                                        </div>
                                    ) : null
                                }
                                loadingState={isLoading ? "loading" : "idle"}
                            >
                                {sortedAssistants.map((row, index) => (
                                    <TableRow key={row.id}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{row.name}</TableCell>
                                        <TableCell>{row.email}</TableCell>
                                        <TableCell>{row.phone}</TableCell>
                                        <TableCell>
                                            {row.status === "Active" ? (
                                                <Button className="mr-2 text-white text-lg" color="danger" onClick={() => handleDeactive(row.id)}><FaUserTimes /></Button>
                                            ) : (
                                                <Button className="mr-2 text-white text-lg" color="warning" onClick={() => handleReactive(row.id)}><MdOutlineRestore /></Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </section>
        </DefaultLayout>
    );
}
