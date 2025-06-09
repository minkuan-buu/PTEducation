import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { GETATTENDANCE, UPDATEATTENDANCEDETAIL } from "../api/api";
import { format, set } from "date-fns";
import { BreadcrumbItem, Breadcrumbs, Button, Card, CardBody, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Link, RadioGroup, Radio } from "@nextui-org/react";
import { Input } from "@nextui-org/react";

export default function AttendanceDetail() {
  const [attendanceDetail, setAttendanceDetail] = useState({});
  const [listAttendanceDetail, setListAttendanceDetail] = useState<{ studentClassId: string, id: string, name: string, attendanceStatus: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [handling, setHandling] = useState(false);
  const { id, attendanceId } = useParams();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [isEditMode, setIsEditMode] = useState(false);

  const sortedClasses = [...listAttendanceDetail].sort((a, b) => {
    if (sortConfig.key) {
      const sortOrder = sortConfig.direction === 'ascending' ? 1 : -1;
      if (a[sortConfig.key] < b[sortConfig.key]) return -1 * sortOrder;
      if (a[sortConfig.key] > b[sortConfig.key]) return 1 * sortOrder;
      return 0;
    }
    return 0; // Không sắp xếp nếu không có cột được chọn
  });
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    const getScore = async () => {
      var token = localStorage.getItem("token");
      const { isSuccess, res } = await GETATTENDANCE(token, attendanceId);

      if (!isSuccess || res.status == 401) {
        window.location.href = "/";
      } else {
        var result = await res.json();

        setLoading(false);
        setAttendanceDetail(result.data);
        document.title = `Lớp ${result.data.className} - Điểm danh "Tuần ${formatAttendanceDate(result.data.startDate)} - ${formatScoreDate(result.data.endDate)}"`;
        setListAttendanceDetail(result.data.attendanceDetails);
      }
    }

    getScore();
  }, []);

  const formatScoreDate = (date: Date): string => {
    return format(date, 'dd/MM/yyyy');
  };

  const formatAttendanceDate = (date: Date): string => {
    return format(date, 'dd/MM');
  };

  function handleSaveEdit() {
    setHandling(true);
    const updateAttendanceDetail = async () => {
      try {
        var token = localStorage.getItem("token");
        var body = {
          "id": attendanceId,
          "attendanceReqList": []
        }

        listAttendanceDetail.forEach((item) => {
          var addtendanceReq = {
            "studentClassId": item.studentClassId,
            "attendanceStatus": item.attendanceStatus
          }

          body.attendanceReqList.push(addtendanceReq);
        })
        const { isSuccess, res } = await UPDATEATTENDANCEDETAIL(token, body);

        if (!isSuccess || res.status == 401) {
          //window.location.href = "/";
        } else {
          var result = await res.json();
          alert(result.message);
          setIsEditMode(false);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setHandling(false);
      }
    }

    updateAttendanceDetail();
  }

  return (
    <DefaultLayout>
      <section className="flex flex-col gap-4 py-8 md:py-10">
        <div className="inline-block">
          {!loading ? (
            <>
              <Breadcrumbs className="mb-5">
                <BreadcrumbItem href="/manage-classes">Tất cả lớp</BreadcrumbItem>
                <BreadcrumbItem href={`/class/${id}#attendance`}>{attendanceDetail.className}</BreadcrumbItem>
                <BreadcrumbItem href={`/class/${id}/attendance/${attendanceId}`}>Điểm danh "{`Tuần ${formatAttendanceDate(attendanceDetail.startDate)} - ${formatScoreDate(attendanceDetail.endDate)}`}"</BreadcrumbItem>
              </Breadcrumbs>
              <h1 className={title()}>Lớp {attendanceDetail.className} - Điểm danh "{`Tuần ${formatAttendanceDate(attendanceDetail.startDate)} - ${formatScoreDate(attendanceDetail.endDate)}`}"</h1>
              <Card
                isBlurred
                className="border-none bg-background/50 dark:bg-default-200/50 max-w-full mt-5"
                shadow="md"
              >
                <CardBody>
                  <div className="grid grid-cols-2 gap-12 pl-12 pt-1 pb-1">
                    <div>
                      <div>
                        <strong>Tuần điểm danh</strong>
                      </div>
                      <div>{attendanceDetail.startDate && attendanceDetail.endDate ? `${formatAttendanceDate(attendanceDetail.startDate)} - ${formatScoreDate(attendanceDetail.endDate)}` : null}</div>
                    </div>
                    {/* <div>
                      <div>
                        <strong>Ngày tạo</strong>
                      </div>
                      <div>{scoreDetail.createdAt ? formatScoreDate(scoreDetail.createdAt) : null}</div>
                    </div> */}
                    <div>
                      <div>
                        <strong>Được tạo bởi</strong>
                      </div>
                      <div>
                        <Link href={`/user/${attendanceDetail.createdBy.id}`}>{attendanceDetail.createdBy.name}</Link>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
              <div className="flex justify-between items-center">
                <strong><h2 className={"mt-10 text-xl mb-3"}>Thông tin điểm danh</h2></strong>
                {isEditMode ? (
                  <Button className="text-md" color="success" variant="bordered" onPress={() => handleSaveEdit()} isLoading={handling}>
                    Lưu
                  </Button>
                ) : (
                  <Button className="text-md" color="warning" variant="bordered" onPress={() => setIsEditMode(!isEditMode)}>
                    Sửa
                  </Button>
                )}
              </div>
              <Table selectionMode={isEditMode ? "none" : "multiple"} selectionBehavior="replace" aria-label="Example table with dynamic content" className="mt-7" fullWidth>
                <TableHeader>
                  <TableColumn key="1" width="70px">Id</TableColumn>
                  <TableColumn key="2" width="300px" allowsSorting onClick={() => requestSort('name')}>
                    Tên
                    {sortConfig.key === 'totalStudent' && (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼')}
                  </TableColumn>
                  <TableColumn key="3" width="300px">Trạng thái điểm danh</TableColumn>
                  <TableColumn key="5" width="200px">Hành động</TableColumn>
                </TableHeader>
                <TableBody items={sortedClasses} emptyContent={"Chưa có dữ liệu"}>
                  {sortedClasses.map((row, index) => (
                    <TableRow key={row.studentClassId}>
                      <TableCell>{row.id}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>
                        {isEditMode ? (
                          <RadioGroup
                            value={row.attendanceStatus}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) => {
                              const newAttendance = [...listAttendanceDetail];
                              newAttendance[index].attendanceStatus =
                                e.target.value;
                              setListAttendanceDetail(newAttendance);
                            }}
                            orientation="horizontal"
                          >
                            <Radio value="Vắng_mặt">Vắng mặt</Radio>
                            <Radio value="Có_mặt">Có mặt</Radio>
                          </RadioGroup>
                        ) : (
                          row.attendanceStatus.replace("_", " ")
                        )}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          ) : null}
        </div>
      </section>
    </DefaultLayout>
  );
}
