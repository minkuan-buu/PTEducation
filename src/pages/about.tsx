import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import { Button, Card, CardBody, Input, Modal, ModalBody, ModalContent, ModalHeader, useDisclosure } from "@heroui/react";
import { useEffect, useState } from "react";
import { GETMYPROFILE } from "../api/api";
import { useFormik } from "formik";
import * as Yup from "yup";
import { ChangePassword } from "@/components/changePassword";

export default function MyProfile() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [profile, setProfile] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const [handling, setHandling] = useState(false);

  const handleResize = () => {
    setIsMobile(window.innerWidth <= 640);
  };

  useEffect(() => {
    handleResize(); // Check initially
    window.addEventListener('resize', handleResize); // Update on resize
    return () => window.removeEventListener('resize', handleResize); // Cleanup
  }, []);

  useEffect(() => {
    const getProfile = async () => {
      var token = localStorage.getItem("token");
      const { isSuccess, res } = await GETMYPROFILE(token);

      if (!isSuccess || res.status == 401) {
        //window.location.href = "/";
      } else {
        var result = await res.json();
        setProfile(result.data);
      }
    }

    getProfile();
  }, []);

  return (
    <DefaultLayout>
      <section className="flex flex-col gap-4 py-8 md:py-10">
        <div className="inline-block max-w-full">
          <div className="flex justify-between">
            <h1 className={title()}>Thông tin cá nhân</h1>
            <ChangePassword
              handling={handling}
              isMobile={isMobile}
              isOpen={isOpen}
              onOpenChange={onOpenChange}
              setHandling={setHandling}
            />
            {!isMobile ? (
              <Button
                className="text-md"
                color="success"
                variant="bordered"
                onPress={onOpen}
              >
                Đổi mật khẩu
              </Button>
            ) : null}
          </div>
          {isMobile ? (
            <>
              <Card
                isBlurred
                className="border-none bg-background/60 dark:bg-default-100/50 max-w-full mt-5"
                shadow="sm"
              >
                <CardBody>
                  <div className="grid grid-cols-1 gap-3 pl-6 pt-1 pb-1 shadow-md">
                    <div>
                      <div>
                        <strong>Id</strong>
                      </div>
                      <div>{profile ? profile.id : null}</div>
                    </div>
                    <div>
                      <div>
                        <strong>Tên</strong>
                      </div>
                      <div>{profile ? profile.name : null}</div>
                    </div>
                    <div>
                      <div>
                        <strong>Email</strong>
                      </div>
                      <div>{profile ? profile.email : null}</div>
                    </div>
                    <div>
                      <div>
                        <strong>Phone</strong>
                      </div>
                      <div>{profile ? profile.phone : null}</div>
                    </div>
                    {localStorage.getItem("role") == "Student" ? (
                      <div>
                        <div>
                          <strong>Lớp đang học</strong>
                        </div>
                        <div>{profile ? profile.className : null}</div>
                      </div>
                    ) : null}
                  </div>
                </CardBody>
              </Card>
              <Button
                className="text-md mt-3"
                color="success"
                variant="bordered"
                onPress={onOpen}
              >
                Đổi mật khẩu
              </Button>
            </>
          ) : (
            <Card
              isBlurred
              className="border-none bg-background/60 dark:bg-default-100/50 max-w-full mt-5"
              shadow="sm"
            >
              <CardBody>
                <div className="grid grid-cols-4 gap-6 pl-12 pt-1 pb-1 shadow-md">
                  <div>
                    <div>
                      <strong>Id</strong>
                    </div>
                    <div>{profile ? profile.id : null}</div>
                  </div>
                  <div>
                    <div>
                      <strong>Tên</strong>
                    </div>
                    <div>{profile ? profile.name : null}</div>
                  </div>
                  <div>
                    <div>
                      <strong>Email</strong>
                    </div>
                    <div>{profile ? profile.email : null}</div>
                  </div>
                  <div>
                    <div>
                      <strong>Phone</strong>
                    </div>
                    <div>{profile ? profile.phone : null}</div>
                  </div>
                  {localStorage.getItem("role") == "Student" ? (
                    <div>
                      <div>
                        <strong>Lớp đang học</strong>
                      </div>
                      <div>{profile ? profile.className : null}</div>
                    </div>
                  ) : null}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </section>
    </DefaultLayout>
  );
}
