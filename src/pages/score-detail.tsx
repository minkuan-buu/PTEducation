import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { GETSCORE, UPDATESCOREDETAIL } from "../api/api";
import { format } from "date-fns";
import {
  BreadcrumbItem,
  Breadcrumbs,
  Button,
  Card,
  CardBody,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Link,
  Input,
} from "@heroui/react";

export default function ScoreDetail() {
  const [scoreDetail, setScoreDetail] = useState < any > ({});
  const [listScoreDetail, setListScoreDetail] = useState <
    { studentClassId: string; id: number; name: string; score: number; note: string }[]
    > ([]);
  const [loading, setLoading] = useState(true);
  const [handling, setHandling] = useState(false);
  const { id, scoreId } = useParams();
  const [sortConfig, setSortConfig] = useState < { key: string | null; direction: string } > ({
    key: null,
    direction: "ascending",
  });
  const [isEditMode, setIsEditMode] = useState(false);

  // ref để giữ giá trị đang chỉnh sửa
  const editingValuesRef = useRef < Record < string, { score: string; note: string
}>> ({});

const sortedClasses = [...listScoreDetail].sort((a, b) => {
  if (sortConfig.key) {
    const sortOrder = sortConfig.direction === "ascending" ? 1 : -1;
    if (a[sortConfig.key] < b[sortConfig.key]) return -1 * sortOrder;
    if (a[sortConfig.key] > b[sortConfig.key]) return 1 * sortOrder;
    return 0;
  }
  return 0;
});

const requestSort = (key: string) => {
  let direction = "ascending";
  if (sortConfig.key === key && sortConfig.direction === "ascending") {
    direction = "descending";
  }
  setSortConfig({ key, direction });
};

useEffect(() => {
  const getScore = async () => {
    const token = localStorage.getItem("token");
    const { isSuccess, res } = await GETSCORE(token, scoreId);

    if (!isSuccess || res.status === 401) {
      window.location.href = "/";
    } else {
      const result = await res.json();

      setLoading(false);
      setScoreDetail(result.data);
      document.title = `Lớp ${result.data.className} - Điểm "Ngày ${formatScoreDate(
        result.data.testDateAt
      )}"`;
      setListScoreDetail(result.data.scoreDetails);

      // khởi tạo editingValuesRef
      const initValues: Record<string, { score: string; note: string }> = {};
      result.data.scoreDetails.forEach((s: any) => {
        initValues[s.studentClassId] = {
          score: s.score?.toString() ?? "",
          note: s.note ?? "",
        };
      });
      editingValuesRef.current = initValues;
    }
  };

  getScore();
}, [scoreId]);

const formatScoreDate = (date: Date): string => {
  return format(date, "dd/MM/yyyy");
};

async function handleSaveEdit() {
  setHandling(true);
  try {
    const token = localStorage.getItem("token");
    const body = {
      id: scoreId,
      scoreReqList: listScoreDetail.map((item) => ({
        studentClassId: item.studentClassId,
        score: Number(editingValuesRef.current[item.studentClassId]?.score ?? item.score),
        note: editingValuesRef.current[item.studentClassId]?.note ?? item.note,
      })),
    };

    const { isSuccess, res } = await UPDATESCOREDETAIL(token, body);

    if (!isSuccess || res.status === 401) {
      window.location.href = "/";
    } else {
      const result = await res.json();
      alert(result.message);

      // cập nhật lại listScoreDetail
      setListScoreDetail((prev) =>
        prev.map((item) => ({
          ...item,
          score: Number(editingValuesRef.current[item.studentClassId]?.score ?? item.score),
          note: editingValuesRef.current[item.studentClassId]?.note ?? item.note,
        }))
      );

      setIsEditMode(false);
    }
  } catch (error) {
    console.log(error);
  } finally {
    setHandling(false);
  }
}

return (
  <DefaultLayout>
    <section className="flex flex-col gap-4 py-8 md:py-10">
      <div className="inline-block">
        {!loading ? (
          <>
            <Breadcrumbs className="mb-5">
              <BreadcrumbItem href="/manage-classes">Tất cả lớp</BreadcrumbItem>
              <BreadcrumbItem href={`/class/${id}#score`}>
                Lớp {scoreDetail.className}
              </BreadcrumbItem>
              <BreadcrumbItem href={`/class/${id}/score/${scoreId}`}>
                Điểm "{`Ngày ${formatScoreDate(scoreDetail.testDateAt)}`}"
              </BreadcrumbItem>
            </Breadcrumbs>
            <h1 className={title()}>
              Lớp {scoreDetail.className} - Điểm "
              {`Ngày ${formatScoreDate(scoreDetail.testDateAt)}`}"
            </h1>
            <Card
              isBlurred
              className="border-none bg-background/50 dark:bg-default-200/50 max-w-full mt-5"
              shadow="md"
            >
              <CardBody>
                <div className="grid grid-cols-3 gap-12 pl-12 pt-1 pb-1">
                  <div>
                    <div>
                      <strong>Ngày kiểm tra</strong>
                    </div>
                    <div>
                      {scoreDetail.testDateAt
                        ? formatScoreDate(scoreDetail.testDateAt)
                        : null}
                    </div>
                  </div>
                  <div>
                    <div>
                      <strong>Ngày tạo</strong>
                    </div>
                    <div>
                      {scoreDetail.createdAt
                        ? formatScoreDate(scoreDetail.createdAt)
                        : null}
                    </div>
                  </div>
                  <div>
                    <div>
                      <strong>Được tạo bởi</strong>
                    </div>
                    <div>
                      <Link href={`/user/${scoreDetail.createBy.id}`}>
                        {scoreDetail.createBy.name}
                      </Link>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
            <div className="flex justify-between items-center">
              <strong>
                <h2 className="mt-10 text-xl mb-3">Thông tin điểm</h2>
              </strong>
              {isEditMode ? (
                <Button
                  className="text-md"
                  color="success"
                  variant="bordered"
                  onPress={() => handleSaveEdit()}
                  isLoading={handling}
                >
                  Lưu
                </Button>
              ) : (
                <Button
                  className="text-md"
                  color="warning"
                  variant="bordered"
                  onPress={() => setIsEditMode(!isEditMode)}
                >
                  Sửa
                </Button>
              )}
            </div>
            <Table
              selectionMode={isEditMode ? "none" : "multiple"}
              selectionBehavior="replace"
              aria-label="Example table with dynamic content"
              className="mt-7"
              fullWidth
            >
              <TableHeader>
                <TableColumn key="1" width="70px">
                  Mã học sinh
                </TableColumn>
                <TableColumn
                  key="2"
                  width="300px"
                  allowsSorting
                  onClick={() => requestSort("name")}
                >
                  Tên
                </TableColumn>
                <TableColumn key="3" width="300px">
                  Điểm
                </TableColumn>
                <TableColumn key="5" width="200px">
                  Ghi chú
                </TableColumn>
              </TableHeader>
              <TableBody items={sortedClasses} emptyContent={"Chưa có dữ liệu"}>
                {sortedClasses.map((row) => (
                  <TableRow key={row.studentClassId}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>
                      {isEditMode ? (
                        <Input
                          type="number"
                          defaultValue={editingValuesRef.current[row.studentClassId]?.score ?? ""}
                          onChange={(e) => {
                            editingValuesRef.current[row.studentClassId] = {
                              ...editingValuesRef.current[row.studentClassId],
                              score: e.target.value,
                            };
                          }}
                        />
                      ) : (
                        row.score
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditMode ? (
                        <Input
                          type="text"
                          defaultValue={editingValuesRef.current[row.studentClassId]?.note ?? ""}
                          onChange={(e) => {
                            editingValuesRef.current[row.studentClassId] = {
                              ...editingValuesRef.current[row.studentClassId],
                              note: e.target.value,
                            };
                          }}
                        />
                      ) : (
                        row.note
                      )}
                    </TableCell>
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
