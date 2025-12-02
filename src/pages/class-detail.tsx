import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CLASSDETAIL,
  GETALLSCORES,
  GETTEMPLATEIMPORTSCORESTUDENT,
  GETLISTCLASSSELECT,
  CREATESCORE,
  CREATEATTENDANCE,
  GETALLATTENDANCES,
  GETTEMPLATEIMPORTATTENDANCESTUDENT,
  GETTEMPLATEIMPORTSTUDENT,
  ADDSTUDENTSINTOCLASS,
  UPDATECLASSINFO
} from "../api/api";
import { BreadcrumbItem, Breadcrumbs, Button, Card, CardBody, Chip, Image, Input, Link, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, RadioGroup, Select, SelectItem, Slider, Tab, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tabs, useDisclosure, Radio, Tooltip } from "@heroui/react";
import { HeartFilledIcon, SearchIcon } from "@/components/icons";
import { format, set } from "date-fns";
import { Logout } from "./logout";
import { IoIosInformationCircle } from "react-icons/io";
import { GrScorecard } from "react-icons/gr";
import { FaCalendarCheck, FaCheck } from "react-icons/fa6";
import { useFormik } from "formik";
import * as Yup from "yup";
// import { Workbook } from 'exceljs';
import ExcelJS, { Workbook } from "exceljs";
import moment from "moment";
import { useLocation } from "react-router-dom";
import { FaRegEdit, FaTrash, FaUserEdit, FaUserTimes } from "react-icons/fa";
import { MoveOutClassModal } from "@/components/moveOutClassModal";
import { PiHockey } from "react-icons/pi";
import { BiPhone, BiTransferAlt } from "react-icons/bi";
import { UpdateInfoModal } from "@/components/updateInfoModal";
import { DeleteScoreModal, DeleteStudentModal } from "@/components/deleteModal";
import { MdDeleteForever } from "react-icons/md";

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
  const {
    isOpen: isOpenAddStudents,
    onOpen: onOpenAddStudents,
    onOpenChange: onOpenChangeAddStudents,
  } = useDisclosure();
  const {
    isOpen: isOpenMoveOutClass,
    onOpen: onOpenMoveOutClass,
    onOpenChange: onOpenChangeMoveOutClass,
  } = useDisclosure();
  const {
    isOpen: isOpenUpdateStudentInfo,
    onOpen: onOpenUpdateStudentInfo,
    onOpenChange: onOpenChangeUpdateStudentInfo,
  } = useDisclosure();
  const {
    isOpen: isOpenDeleteStudent,
    onOpen: onOpenDeleteStudent,
    onOpenChange: onOpenChangeDeleteStudent,
  } = useDisclosure();
  const {
    isOpen: isOpenDeleteScore,
    onOpen: onOpenDeleteScore,
    onOpenChange: onOpenChangeDeleteScore,
  } = useDisclosure();
  const [classDetail, setClassDetail] = useState < ClassDetail > ();
  const [classListScore, setClassListScore] = useState([]);
  const [classListAttendance, setClassListAttendance] = useState([]);
  const [classListSelect, setClassListSelect] = useState([]);
  const [classStudents, setClassStudents] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [sortFilterConfig, setSortFilterConfig] = useState({ key: null, direction: 'ascending' });
  const [sortConfigScore, setSortConfigScore] = useState({ key: null, direction: 'ascending' });
  const [sortConfigAttendance, setSortConfigAttendance] = useState({ key: null, direction: 'ascending' });
  const [onLoading, setOnLoading] = useState < Boolean > (true);
  const [tableData, setTableData] = useState([]);
  const [tableDataAttendance, setTableDataAttendance] = useState([]);
  const [tableStudents, setTableStudents] = useState([]);
  const [loadForm, setloadForm] = useState(false);
  const [handling, setHandling] = useState < boolean > (false);
  const [EditMode, setEditMode] = useState(false);
  const { id } = useParams();
  const [selected, setSelected] = React.useState("personal");
  const [selectedMoveOutStudentId, setSelectedMoveOutStudentId] = React.useState(null);
  const [isFilter, setIsFilter] = React.useState(false);
  const [filteredStudents, setFilteredStudents] = React.useState < { id: string; name: string; email: string; phone: string; }[] > ([]);
  const [selectedStudentInfo, setSelectedStudentInfo] = React.useState < { studentClassId: string; name: string; email: string; phone: string; } | null > (null);
  const [selectedStudentDelete, setSelectedStudentDelete] = React.useState < { studentClassId: string; name: string } | null > (null);
  const [selectedScoreDelete, setSelectedScoreDelete] = React.useState < { scoreId: string; name: string } | null > (null);
  // const [handling, setHandling] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("role") !== "Admin" && localStorage.getItem("role") !== "Manager") {
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

  const handleMoveOut = async (selectedStudentId) => {
    setSelectedMoveOutStudentId(selectedStudentId);
    onOpenMoveOutClass();
  }

  const handleUpdateStudentInfo = async (name, email, phone, studentClassId) => {
    setSelectedStudentInfo({ studentClassId, name, email, phone });
    onOpenUpdateStudentInfo();
  }

  const handleDeleteStudent = async (studentId, name) => {
    setSelectedStudentDelete({ studentClassId: studentId, name });
    onOpenDeleteStudent();
  }

  const handleDeleteScore = async (scoreId, name) => {
    setSelectedScoreDelete({ scoreId, name });
    onOpenDeleteScore();
  }

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
        } else if (key == "themhocsinh") {
          callback = await GETTEMPLATEIMPORTSTUDENT(token, id);
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

  function CloseAddStudentsModal() {
    onOpenChangeAddStudents();
    formikAddStudent.resetForm();
    setFile(null);
    setTableStudents([]);
    setSelected("personal");
  }

  const clearFileInput = () => {
    setFile(null);
    setTableStudents([]);
    const fileInput = document.getElementById("fileUpload") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = ""; // reset giá trị input file
    }
  };

  const handleFileAddStudentsUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    setTableStudents([]);

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
      setTableStudents(jsonData);
    };

    reader.readAsArrayBuffer(uploadedFile);
  };

  const formikUpadateClassInfo = useFormik({
    enableReinitialize: true,
    initialValues: {
      id: id || "",
      name: classDetail?.name || "",
      startAt: classDetail ? classDetail.startAt : "",
      endAt: classDetail ? classDetail.endAt : "",
    },
    validationSchema: Yup.object({
      id: Yup.string().required("Required"),
      name: Yup.string().required("Required"),
      startAt: Yup.date().required("Required"),
      endAt: Yup.date().required("Required"),
    }),
    onSubmit: async (values) => {
      setHandling(true);
      var token = localStorage.getItem("token");
      var body = {
        id: values.id,
        name: values.name,
        startAt: values.startAt,
        endAt: values.endAt,
      };
      try {
        const { isSuccess, res } = await UPDATECLASSINFO(token, body);

        if (!isSuccess) {
          if (res.status === 401) {
            Logout();
          }
          let result = await res.json();
          alert(result.message);
        } else {
          setloadForm(false);
          setOnLoading(true);
          let result = await res.json();
          alert(result.message);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setEditMode(false);
        setHandling(false);
      }
    },
  });

  const formikAddStudent = useFormik({
    initialValues: {
      id: id || "",
      defaultPassword: "",
      studentId: "",
      studentName: "",
      studentEmail: "",
      studentPhone: "",
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
      var body = {
        id: values.id,
        defaultPassword: values.defaultPassword.length > 0 ? values.defaultPassword : null,
        students: [],
      };
      if (selected === "list") {
        tableStudents.forEach((studentData) => {
          var student = {
            id: `${studentData.id}`,
            name: studentData.name,
            email: studentData.email,
            phone: studentData.phone.toString().length > 0 ? studentData.phone.toString() : "-",
          };
          body.students.push(student);
        });
      } else {
        var student = {
          id: `${formikAddStudent.values.studentId}`,
          name: formikAddStudent.values.studentName,
          email: formikAddStudent.values.studentEmail,
          phone: formikAddStudent.values.studentPhone.toString().length > 0 ? formikAddStudent.values.studentPhone.toString() : "-",
        };
        body.students.push(student);
      }
      try {
        const { isSuccess, res } = await ADDSTUDENTSINTOCLASS(token, body);

        if (!isSuccess) {
          if (res.status === 401) {
            Logout();
          }
          let result = await res.json();
          alert(result.message);
        } else {
          CloseAddStudentsModal();
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

  function CloseModalAttendance() {
    onOpenChangeAttendance();
    formikCreateAttendance.resetForm();
    setFile(null);
    setTableDataAttendance([]);
  }

  const formikCreate = useFormik({
    enableReinitialize: true,
    initialValues: {
      testDateAt: "",
      shift: "",
      classId: id || "",
    },
    validationSchema: Yup.object({
      testDateAt: Yup.date().required("Required"),
      shift: Yup.string(),
      classId: Yup.string().required("Required"),
    }),
    onSubmit: async (values) => {
      setHandling(true);
      var token = localStorage.getItem("token");
      var body = {
        testDateAt: values.testDateAt,
        classId: values.classId,
        shift: values.shift,
        scoreReqList: [],
      };
      tableData.map((item) => {
        var scoreReq = {
          studentClassId: item.studentclassid,
          score: item.score.toString().toLowerCase() === "trễ" ? 0 : Number(item.score),
          note: item.score.toString().toLowerCase() === "trễ" ? "Trễ" : null,
        }
        body.scoreReqList.push(scoreReq);
      });
      try {
        // console.log(body);
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

  const formikFilter = useFormik({
    initialValues: {
      Keyword: "",
    },
    onSubmit: async (values) => {
      try {
        if (values.Keyword.trim() === "") {
          setFilteredStudents([]);
          setIsFilter(false);
        } else {
          setIsFilter(true);
          const filteredStudents =
            classDetail && classDetail.students
              ? classDetail.students.filter((student) =>
                student.name.toLowerCase().includes(values.Keyword.toLowerCase())
              )
              : [];
          setFilteredStudents(filteredStudents);
        }
      } catch (error) {
        console.log(error);
      }
    },
  });

  // Hàm xử lý sắp xếp
  const sortedClasses = [...(isFilter ? filteredStudents : classStudents)].sort((a, b) => {
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
  const navigate = useNavigate();

  const handleRowClick = (scoreId) => {
    navigate(`/class/${id}/score/${scoreId}`);
  };

  const handleRowAttendanceClick = (attendanceId) => {
    navigate(`/class/${id}/attendance/${attendanceId}`);
  };

  const EditStudentCloseModal = () => {
    onOpenChangeUpdateStudentInfo();
    setSelectedStudentInfo(null);
    setloadForm(false);
    setOnLoading(true);
  };

  const DeleteStudentCloseModal = () => {
    onOpenChangeDeleteStudent();
    setSelectedStudentDelete(null);
    setloadForm(false);
    setOnLoading(true);
  };

  const DeleteScoreCloseModal = () => {
    onOpenChangeDeleteScore();
    setSelectedScoreDelete(null);
    setloadForm(false);
    setOnLoading(true);
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col gap-4 py-8 md:py-10">
        <div className="inline-block">
          {onLoading == false && classDetail != null ? (
            <>
              <Breadcrumbs className="mb-5">
                <BreadcrumbItem href="/manage-classes">Tất cả lớp</BreadcrumbItem>
                <BreadcrumbItem href={`/class/${id}`}>Lớp {classDetail.name}</BreadcrumbItem>
              </Breadcrumbs>
              <div className="flex items-center gap-8">
                {EditMode ? (
                  <Input
                    name="name"
                    value={formikUpadateClassInfo.values.name}
                    onChange={formikUpadateClassInfo.handleChange}
                  />
                ) : (
                  <h1 className={title()}>Lớp {classDetail.name}</h1>
                )}
                {EditMode ? (
                  <Button color="success" onClick={() => formikUpadateClassInfo.handleSubmit()}><FaCheck /></Button>
                ) : (
                  <Button onClick={() => setEditMode(true)}><FaRegEdit /></Button>
                )}
              </div>
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
                      <Modal
                        isDismissable={false}
                        isKeyboardDismissDisabled={true}
                        isOpen={isOpenAddStudents}
                        onOpenChange={CloseAddStudentsModal}
                        size="4xl"
                      >
                        <ModalContent
                          className="max-h-screen overflow-auto">
                          {(onClose) => (
                            <>
                              <ModalHeader>Thêm học sinh</ModalHeader>
                              <form onSubmit={formikAddStudent.handleSubmit}>
                                <ModalBody>
                                  <Select
                                    items={classListSelect}
                                    label="Lớp"
                                    placeholder="Chọn lớp"
                                    className="max-w-full mt-3"
                                    isDisabled={true}
                                    defaultSelectedKeys={[id]}
                                    onChange={(value) => {
                                      formikAddStudent.setFieldValue("id", value.target.value);
                                    }}
                                  >
                                    {classListSelect.map((item) => (
                                      <SelectItem key={item.id} value={item.id}>
                                        {item.name}
                                      </SelectItem>
                                    ))}
                                  </Select>
                                  <Input name="defaultPassword" label="Mật khẩu mặc định" type="password" value={formikAddStudent.values.defaultPassword} onChange={formikAddStudent.handleChange} placeholder="Nhập mật khẩu mặc định (không bắt buộc)" className="mt-3" />
                                  {formikAddStudent.errors.defaultPassword && formikAddStudent.touched.defaultPassword && (
                                    <p style={{ color: "red" }}>{formikAddStudent.errors.defaultPassword}</p>
                                  )}
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
                                          onPress={() => handleDownloadTemplate("themhocsinh")}
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
                                          onChange={handleFileAddStudentsUpload}
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
                                        <TableBody items={tableStudents} emptyContent={"Chưa có dữ liệu"}>
                                          {tableStudents.map((row, index) => (
                                            <TableRow key={row.id}>
                                              <TableCell>{row.id}</TableCell>
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
                                        name="studentId"
                                        type="text"
                                        label="ID học sinh"
                                        placeholder="Nhập ID học sinh"
                                        value={formikAddStudent.values.studentId}
                                        onChange={formikAddStudent.handleChange}
                                        required
                                      />
                                      <Input
                                        name="studentName"
                                        type="text"
                                        label="Tên học sinh"
                                        placeholder="Nhập tên học sinh"
                                        value={formikAddStudent.values.studentName}
                                        onChange={formikAddStudent.handleChange}
                                        required
                                      />
                                      <Input
                                        name="studentEmail"
                                        type="text"
                                        label="Email học sinh"
                                        placeholder="Nhập email học sinh"
                                        value={formikAddStudent.values.studentEmail}
                                        onChange={formikAddStudent.handleChange}
                                        required
                                      />
                                      <Input
                                        name="studentPhone"
                                        type="text"
                                        label="Số điện thoại"
                                        placeholder="Nhập số điện thoại"
                                        value={formikAddStudent.values.studentPhone}
                                        onChange={formikAddStudent.handleChange}
                                      />
                                    </div>
                                  )}
                                </ModalBody>
                                <ModalFooter>
                                  <Button fullWidth color="primary" type="submit" isLoading={handling} style={{ marginTop: "2vh", marginBottom: "2vh" }}>
                                    Thêm
                                  </Button>
                                </ModalFooter>
                              </form>
                            </>
                          )}
                        </ModalContent>
                      </Modal>
                      <Button variant="bordered" color="success" onClick={onOpenAddStudents}>Thêm học sinh</Button>
                    </div>
                    <form onSubmit={formikFilter.handleSubmit} className="mt-4">
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
                    <MoveOutClassModal isOpen={isOpenMoveOutClass} onOpenChange={onOpenChangeMoveOutClass} studentId={selectedMoveOutStudentId} />
                    <Table selectionMode="multiple" selectionBehavior="replace" aria-label="Example table with dynamic content" className="mt-7" fullWidth>
                      <TableHeader>
                        <TableColumn key="0" width="70px">No.</TableColumn>
                        <TableColumn key="1" width="70px">Mã học sinh</TableColumn>
                        <TableColumn key="2" width="370px" allowsSorting onClick={() => requestSort('name')}>
                          Tên
                          {sortConfig.key === 'totalStudent' && (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼')}
                        </TableColumn>
                        <TableColumn key="3" width="370px">Email</TableColumn>
                        <TableColumn key="4" width="140px">Số điện thoại</TableColumn>
                        <TableColumn key="5" width="380px">Hành động</TableColumn>
                      </TableHeader>
                      <TableBody items={sortedClasses} emptyContent={"Chưa có dữ liệu"}>
                        {sortedClasses.map((row, index) => (
                          <TableRow key={row.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{row.studentCode}</TableCell>
                            <TableCell>{row.name}</TableCell>
                            <TableCell>{row.email}</TableCell>
                            <TableCell>{row.phone}</TableCell>
                            <TableCell>
                              <Tooltip content="Chuyển lớp" color="warning">
                                <Button className="mr-2 text-white text-lg" color="warning" onClick={() => handleMoveOut(row.id)}><BiTransferAlt /></Button>
                              </Tooltip>
                              <Tooltip content="Chỉnh sửa thông tin" color="warning">
                                <Button className="mr-2 text-white text-lg" color="warning" onClick={() => handleUpdateStudentInfo(row.name, row.email, row.phone, row.id)}><FaUserEdit /></Button>
                              </Tooltip>
                              <Tooltip content="Xóa học sinh" color="danger">
                                <Button className="mr-2 text-white text-lg" color="danger" onClick={() => handleDeleteStudent(row.id, row.name)}><FaUserTimes /></Button>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {selectedStudentInfo && (
                      <UpdateInfoModal
                        isOpen={isOpenUpdateStudentInfo}
                        closeModal={EditStudentCloseModal}
                        selectedStudentInfo={selectedStudentInfo}
                      />
                    )}
                    {selectedStudentDelete && (
                      <DeleteStudentModal
                        isOpen={isOpenDeleteStudent}
                        closeModal={DeleteStudentCloseModal}
                        studentClassId={selectedStudentDelete.studentClassId}
                        studentName={selectedStudentDelete.name}
                      />
                    )}
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
                        <ModalContent
                          className="max-h-screen overflow-auto">
                          {(onClose) => (
                            <>
                              <ModalHeader>Tạo điểm mới</ModalHeader>
                              <form onSubmit={formikCreate.handleSubmit}>
                                <ModalBody>
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
                                  <Input name="shift" label="Nhập ca học" type="text" value={formikCreate.values.shift} onChange={formikCreate.handleChange} placeholder="Nhập ca học (không bắt buộc)" />
                                  {formikCreate.errors.shift && formikCreate.touched.shift && (
                                    <p style={{ color: "red" }}>{formikCreate.errors.shift}</p>
                                  )}
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
                                </ModalBody>
                                <ModalFooter>
                                  <Button fullWidth id="send-code-button" color="primary" type="submit" isLoading={handling} style={{ marginTop: "2vh", marginBottom: "2vh" }}>
                                    Tạo
                                  </Button>
                                </ModalFooter>
                              </form>
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
                            <TableCell>{row.averageScore.toFixed(2)}</TableCell>
                            <TableCell>
                              <Tooltip content="Xóa điểm" color="danger">
                                <Button className="mr-2 text-white text-lg" color="danger" onClick={() => handleDeleteScore(row.id, `Ngày ${row.testDateAt ? formatScoreDate(row.testDateAt) : null}`)}><MdDeleteForever /></Button>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {selectedScoreDelete && (
                      <DeleteScoreModal
                        isOpen={isOpenDeleteScore}
                        closeModal={DeleteScoreCloseModal}
                        ScoreId={selectedScoreDelete.scoreId}
                        ScoreName={selectedScoreDelete.name}
                      />
                    )}
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
                        <ModalContent
                          className="max-h-screen overflow-auto">
                          {(onClose) => (
                            <>
                              <ModalHeader>Tạo điểm danh</ModalHeader>
                              <form onSubmit={formikCreateAttendance.handleSubmit}>
                                <ModalBody>
                                  <p>Tạo điểm danh mới</p>
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
                                </ModalBody>
                                <ModalFooter>
                                  <Button fullWidth id="send-code-button" color="primary" type="submit" isLoading={handling} style={{ marginTop: "2vh", marginBottom: "2vh" }}>
                                    Tạo
                                  </Button>
                                </ModalFooter>
                              </form>
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
