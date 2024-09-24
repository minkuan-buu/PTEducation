import { Link } from "@nextui-org/link";
import { Snippet } from "@nextui-org/snippet";
import { Code } from "@nextui-org/code";
import { button as buttonStyles } from "@nextui-org/theme";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { GithubIcon } from "@/components/icons";
import { useEffect, useRef, useState } from "react";
import DefaultLayout from "@/layouts/default";
import { CHECKSERVER, GETMONTHTEST, GETSCORESTUDENT } from "../api/api";
import Logout from "./logout";
import { Card, CardBody, Select, SelectItem, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@nextui-org/react";
import { format, set } from "date-fns";

export default function IndexPage() {
  const [now, setNow] = useState(new Date());
  const [nowKey, setNowKey] = useState<string>("");
  const [monthYearData, setMonthYearData] = useState<MonthYearData[]>([]);
  const currentMonth = now.getMonth() + 1; // Tháng trong JavaScript bắt đầu từ 0
  const currentYear = now.getFullYear();
  const currentKey = `${currentMonth}/${currentYear}`; // Định dạng giá trị theo {tháng}/{năm}
  const [ScoreData, setScoreData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const handleResize = () => {
    setIsMobile(window.innerWidth <= 640);
  };

  useEffect(() => {
    handleResize(); // Check initially
    window.addEventListener('resize', handleResize); // Update on resize
    return () => window.removeEventListener('resize', handleResize); // Cleanup
  }, []);

  // State để lưu giá trị đã chọn
  const [selectedKey, setSelectedKey] = useState(currentKey);

  useEffect(() => {
    const checkServer = async () => {
      if(localStorage.getItem("token") == null) return;
      var token = localStorage.getItem("token");
      const { isSuccess, res } = await CHECKSERVER(token);
      if (!isSuccess) {
        Logout();
      }
    }

    const checkMonth = async() => {
      if (localStorage.getItem("token") == null) return;
      if (
        localStorage.getItem("role") == "Admin" ||
        localStorage.getItem("role") == "Manager"
      )
        return;
      var token = localStorage.getItem("token");
      const { isSuccess, res } = await GETMONTHTEST(token);

      if (isSuccess) {
        var result = await res.json();
        setNowKey(`${now.getMonth() + 1}/${now.getFullYear()}`);
        setMonthYearData(result.data);
      }
    };

    document.title = "PT Education";
    checkServer();
    checkMonth();
  }, [localStorage.getItem("token")]);

  useEffect(() => {
    setIsLoading(true);
    const loadScore = async() => {
      if (localStorage.getItem("token") == null) return;
      var token = localStorage.getItem("token");

      if (
        localStorage.getItem("role") == "Admin" ||
        localStorage.getItem("role") == "Manager"
      )
        return;
      var date = selectedKey.split("/");
      var dateReq = {
        month: parseInt(date[0]),
        year: parseInt(date[1])
      };
      const { isSuccess, res } = await GETSCORESTUDENT(token, dateReq);

      if (isSuccess) {
        var result = await res.json();

        setScoreData(result.data);
        setIsLoading(false);
      }
    };

    loadScore();
  }, [selectedKey]);

  const formatScoreDate = (date: Date): string => {
    return format(date, 'dd/MM/yyyy');
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-lg text-center justify-center">
          {/* <h1 className={title()}>Make&nbsp;</h1> */}
          <h1 className={title({ color: "violet" })}>PT Education&nbsp;</h1>
          {/* <br />
          <h1 className={title()}>
            websites regardless of your design experience.
          </h1> */}
          {localStorage.getItem("role") == "Admin" || localStorage.getItem("role") == "Manager" ? (
            <>
              {now.getHours() < 12 ? (
                <h4 className={subtitle({ class: "mt-4" })}>
                  Chào buổi sáng, <strong>{localStorage.getItem("name")}</strong>
                </h4>
              ) : now.getHours() < 18 ? (
                <h4 className={subtitle({ class: "mt-4" })}>
                  Chào buổi chiều, <strong>{localStorage.getItem("name")}</strong>
                </h4>
              ) : (
                <h4 className={subtitle({ class: "mt-4" })}>
                  Chào buổi tối, <strong>{localStorage.getItem("name")}</strong>
                </h4>
              )}
            </>
          ) : !localStorage.getItem("role") ? (
            <>
              <h4 className={subtitle({ class: "mt-4" })}>
                Đăng nhập để tiếp tục
              </h4>
            </>
          ) : (
            <div className="flex flex-col justify-between items-center min-w-96">
              <Select
                items={monthYearData}
                label="Tra điểm theo tháng"
                placeholder="Chọn tháng kiểm tra"
                className="min-w-full mt-3"
                defaultSelectedKeys={[currentKey]} // Đặt giá trị mặc định
                onChange={(keys) => {
                  const newKey = keys.target.value; // keys là mảng, lấy phần tử đầu tiên
                  setSelectedKey(newKey); // Cập nhật trạng thái với giá trị mới
                  console.log(newKey); // In ra giá trị đã chọn
                }}
              >
                {monthYearData.map((item) => (
                  <SelectItem
                    key={item.id}
                    value={`${item.month}/${item.year}`}
                    textValue={`Tháng ${item.month}/${item.year}`}
                  >
                    Tháng {`${item.month}/${item.year}`}
                  </SelectItem>
                ))}
              </Select>
              {!isLoading ? (
                <>
                  {!isMobile ? (
                    <div className="flex flex-col gap-2 mt-7 min-w-full overflow-x-auto ">
                      <Table selectionMode="multiple" selectionBehavior="replace" aria-label="Example table with dynamic content" className="min-w-full w-auto" fullWidth>
                        <TableHeader>
                          <TableColumn key="1" width="70px">Id</TableColumn>
                          <TableColumn key="2" width="500px">Tên</TableColumn>
                          {ScoreData.scores.map((score) => (
                            <TableColumn key={score.testDateAt} width="300px">{`Ngày ${formatScoreDate(score.testDateAt)}`}</TableColumn>
                          ))}
                        </TableHeader>
                        <TableBody items={ScoreData} emptyContent={"Chưa có dữ liệu"}>
                          <TableRow key="1">
                            <TableCell>{ScoreData.id}</TableCell>
                            <TableCell>{ScoreData.name}</TableCell>
                            {ScoreData.scores && ScoreData.scores.map((row, index) => (
                              <TableCell>{row.score}</TableCell>
                            ))}
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-2 mt-7 min-w-full overflow-x-auto ">
                        <Card
                          isBlurred
                          className="border-none bg-background/60 dark:bg-default-100/50 max-w-full mt-5"
                          shadow="sm"
                        >
                          <CardBody>
                            <div className="grid grid-cols-2 gap-2 pl-6 pt-1 pb-1 shadow-md">
                              <div>
                                <div>
                                  <strong>Id</strong>
                                </div>
                                <div>{ScoreData.id}</div>
                              </div>
                              <div>
                                <div>
                                  <strong>Tên</strong>
                                </div>
                                <div>{ScoreData.name}</div>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      </div>
                      <div className="flex flex-col gap-2 mt-7 min-w-full overflow-x-auto ">
                        <Table selectionMode="multiple" selectionBehavior="replace" aria-label="Example table with dynamic content" className="min-w-full w-auto" fullWidth>
                          <TableHeader>
                            <TableColumn key="1" width="300px">Ngày kiểm tra</TableColumn>
                            <TableColumn key="2" width="500px">Điểm</TableColumn>
                          </TableHeader>
                          <TableBody items={ScoreData} emptyContent={"Chưa có dữ liệu"}>
                            {ScoreData.scores && ScoreData.scores.map((row, index) => (
                                <TableRow key={index}>
                                  <TableCell>{`Ngày ${formatScoreDate(row.testDateAt)}`}</TableCell>
                                  <TableCell>{row.score}</TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </>
              ) : null}
            </div>
          )}
        </div>
        {localStorage.getItem("token") == null || localStorage.getItem("role") != "Student" ? (
        <div className="flex gap-3">
          <Link
            isExternal
            className={buttonStyles({
              color: "primary",
              radius: "full",
              variant: "shadow",
            })}
            href={siteConfig.links.pteducation}
          >
            Truy cập E-Learning
          </Link>
          {/* <Link
            isExternal
            className={buttonStyles({ variant: "bordered", radius: "full" })}
            href={siteConfig.links.github}
          >
            <GithubIcon size={20} />
            GitHub
          </Link> */}
        </div>
        ) : null}
        {/* <div className="mt-8">
          <Snippet hideCopyButton hideSymbol variant="bordered">
            <span>
              Get started by editing{" "}
              <Code color="primary">pages/index.tsx</Code>
            </span>
          </Snippet>
        </div> */}
      </section>
    </DefaultLayout>
  );
}
