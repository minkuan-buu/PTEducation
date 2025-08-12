import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  CLASSDETAIL,
  GETALLSCORES,
  GETTEMPLATEIMPORTSCORESTUDENT,
  GETLISTCLASSSELECT,
  CREATESCORE,
  CREATEATTENDANCE,
  GETALLATTENDANCES,
  GETTEMPLATEIMPORTATTENDANCESTUDENT
} from "../api/api";
import { BreadcrumbItem, Breadcrumbs, Button, Card, CardBody, Chip, Image, Input, Link, Modal, ModalBody, ModalContent, ModalHeader, Select, SelectItem, Slider, Tab, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tabs, useDisclosure } from "@nextui-org/react";
import { HeartFilledIcon } from "@/components/icons";
import { format, set } from "date-fns";
import { Logout } from "./logout";
import { IoIosInformationCircle } from "react-icons/io";
import { GrScorecard } from "react-icons/gr";
import { FaCalendarCheck } from "react-icons/fa6";
import { useFormik } from "formik";
import * as Yup from "yup";
// import { Workbook } from 'exceljs';
import ExcelJS from "exceljs";
import moment from "moment";
import { useLocation } from "react-router-dom";
import { FaTrash } from "react-icons/fa";

interface ClassDetail {
  id: string;
  name: string;
  startAt: Date;
  endAt: Date;
  createdAt: Date;
  createdBy: {
    id: string;
    name: string;
  };
  students: {
    id: string;
    name: string;
    email: string;
    phone: string;
  }[];
}

export default function ClassDetail() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    isOpen: isOpenAttendance,
    onOpen: onOpenAttendance,
    onOpenChange: onOpenChangeAttendance,
  } = useDisclosure();
  const [classDetail, setClassDetail] = useState < ClassDetail > ();
  const [classListScore, setClassListScore] = useState([]);
  const [classListAttendance, setClassListAttendance] = useState([]);
  const [classListSelect, setClassListSelect] = useState([]);
  const [classStudents, setClassStudents] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [sortConfigScore, setSortConfigScore] = useState({ key: null, direction: 'ascending' });
  const [sortConfigAttendance, setSortConfigAttendance] = useState({ key: null, direction: 'ascending' });
  const [onLoading, setOnLoading] = useState < Boolean > (true);
  const [tableData, setTableData] = useState([]);
  const [tableDataAttendance, setTableDataAttendance] = useState([]);
  const [loadForm, setloadForm] = useState(false);
  const [handling, setHandling] = useState < boolean > (false);
  const { id } = useParams();
  // const [handling, setHandling] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("role") !== "Admin") {
      window.location.href = "/";
    }
  }, []);

  useEffect(() => {
    if (onLoading) {
      var token = localStorage.getItem("token");
      const fetchData = async () => {
        try {
          const { isSuccess, res } = await CLASSDETAIL(token, id);

          if (!isSuccess) {
            if (res.status === 401) {
              Logout();
            }
            let result = await res.json();
            alert(result.message);
          } else {
            let result = await res.json();
            document.title = result.data.name;
            setClassDetail(result.data);
            setClassStudents(result.data.students);
            setOnLoading(false);
          }
        } catch (error) {
          console.log(error);
        }
      };

      fetchData();
      fetchScoreData(token);
      fetchAttendanceData(token);
      fetchClassSelectData(token);
    }
  }, [loadForm, onLoading]);

  const fetchScoreData = async (token) => {
    try {
      const { isSuccess, res } = await GETALLSCORES(token, id);
      if (!isSuccess) {
        if (res.status === 401) {
          Logout();
        }
        let result = await res.json();
        alert(result.message);
      } else {
        let result = await res.json();
        setClassListScore(result.data);
      }
    }
    catch (error) {
      console.log(error);
    } finally {
      setOnLoading(false);
    }
  };

  const fetchAttendanceData = async (token) => {
    try {
      const { isSuccess, res } = await GETALLATTENDANCES(token, id);
      if (!isSuccess) {
        if (res.status === 401) {
          Logout();
        }
        let result = await res.json();
        alert(result.message);
      } else {
        let result = await res.json();
        setClassListAttendance(result.data);
      }
    }
    catch (error) {
      console.log(error);
    } finally {
      setOnLoading(false);
    }
  };

  const fetchClassSelectData = async (token) => {
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
        setClassListSelect(result.data);
      }
    }
    catch (error) {
      console.log(error);
    } finally {
      setOnLoading(false);
    }
  };

  // Định dạng ngày theo định dạng 'dd/MM/yyyy'
  const formatDate = (date: Date): string => {
    return format(date, 'dd/MM/yyyy, HH:mm');
  };

  const formatScoreDate = (date: Date): string => {
    return format(date, 'dd/MM/yyyy');
  };

  const formatAttendanceDate = (date: Date): string => {
    return format(date, 'dd/MM');
  };

  function handleDownloadTemplate(key: string) {
    var token = localStorage.getItem("token");
    const fetchData = async () => {
      try {
        var callback = null;

        if (key == "diem") {
          callback = await GETTEMPLATEIMPORTSCORESTUDENT(token, id);
        } else if (key == "diemdanh") {
          callback = await GETTEMPLATEIMPORTATTENDANCESTUDENT(token, id);
        }
        if (callback == null) return;

        if (!callback.isSuccess) {
          if (callback.res.status === 401) {
            Logout();
          }
          let result = await callback.res.json();

          alert(result.message);
        } else {
          let result = await callback.res.blob();
          // Bước 2: Tạo URL cho Blob
          const blobUrl = URL.createObjectURL(result);
          // Bước 3: Tạo link và kích hoạt tải xuống
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = key == "diem" ? "ImportScoreStudent" : key == "diemdanh" ? "ImportAttendanceStudent" : "Download"; // Đặt tên file cho file tải xuống
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
    setFile(null);
    setTableData([]);
  }

  function CloseModalAttendance() {
    onOpenChangeAttendance();
    formikCreateAttendance.resetForm();
    setFile(null);
    setTableDataAttendance([]);
  }

  const formikCreate = useFormik({
    initialValues: {
      testDateAt: "",
      classId: id || "",
    },
    validationSchema: Yup.object({
      testDateAt: Yup.date().required("Required"),
      classId: Yup.string().required("Required"),
    }),
    onSubmit: async (values) => {
      setHandling(true);
      var token = localStorage.getItem("token");
      var body = {
        testDateAt: values.testDateAt,
        classId: values.classId,
        scoreReqList: [],
      };
      tableData.map((item) => {
        var scoreReq = {
          studentClassId: item.studentclassid,
          score: item.score,
        }
        body.scoreReqList.push(scoreReq);
      });
      try {
        const { isSuccess, res } = await CREATESCORE(token, body);

        if (!isSuccess) {
          if (res.status === 401) {
            Logout();
          }
          let result = await res.json();
          alert(result.message);
        } else {
          CloseModal();
          setloadForm(false);
          setOnLoading(true);
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

  const formikCreateAttendance = useFormik({
    initialValues: {
      startDate: "",
      endDate: "",
      classId: id || "",
    },
    validationSchema: Yup.object({
      startDate: Yup.date().required("Required").test(
        "is-monday",
        "Ngày bắt đầu điểm danh phải là thứ Hai",
        (value) => moment(value).day() === 1 // Kiểm tra xem startDate có phải là thứ 2
      ),
      endDate: Yup.date().required("Required").test(
        "is-six-days-later",
        "Ngày kết thúc phải cách ngày bắt đầu 6 ngày",
        function (endDate) {
          const { startDate } = this.parent; // Lấy giá trị của startDate từ form
          if (!startDate || !endDate) return false; // Nếu không có startDate hoặc endDate thì không hợp lệ
          return moment(endDate).diff(moment(startDate), "days") === 6; // Kiểm tra khoảng cách là 6 ngày
        }
      ),
      classId: Yup.string().required("Required"),
    }),
    onSubmit: async (values) => {
      setHandling(true);
      var token = localStorage.getItem("token");
      var body = {
        startDate: values.startDate,
        endDate: values.endDate,
        classId: values.classId,
        listIdStudent: [],
      };
      tableDataAttendance.map((item) => {
        body.listIdStudent.push(`${item.id}`);
      });
      try {
        const { isSuccess, res } = await CREATEATTENDANCE(token, body);

        if (!isSuccess) {
          if (res.status === 401) {
            Logout();
          }
          let result = await res.json();
          alert(result.message);
        } else {
          CloseModalAttendance();
          setloadForm(false);
          setOnLoading(true);
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

  // Hàm xử lý sắp xếp
  const sortedClasses = [...classStudents].sort((a, b) => {
    if (sortConfig.key) {
      const sortOrder = sortConfig.direction === 'ascending' ? 1 : -1;
      if (a[sortConfig.key] < b[sortConfig.key]) return -1 * sortOrder;
      if (a[sortConfig.key] > b[sortConfig.key]) return 1 * sortOrder;
      return 0;
    }
    return 0; // Không sắp xếp nếu không có cột được chọn
  });

  const sortedScore = [...classListScore].sort((a, b) => {
    if (sortConfigScore.key) {
      const sortOrder = sortConfigScore.direction === 'ascending' ? 1 : -1;
      if (a[sortConfigScore.key] < b[sortConfigScore.key]) return -1 * sortOrder;
      if (a[sortConfigScore.key] > b[sortConfigScore.key]) return 1 * sortOrder;
      return 0;
    }
    return 0; // Không sắp xếp nếu không có cột được chọn
  });

  const sortedAttendance = [...classListAttendance].sort((a, b) => {
    if (sortConfigAttendance.key) {
      const sortOrder = sortConfigAttendance.direction === 'ascending' ? 1 : -1;
      if (a[sortConfigAttendance.key] < b[sortConfigAttendance.key]) return -1 * sortOrder;
      if (a[sortConfigAttendance.key] > b[sortConfigAttendance.key]) return 1 * sortOrder;
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

  // Hàm thay đổi cột sắp xếp và thứ tự sắp xếp
  const requestSortScore = (key) => {
    let direction = 'ascending';
    if (sortConfigScore.key === key && sortConfigScore.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfigScore({ key, direction });
  };

  const requestSortAttendance = (key) => {
    let direction = 'ascending';
    if (sortConfigAttendance.key === key && sortConfigAttendance.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfigAttendance({ key, direction });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setTableData([]);
    if (file) {
      const reader = new FileReader();
      setFile(file);

      reader.onload = async (e: ProgressEvent<FileReader>) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;

          if (!arrayBuffer) {
            console.error("arrayBuffer không tồn tại.");
            return;
          }

          const workbook = new Workbook();

          await workbook.xlsx.load(arrayBuffer);
          console.log(workbook);

          // Kiểm tra workbook
          if (!workbook || !workbook.worksheets) {
            console.error("Workbook không tải đúng hoặc không có worksheets.");
            return;
          }

          // Kiểm tra worksheet
          const worksheet = workbook.getWorksheet("ScoreStudents");
          if (!worksheet) {
            console.error('Worksheet "ScoreStudents" không tồn tại.');
            return;
          }

          const data: any[] = [];
          let headers: string[] = [];

          worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
            if (rowNumber === 1) {
              headers = row.values.slice(1).map(header => header?.toString().toLowerCase()) as string[];
            } else {
              const rowData: any = {};
              row.values.slice(1).forEach((cellValue, index) => {
                rowData[headers[index]] = cellValue;
              });
              data.push(rowData);
            }
          });
          setTableData(data);
        } catch (error) {
          console.error('Lỗi khi tải workbook hoặc worksheet:', error);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const [file, setFile] = useState < File | null > (null);

  const clearFileScoreInput = () => {
    setFile(null);
    setTableData([]);
    const fileInput = document.getElementById("fileScoreUpload") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = ""; // reset giá trị input file
    }
  };

  const clearFileAttendanceInput = () => {
    setFile(null);
    setTableDataAttendance([]);
    const fileInput = document.getElementById("fileAttendanceUpload") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = ""; // reset giá trị input file
    }
  };

  const handleFileUploadAttendance = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setTableData([]);
    if (!file) return;

    if (!file.name.endsWith(".xlsx")) {
      console.error("File không phải định dạng .xlsx hợp lệ");
      return;
    }

    setFile(file);
    const reader = new FileReader();

    reader.onload = async (e: ProgressEvent<FileReader>) => {
      try {
        const result = e.target?.result;
        if (!(result instanceof ArrayBuffer)) {
          console.error("FileReader không trả về ArrayBuffer");
          return;
        }

        const workbook = new ExcelJS.Workbook();
        const arrayBuffer = await file.arrayBuffer(); // Chuyển sang ArrayBuffer
        await workbook.xlsx.load(arrayBuffer);

        console.log("Sheet trong file:", workbook.worksheets.map(ws => ws.name));

        const worksheet = workbook.getWorksheet("ImportAttendance");
        if (!worksheet) {
          console.error('Worksheet "ImportAttendance" không tồn tại.');
          return;
        }

        const mappingsheet = workbook.getWorksheet("MappingStudents");
        if (!mappingsheet) {
          console.error('Worksheet "MappingStudents" không tồn tại.');
          return;
        }

        // Tạo map ID -> Name
        const idToNameMap: Record<string, string> = {};
        mappingsheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          if (rowNumber > 1) {
            const id = row.getCell(1).text;
            const name = row.getCell(2).text;
            if (id) idToNameMap[id] = name;
          }
        });

        // Đọc ImportAttendance
        const data: any[] = [];
        let headers: string[] = [];

        worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
          if (rowNumber === 1) {
            headers = row.values.slice(1).map(h => h?.toString().toLowerCase()) as string[];
          } else {
            const rowData: any = {};
            row.values.slice(1).forEach((value, idx) => {
              if (headers[idx] === "id") {
                const id = value?.toString();
                rowData["ID"] = id;
                rowData["Name"] = idToNameMap[id] || "";
              } else {
                rowData[headers[idx]] = value;
              }
            });
            data.push(rowData);
          }
        });
        console.log("Dữ liệu điểm danh:", data);
        setTableDataAttendance(data);
      } catch (error) {
        console.error("Lỗi khi tải workbook hoặc worksheet:", error);
      }
    };

    reader.readAsArrayBuffer(file);
  };


  const handleRowClick = (scoreId) => {
    window.location.href = `/class/${id}/score/${scoreId}`;
  };

  const handleRowAttendanceClick = (attendanceId) => {
    window.location.href = `/class/${id}/attendance/${attendanceId}`;
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col gap-4 py-8 md:py-10">
        <div className="inline-block">
          {onLoading == false && classDetail != null ? (
            <>
              <Breadcrumbs className="mb-5">
                <BreadcrumbItem href="/manage-classes">Tất cả lớp</BreadcrumbItem>
                <BreadcrumbItem href={`/class/${id}`}>{classDetail.name}</BreadcrumbItem>
              </Breadcrumbs>
              <h1 className={title()}>Lớp {classDetail.name}</h1>
              <div className="mt-10">
                <Tabs aria-label="Options" color="primary" selectedKey={location.hash.split("#")[1]} onSelectionChange={(e: React.Key) => {
                  location.hash = e.toString();
                }} variant="bordered">
                  <Tab
                    key="info"
                    title={
                      <div className="flex items-center space-x-2">
                        <IoIosInformationCircle />
                        <span>Thông tin</span>
                      </div>
                    }
                  >
                    <strong><h2 className={"mt-5 text-xl mb-3"}>Thông tin chung</h2></strong>
                    <Card
                      isBlurred
                      className="border-none bg-background/50 dark:bg-default-200/50 max-w-full"
                      shadow="md"
                    >
                      <CardBody>
                        <div className="grid grid-cols-4 gap-12 pl-12 pt-1 pb-1">
                          <div>
                            <div>
                              <strong>Ngày bắt đầu</strong>
                            </div>
                            <div>
                              {classDetail.startAt
                                ? formatDate(classDetail.startAt)
                                : null}
                            </div>
                          </div>
                          <div>
                            <div>
                              <strong>Ngày kết thúc</strong>
                            </div>
                            <div>{classDetail.endAt ? formatDate(classDetail.endAt) : null}</div>
                          </div>
                          <div>
                            <div>
                              <strong>Ngày tạo</strong>
                            </div>
                            <div>{classDetail.createdAt ? formatDate(classDetail.createdAt) : null}</div>
                          </div>
                          <div>
                            <div>
                              <strong>Được tạo bởi</strong>
                            </div>
                            <div>
                              <Link href={classDetail ? `/user/${classDetail.createdBy.id}` : null}>
                                {classDetail.createdBy.name}
                              </Link>
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                    <div className="flex justify-between items-center">
                      <strong><h2 className={"mt-10 text-xl mb-3"}>Thông tin học viên</h2></strong>
                      <Button className="text-white" variant="bordered" color="success">Thêm học sinh</Button>
                    </div>
                    <Table selectionMode="multiple" selectionBehavior="replace" aria-label="Example table with dynamic content" className="mt-7" fullWidth>
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
                      <TableBody items={sortedClasses} emptyContent={"Chưa có dữ liệu"}>
                        {sortedClasses.map((row, index) => (
                          <TableRow key={row.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{row.name}</TableCell>
                            <TableCell>{row.email}</TableCell>
                            <TableCell>{row.phone}</TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Tab>
                  <Tab
                    key="score"
                    title={
                      <div className="flex items-center space-x-2">
                        <GrScorecard />
                        <span>Điểm</span>
                      </div>
                    }
                  >
                    <div className="flex justify-between items-center">
                      <strong><h2 className={"mt-10 text-xl mb-3"}>Thông tin điểm</h2></strong>
                      <Modal
                        isDismissable={false}
                        isKeyboardDismissDisabled={true}
                        isOpen={isOpen}
                        onOpenChange={CloseModal}
                        size="4xl"
                      >
                        <ModalContent>
                          {(onClose) => (
                            <>
                              <ModalHeader>Tạo điểm</ModalHeader>
                              <ModalBody>
                                <p>Tạo điểm mới</p>
                                <form onSubmit={formikCreate.handleSubmit}>
                                  <Input name="testDateAt" label="Ngày kiểm tra" type="date" value={formikCreate.values.testDateAt} onChange={formikCreate.handleChange} placeholder="Nhập ngày kiểm tra" />
                                  {formikCreate.errors.testDateAt && formikCreate.touched.testDateAt && (
                                    <p style={{ color: "red" }}>{formikCreate.errors.testDateAt}</p>
                                  )}
                                  <Select
                                    items={classListSelect}
                                    label="Lớp"
                                    placeholder="Chọn lớp"
                                    className="max-w-full mt-3"
                                    isDisabled={true}
                                    defaultSelectedKeys={[id]}
                                    onChange={(value) => {
                                      formikCreate.setFieldValue("classId", value.target.value);
                                    }}
                                  >
                                    {classListSelect.map((item) => (
                                      <SelectItem key={item.id} value={item.id}>
                                        {item.name}
                                      </SelectItem>
                                    ))}
                                  </Select>
                                  <div className="flex justify-between gap-1 min-w-full mt-4">
                                    <Button color="success" variant="bordered" style={{ width: "420px" }} onPress={() => handleDownloadTemplate("diem")}>Tải mẫu nhập dữ liệu</Button>
                                    <Input id="fileScoreUpload" color="primary" variant="bordered" type="file" accept=".xlsx" style={{ width: "420px" }} onChange={handleFileUpload}>Upload template</Input>
                                    {file && (
                                      <Button
                                        color="danger"
                                        variant="bordered"
                                        style={{ width: "50px" }}
                                        onPress={clearFileScoreInput}
                                      >
                                        <FaTrash />
                                      </Button>
                                    )}
                                  </div>
                                  <Table selectionMode="multiple" selectionBehavior="replace" aria-label="Example table with dynamic content" className="mt-7 max-h-[300px]" fullWidth>
                                    <TableHeader>
                                      <TableColumn key="1" width="70px">Id</TableColumn>
                                      <TableColumn key="2" width="100px">Tên</TableColumn>
                                      <TableColumn key="3" width="300px">Điểm</TableColumn>
                                      <TableColumn key="4" width="200px">Hành động</TableColumn>
                                    </TableHeader>
                                    <TableBody items={tableData} emptyContent={"Chưa có dữ liệu"}>
                                      {tableData.map((row, index) => (
                                        <TableRow key={row.id}>
                                          <TableCell>{row.id}</TableCell>
                                          <TableCell>{row.name}</TableCell>
                                          <TableCell>{row.score}</TableCell>
                                          <TableCell></TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                  <Button fullWidth id="send-code-button" color="primary" type="submit" isLoading={handling} style={{ marginTop: "2vh", marginBottom: "2vh" }}>
                                    Tạo
                                  </Button>
                                </form>
                              </ModalBody>
                            </>
                          )}
                        </ModalContent>
                      </Modal>
                      <Button className="text-md" color="success" variant="bordered" onPress={onOpen}>
                        Tạo điểm mới
                      </Button>
                    </div>
                    <Table selectionMode="multiple" selectionBehavior="replace" aria-label="Example table with dynamic content" className="mt-7" fullWidth>
                      <TableHeader>
                        <TableColumn key="1" width="70px">No.</TableColumn>
                        <TableColumn key="2" width="300px">Tên</TableColumn>
                        <TableColumn key="3" width="300px">Được tạo bởi</TableColumn>
                        <TableColumn key="4" width="300px" allowsSorting onClick={() => requestSortScore('averageScore')}>
                          Điểm trung bình
                          {sortConfigScore.key === 'averageScore' && (sortConfigScore.direction === 'ascending' ? ' ▲' : ' ▼')}
                        </TableColumn>
                        <TableColumn key="5" width="200px">Hành động</TableColumn>
                      </TableHeader>
                      <TableBody items={sortedScore} emptyContent={"Chưa có dữ liệu"}>
                        {sortedScore.map((row, index) => (
                          <TableRow key={row.id} onClick={() => handleRowClick(row.id)}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>Ngày {row.testDateAt ? formatScoreDate(row.testDateAt) : null}</TableCell>
                            <TableCell>{row.createBy.name}</TableCell>
                            <TableCell>{row.averageScore}</TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Tab>
                  <Tab
                    key="attendance"
                    title={
                      <div className="flex items-center space-x-2">
                        <FaCalendarCheck />
                        <span>Điểm danh</span>
                      </div>
                    }
                  >
                    <div className="flex justify-between items-center">
                      <strong><h2 className={"mt-10 text-xl mb-3"}>Thông tin điểm danh</h2></strong>
                      <Modal
                        isDismissable={false}
                        isKeyboardDismissDisabled={true}
                        isOpen={isOpenAttendance}
                        onOpenChange={CloseModalAttendance}
                        size="4xl"
                      >
                        <ModalContent>
                          {(onClose) => (
                            <>
                              <ModalHeader>Tạo điểm danh</ModalHeader>
                              <ModalBody>
                                <p>Tạo điểm danh mới</p>
                                <form onSubmit={formikCreateAttendance.handleSubmit}>
                                  <Input name="startDate" label="Ngày bắt đầu điểm danh" type="date" value={formikCreateAttendance.values.startDate} onChange={formikCreateAttendance.handleChange} placeholder="Nhập ngày bắt đầu" />
                                  {formikCreateAttendance.errors.startDate && formikCreateAttendance.touched.startDate && (
                                    <p style={{ color: "red" }}>{formikCreateAttendance.errors.startDate}</p>
                                  )}
                                  <Input name="endDate" className="mt-3" label="Ngày kết thúc điểm danh" type="date" value={formikCreateAttendance.values.endDate} onChange={formikCreateAttendance.handleChange} placeholder="Nhập ngày kết thúc" />
                                  {formikCreateAttendance.errors.endDate && formikCreateAttendance.touched.endDate && (
                                    <p style={{ color: "red" }}>{formikCreateAttendance.errors.endDate}</p>
                                  )}
                                  <Select
                                    items={classListSelect}
                                    label="Lớp"
                                    placeholder="Chọn lớp"
                                    className="max-w-full mt-3"
                                    defaultSelectedKeys={[id]}
                                    isDisabled={true}
                                    onChange={(value) => {
                                      formikCreate.setFieldValue("classId", value.target.value);
                                    }}
                                  >
                                    {classListSelect.map((item) => (
                                      <SelectItem key={item.id} value={item.id}>
                                        {item.name}
                                      </SelectItem>
                                    ))}
                                  </Select>
                                  <div className="flex justify-between gap-1 min-w-full mt-4">
                                    <Button color="success" variant="bordered" style={{ width: "420px" }} onPress={() => handleDownloadTemplate("diemdanh")}>Tải mẫu nhập dữ liệu</Button>
                                    <Input id="fileAttendanceUpload" color="primary" variant="bordered" type="file" accept=".xlsx" style={{ width: "420px" }} onChange={handleFileUploadAttendance}>Upload template</Input>
                                    {file && (
                                      <Button
                                        color="danger"
                                        variant="bordered"
                                        style={{ width: "50px" }}
                                        onPress={clearFileAttendanceInput}
                                      >
                                        <FaTrash />
                                      </Button>
                                    )}
                                  </div>
                                  <Table selectionMode="multiple" selectionBehavior="replace" aria-label="Example table with dynamic content" className="mt-7 max-h-[300px]" fullWidth>
                                    <TableHeader>
                                      <TableColumn key="1" width="70px">Id</TableColumn>
                                      <TableColumn key="2" width="70px">Tên</TableColumn>
                                      <TableColumn key="3" width="200px">Hành động</TableColumn>
                                    </TableHeader>
                                    <TableBody items={tableDataAttendance} emptyContent={"Chưa có dữ liệu"}>
                                      {tableDataAttendance.map((row, index) => (
                                        <TableRow key={row.ID}>
                                          <TableCell>{row.ID}</TableCell>
                                          <TableCell>{row.Name}</TableCell>
                                          <TableCell></TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                  <Button fullWidth id="send-code-button" color="primary" type="submit" isLoading={handling} style={{ marginTop: "2vh", marginBottom: "2vh" }}>
                                    Tạo
                                  </Button>
                                </form>
                              </ModalBody>
                            </>
                          )}
                        </ModalContent>
                      </Modal>
                      <Button className="text-md" color="success" variant="bordered" onPress={onOpenAttendance}>
                        Tạo điểm danh mới
                      </Button>
                    </div>
                    <Table selectionMode="multiple" selectionBehavior="replace" aria-label="Example table with dynamic content" className="mt-7" fullWidth>
                      <TableHeader>
                        <TableColumn key="1" width="70px">No.</TableColumn>
                        <TableColumn key="2" width="300px">Tên</TableColumn>
                        <TableColumn key="3" width="300px">Được tạo bởi</TableColumn>
                        <TableColumn key="4" width="300px" allowsSorting onClick={() => requestSortAttendance('totalPresent')}>
                          Số học sinh có mặt
                          {sortConfigAttendance.key === 'totalPresent' && (sortConfigAttendance.direction === 'ascending' ? ' ▲' : ' ▼')}
                        </TableColumn>
                        <TableColumn key="5" width="300px" allowsSorting onClick={() => requestSortAttendance('totalAbsent')}>
                          Số học sinh vắng mặt
                          {sortConfigAttendance.key === 'totalAbsent' && (sortConfigAttendance.direction === 'ascending' ? ' ▲' : ' ▼')}
                        </TableColumn>
                        <TableColumn key="6" width="200px">Hành động</TableColumn>
                      </TableHeader>
                      <TableBody items={sortedAttendance} emptyContent={"Chưa có dữ liệu"}>
                        {sortedAttendance.map((row, index) => (
                          <TableRow key={row.id} onClick={() => handleRowAttendanceClick(row.id)}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>Tuần {row.startDate ? formatAttendanceDate(row.startDate) : null} - {row.endDate ? formatScoreDate(row.endDate) : null}</TableCell>
                            <TableCell>{row.createdBy.name}</TableCell>
                            <TableCell>{row.totalPresent}</TableCell>
                            <TableCell>{row.totalAbsent}</TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Tab>
                </Tabs>
              </div>
            </>
          ) : null}
        </div>
      </section>
    </DefaultLayout>
  );
}
