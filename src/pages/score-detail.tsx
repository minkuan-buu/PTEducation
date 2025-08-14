import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { GETSCORE, UPDATESCOREDETAIL } from "../api/api";
import { format, set } from "date-fns";
import { BreadcrumbItem, Breadcrumbs, Button, Card, CardBody, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Link } from "@heroui/react";
import { Input } from "@heroui/react";

export default function ScoreDetail() {
  const [scoreDetail, setScoreDetail] = useState({});
  const [listScoreDetail, setListScoreDetail] = useState<{ studentClassId: string, id: number, name: string, score: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [handling, setHandling] = useState(false);
  const { id, scoreId } = useParams();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [isEditMode, setIsEditMode] = useState(false);

  const sortedClasses = [...listScoreDetail].sort((a, b) => {
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
      const { isSuccess, res } = await GETSCORE(token, scoreId);

      if (!isSuccess || res.status == 401) {
        window.location.href = "/";
      } else {
        var result = await res.json();

        setLoading(false);
        setScoreDetail(result.data);
        document.title = `Lớp ${result.data.className} - Điểm "Ngày ${formatScoreDate(result.data.testDateAt)}"`;
        setListScoreDetail(result.data.scoreDetails);
      }
    }

    getScore();
  }, []);

  const formatScoreDate = (date: Date): string => {
    return format(date, 'dd/MM/yyyy');
  };

  function handleSaveEdit() {
    setHandling(true);
    const updateScoreDetail = async () => {
      try {
        var token = localStorage.getItem("token");
        var body = {
          "id": scoreId,
          "scoreReqList": []
        }

        listScoreDetail.forEach((item) => {
          var scoreReq = {
            "studentClassId": item.studentClassId,
            "score": item.score
          }

          body.scoreReqList.push(scoreReq);
        })
        const { isSuccess, res } = await UPDATESCOREDETAIL(token, body);

        if (!isSuccess || res.status == 401) {
          window.location.href = "/";
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

    updateScoreDetail();
  }

  return (
    <DefaultLayout>
      <section className="flex flex-col gap-4 py-8 md:py-10">
        <div className="inline-block">
          {!loading ? (
            <>
              <Breadcrumbs className="mb-5">
                <BreadcrumbItem href="/manage-classes">Tất cả lớp</BreadcrumbItem>
                <BreadcrumbItem href={`/class/${id}#score`}>{scoreDetail.className}</BreadcrumbItem>
                <BreadcrumbItem href={`/class/${id}/score/${scoreId}`}>Điểm "{`Ngày ${formatScoreDate(scoreDetail.testDateAt)}`}"</BreadcrumbItem>
              </Breadcrumbs>
              <h1 className={title()}>Lớp {scoreDetail.className} - Điểm "{`Ngày ${formatScoreDate(scoreDetail.testDateAt)}`}"</h1>
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
                      <div>{scoreDetail.testDateAt ? formatScoreDate(scoreDetail.testDateAt) : null}</div>
                    </div>
                    <div>
                      <div>
                        <strong>Ngày tạo</strong>
                      </div>
                      <div>{scoreDetail.createdAt ? formatScoreDate(scoreDetail.createdAt) : null}</div>
                    </div>
                    <div>
                      <div>
                        <strong>Được tạo bởi</strong>
                      </div>
                      <div>
                        <Link href={`/user/${scoreDetail.createBy.id}`}>{scoreDetail.createBy.name}</Link>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
              <div className="flex justify-between items-center">
                <strong><h2 className={"mt-10 text-xl mb-3"}>Thông tin điểm</h2></strong>
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
                  <TableColumn key="3" width="300px">Điểm</TableColumn>
                  <TableColumn key="5" width="200px">Hành động</TableColumn>
                </TableHeader>
                <TableBody items={sortedClasses} emptyContent={"Chưa có dữ liệu"}>
                  {sortedClasses.map((row, index) => (
                    <TableRow key={row.studentClassId}>
                      <TableCell>{row.id}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>
                        {isEditMode ? (
                          <Input
                            type="number"
                            value={row.score.toString()}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const newScore = [...listScoreDetail];

                              // Chuyển đổi giá trị từ chuỗi sang số (nếu cần)
                              newScore[index].score = Number(e.target.value);
                              setListScoreDetail(newScore);
                            }}
                          />
                        ) : (
                          row.score
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
