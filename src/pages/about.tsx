import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import { Button, Card, CardBody, Input, Modal, ModalBody, ModalContent, ModalHeader, useDisclosure } from "@nextui-org/react";
import { useEffect, useState } from "react";
import { GETMYPROFILE, CHANGEPASSWORD } from "../api/api";
import { useFormik } from "formik";
import * as Yup from "yup";

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

  const formikChangePassword = useFormik({
    initialValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      oldPassword: Yup.string().min(6, "Must be at least 6 characters").required("Bắt buộc"),
      newPassword: Yup.string().min(6, "Must be at least 6 characters").required("Bắt buộc"),
      confirmPassword: Yup.string().min(6, "Must be at least 6 characters").required("Bắt buộc"),
    }),
    onSubmit: async (values) => {
      setHandling(true);
      var token = localStorage.getItem("token");
      const { isSuccess, res } = await CHANGEPASSWORD(token, values);

      if (!isSuccess) {
        if (res.status == 401) {
          alert("Phiên đăng nhập hết hạn");
          window.location.href = "/";
        } else {
          var result = await res.json();

          alert(result.message);
        }
      } else {
        var result = await res.json();

        alert("Đổi mật khẩu thành công");
        CloseModal();
      }
      setHandling(false);
    }
  });

  function CloseModal() {
    onOpenChange();
    formikChangePassword.resetForm();
  }

  return (
    <DefaultLayout>
      <section className="flex flex-col gap-4 py-8 md:py-10">
        <div className="inline-block max-w-full">
          <div className="flex justify-between">
            <h1 className={title()}>Thông tin cá nhân</h1>
            <Modal
              isDismissable={false}
              isKeyboardDismissDisabled={true}
              placement={isMobile ? "top" : "center"}
              isOpen={isOpen}
              onOpenChange={CloseModal}
              size="4xl"
            >
              <ModalContent>
                {(onClose) => (
                  <>
                    <ModalHeader>Đổi mật khẩu</ModalHeader>
                    <ModalBody>
                      <p>Thay đổi mật khẩu mới</p>
                      <form onSubmit={formikChangePassword.handleSubmit}>
                        <Input
                          label="Mật khẩu cũ"
                          name="oldPassword"
                          placeholder="Nhập mật khẩu cũ"
                          type="password"
                          value={formikChangePassword.values.oldPassword}
                          onChange={formikChangePassword.handleChange}
                        />
                        {formikChangePassword.errors.oldPassword &&
                          formikChangePassword.touched.oldPassword && (
                            <p style={{ color: "red" }}>
                              {formikChangePassword.errors.oldPassword}
                            </p>
                          )}
                        <Input
                          className="mt-3"
                          label="Mật khẩu mới"
                          name="newPassword"
                          placeholder="Nhập mật khẩu mới"
                          type="password"
                          value={formikChangePassword.values.newPassword}
                          onChange={formikChangePassword.handleChange}
                        />
                        {formikChangePassword.errors.newPassword &&
                          formikChangePassword.touched.newPassword && (
                            <p style={{ color: "red" }}>
                              {formikChangePassword.errors.newPassword}
                            </p>
                          )}
                        <Input
                          className="mt-3"
                          label="Xác nhận mật khẩu"
                          name="confirmPassword"
                          placeholder="Nhập lại mật khẩu mới"
                          type="password"
                          value={formikChangePassword.values.confirmPassword}
                          onChange={formikChangePassword.handleChange}
                        />
                        {formikChangePassword.errors.confirmPassword &&
                          formikChangePassword.touched.confirmPassword && (
                            <p style={{ color: "red" }}>
                              {formikChangePassword.errors.confirmPassword}
                            </p>
                        )}
                        <Button
                          fullWidth
                          color="primary"
                          id="send-code-button"
                          isLoading={handling}
                          style={{ marginTop: "2vh", marginBottom: "2vh" }}
                          type="submit"
                        >
                          Đổi
                        </Button>
                      </form>
                    </ModalBody>
                  </>
                )}
              </ModalContent>
            </Modal>
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
