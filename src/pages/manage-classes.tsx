import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import { useEffect, useState } from "react";
import {
  GETCLASSES,
  DELETECLASS,
  RESTORECLASS,
  CREATECLASS,
  GETTEMPLATEIMPORTSTUDENT,
} from "../api/api";
import { Button, CalendarDate, DatePicker, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Popover, PopoverContent, PopoverTrigger, Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tooltip, useDisclosure } from "@nextui-org/react";
import { useLocation, useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { Field, useFormik } from "formik";
import { DeleteIcon, EditIcon, SearchIcon } from "@/components/icons";
import { MdOutlineFilterList } from "react-icons/md";
import { DateTime } from 'luxon';
import { format, set } from "date-fns";
import { MdOutlineSettingsBackupRestore } from "react-icons/md";
import { Workbook } from 'exceljs';
import { Logout } from "../pages/logout";
import { FaTrash } from "react-icons/fa";

export default function ManageClassesPage() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [classes, setClasses] = useState([]);
  const location = useLocation();
  const filterParams = new URLSearchParams(location.search);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isFilter, setIsFilter] = useState(false);
  const navigate = useNavigate();
  const [handling, setHandling] = useState(false);
  const [loadForm, setloadForm] = useState(false);
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    if (localStorage.getItem("role") !== "Admin") {
      window.location.href = "/";
    }
  }, []);

  // Hàm xử lý sắp xếp
  const sortedClasses = [...classes].sort((a, b) => {
    if (sortConfig.key) {
      const sortOrder = sortConfig.direction === 'ascending' ? 1 : -1;
      if (a[sortConfig.key] < b[sortConfig.key]) return -1 * sortOrder;
      if (a[sortConfig.key] > b[sortConfig.key]) return 1 * sortOrder;
      return 0;
    }
    return 0; // Không sắp xếp nếu không có cột được chọn
  });
  // Hàm thay đổi cột sắp xếp và thứ tự sắp xếp
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const formikCreate = useFormik({
    initialValues: {
      name: "",
      startAt: "",
      endAt: "",
      defaultPassword: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Required"),
      startAt: Yup.date().required("Required"),
      endAt: Yup.date().required("Required"),
      defaultPassword: Yup.string(),
    }),
    onSubmit: async (values) => {
      setHandling(true);
      var token = localStorage.getItem("token");
      var body = {
        name: values.name,
        startAt: values.startAt,
        endAt: values.endAt,
        defaultPassword: values.defaultPassword.length > 0 ? values.defaultPassword : null,
        students: [],
      };

      tableData.forEach((studentData) => {
        var student = {
          id: `${studentData.id}`,
          name: studentData.name,
          email: studentData.email,
          phone: studentData.phone.toString().length > 0 ? studentData.phone.toString() : "-",
        };
        body.students.push(student);
      });
      try {
        const { isSuccess, res } = await CREATECLASS(token, body);

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
      request = filterParams.toString() + `&page=${currentPage}`;
    } else {
      request = `page=${currentPage}`;
    }
    var token = localStorage.getItem("token");
    const fetchData = async () => {
      try {
        const { isSuccess, res } = await GETCLASSES(token, request);
        if (!isSuccess) {
          if (res.status === 401) {
            Logout();
          }
          let result = await res.json();
          alert(result.message);
        } else {
          let result = await res.json();
          setloadForm(true);
          setClasses(result.data);
        }
      }
      catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, [loadForm, filterParams.toString(), currentPage, isLoading]);

  // Hàm xử lý khi click vào một hàng
  const handleRowClick = (id) => {
    if (!handling) {
      window.location.href = `/class/${id}`;
    }
  };

  // Định dạng ngày theo định dạng 'dd/MM/yyyy'
  const formatDate = (date: Date): string => {
    return format(date, 'dd/MM/yyyy, HH:mm');
  };

  function handleDelete(id: string) {
    setHandling(true);
    var token = localStorage.getItem("token");
    const fetchData = async () => {
      try {
        const { isSuccess, res } = await DELETECLASS(token, id);

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

  function handleRestore(id: string) {
    setHandling(true);
    var token = localStorage.getItem("token");
    const fetchData = async () => {
      try {
        const { isSuccess, res } = await RESTORECLASS(token, id);

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
        const { isSuccess, res } = await GETTEMPLATEIMPORTSTUDENT(token);

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
          link.download = 'ImportStudent'; // Đặt tên file cho file tải xuống
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
    formikCreate.resetForm();
    setTableData([]);
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    setTableData([]);

    if (!uploadedFile) return;

    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = async (e: ProgressEvent<FileReader>) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;

      const workbook = new Workbook();
      await workbook.xlsx.load(arrayBuffer);

      const worksheet = workbook.getWorksheet("ImportStudents");

      if (!worksheet) {
        console.error('Worksheet "ImportStudents" không tồn tại.');
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
            if (index === 2) {
              rowData[header] = row.getCell(index + 1).text;
            } else {
              rowData[header] = rowValues[index] || null;
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
            <h3 className={title()}>Danh sách lớp học</h3>
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
                    <ModalHeader>Tạo lớp học</ModalHeader>
                    <ModalBody>
                      <p>Tạo lớp học mới</p>
                      <form onSubmit={formikCreate.handleSubmit}>
                        <Input name="name" label="Tên lớp" value={formikCreate.values.name} onChange={formikCreate.handleChange} placeholder="Nhập tên lớp" />
                        {formikCreate.errors.name && formikCreate.touched.name && (
                          <p style={{ color: "red" }}>{formikCreate.errors.name}</p>
                        )}
                        <div className="flex justify-between gap-2">
                          <Input name="startAt" label="Ngày bắt đầu" type="date" value={formikCreate.values.startAt} onChange={formikCreate.handleChange} placeholder="Nhập ngày bắt đầu" className="mt-3" />
                          {formikCreate.errors.startAt && formikCreate.touched.startAt && (
                            <p style={{ color: "red" }}>{formikCreate.errors.startAt}</p>
                          )}
                          <Input name="endAt" label="Ngày kết thúc" type="date" value={formikCreate.values.endAt} onChange={formikCreate.handleChange} placeholder="Nhập ngày kết thúc" className="mt-3" />
                          {formikCreate.errors.endAt && formikCreate.touched.endAt && (
                            <p style={{ color: "red" }}>{formikCreate.errors.endAt}</p>
                          )}
                        </div>
                        <Input name="defaultPassword" label="Mật khẩu mặc định" type="password" value={formikCreate.values.defaultPassword} onChange={formikCreate.handleChange} placeholder="Nhập mật khẩu mặc định (không bắt buộc)" className="mt-3" />
                        {formikCreate.errors.defaultPassword && formikCreate.touched.defaultPassword && (
                          <p style={{ color: "red" }}>{formikCreate.errors.defaultPassword}</p>
                        )}
                        <div className="flex justify-between gap-1 min-w-full mt-3">
                          <Button
                            color="success"
                            variant="bordered"
                            style={{ width: "420px" }}
                            onPress={handleDownloadTemplate}
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
                            onChange={handleFileUpload}
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
                            <TableColumn key="1" width="70px">Id</TableColumn>
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
                              <TableRow key={row.id}>
                                <TableCell>{row.id}</TableCell>
                                <TableCell>{row.name}</TableCell>
                                <TableCell>{row.email}</TableCell>
                                <TableCell>{row.phone}</TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </form>
                    </ModalBody>
                    <ModalFooter>
                      <Button fullWidth id="send-code-button" color="primary" type="submit" isLoading={handling} style={{ marginTop: "2vh", marginBottom: "2vh" }}>
                        Tạo
                      </Button>
                    </ModalFooter>
                  </>
                )}
              </ModalContent>
            </Modal>
            <Button className="text-md" color="success" variant="bordered" onPress={onOpen}>
              Tạo lớp học
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
            >
              <TableHeader>
                <TableColumn key="1" width="100px">Lớp</TableColumn>
                <TableColumn key="2">Ngày bắt đầu</TableColumn>
                <TableColumn key="3">Ngày kết thúc</TableColumn>
                <TableColumn key="4" width="200px">Người tạo</TableColumn>
                {/* Cột cho phép sắp xếp */}
                <TableColumn key="5" allowsSorting onClick={() => requestSort('totalStudent')}>
                  Tổng số học sinh
                  {sortConfig.key === 'totalStudent' && (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼')}
                </TableColumn>
                <TableColumn key="5" width="250px" >Hành động</TableColumn>
              </TableHeader>
              <TableBody
                items={sortedClasses}
                emptyContent={"Chưa có dữ liệu"}
                loadingContent={
                  !loadForm ? (
                    <div className="flex w-full justify-center">
                      <Spinner color="white" />
                    </div>
                  ) : null
                }
                loadingState={!loadForm ? "loading" : "idle"}
              >
                {sortedClasses.map((row, index) => (
                  <TableRow key={index} onClick={() => handleRowClick(row.id)}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{formatDate(new Date(row.startAt))}</TableCell>
                    <TableCell>{formatDate(new Date(row.endAt))}</TableCell>
                    <TableCell>{row.createdBy.name}</TableCell>
                    <TableCell>{row.totalStudent}</TableCell>
                    <TableCell>
                      <div className="relative flex items-center gap-2">
                        {row.status === "Active" ? (
                          <Tooltip color="danger" content="Xóa" placement="right">
                            <Button className="text-lg text-danger cursor-pointer active:opacity-100 bg-danger-200" onClick={() => handleDelete(row.id)} isDisabled={handling} isLoading={handling}>
                              <DeleteIcon />
                            </Button>
                          </Tooltip>
                        ) : (
                          <Tooltip color="warning" content="Khôi phục" placement="right">
                            <Button className="text-lg text-warning cursor-pointer active:opacity-50 bg-warning-200" onClick={() => handleRestore(row.id)} isDisabled={handling} isLoading={handling}>
                              <MdOutlineSettingsBackupRestore />
                            </Button>
                          </Tooltip>
                        )}
                      </div>
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
