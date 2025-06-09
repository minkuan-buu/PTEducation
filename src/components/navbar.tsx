import { Button } from "@nextui-org/button";
import { Kbd } from "@nextui-org/kbd";
import { Link } from "@nextui-org/link";
import { Input } from "@nextui-org/input";
import {
  Navbar as NextUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
} from "@nextui-org/navbar";
import { link as linkStyles } from "@nextui-org/theme";
import clsx from "clsx";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import * as Yup from "yup";
import { useFormik } from "formik";
import {
  TwitterIcon,
  GithubIcon,
  DiscordIcon,
  HeartFilledIcon,
  SearchIcon,
  UserIcon,
  DropdownIcon,
  LogoutIcon,
} from "@/components/icons";
import { useDisclosure, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Dropdown, DropdownTrigger, DropdownMenu, DropdownSection, DropdownItem } from "@nextui-org/react";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/icons";
import {
  LOGIN,
  SENDOTP,
  VERIFYOTP,
  RESETPASSWORD
} from "../api/api";
import { Logout, LogoutResetPassword } from "@/pages/logout";
import { set } from "date-fns";

export const Navbar = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [onLoading, setOnLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isResetingPassword, setIsResetingPassword] = useState(false);
  const [isOTPTyping, setIsOTPTyping] = useState(false);
  const [isTypingPassword, setTypingPassword] = useState(false);
  const [OTPCreateAt, setOTPCreateAt] = useState<Date>(null);

  const handleResize = () => {
    setIsMobile(window.innerWidth <= 640);
  };

  useEffect(() => {
    handleResize(); // Check initially
    window.addEventListener('resize', handleResize); // Update on resize
    return () => window.removeEventListener('resize', handleResize); // Cleanup
  }, []);

  const formik = useFormik({
    initialValues: {
      username: "",
      password: "",
    },
    validationSchema: Yup.object({
      username: Yup.string().min(5, "Must be at least 5 characters").required("Required"),
      password: Yup.string().min(6, "Must be at least 6 characters").required("Required"),
    }),
    onSubmit: async (values) => {
      setOnLoading(true);
      try {
        const { isSuccess, res } = await LOGIN(values);

        if (!isSuccess) {
          let result = await res.json();
          alert(result.message);
        } else {
          let result = await res.json();

          localStorage.setItem(
            "isShowChangePassword",
            result.data.isNeedChangePassword ?? false.toString(),
          );
          localStorage.setItem(
            "isNeedToChangePassword",
            result.data.isNeedChangePassword ?? false.toString(),
          );
          localStorage.setItem("token", result.data.token);
          localStorage.setItem("role", result.data.role);
          localStorage.setItem("name", result.data.name);
          window.location.href = "/";
          CloseModal();
        }
      } catch (error) {
        console.log(error);
      } finally {
        setOnLoading(false);
      }
    },
  });

  const searchInput = (
    <Input
      aria-label="Search"
      classNames={{
        inputWrapper: "bg-default-100",
        input: "text-sm",
      }}
      endContent={
        <Kbd className="hidden lg:inline-block" keys={["command"]}>
          K
        </Kbd>
      }
      labelPlacement="outside"
      placeholder="Search..."
      startContent={
        <SearchIcon className="text-base text-default-400 pointer-events-none flex-shrink-0" />
      }
      type="search"
    />
  );

  function CloseModal() {
    onOpenChange();
    formik.resetForm();
  }

  return (
    <NextUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand className="gap-3 max-w-fit">
          <Link
            className="flex justify-start items-center gap-1"
            color="foreground"
            href="/"
          >
            <Logo />
            <p className="font-bold text-inherit">PT Education</p>
          </Link>
        </NavbarBrand>
        <div className="hidden lg:flex gap-4 justify-start ml-2">
          {localStorage.getItem("role") == "Admin" ||
            localStorage.getItem("role") == "Manager" ? (
            <>
              {siteConfig.navItemsAdmin.map((item) => (
                <NavbarItem key={item.href}>
                  <Link
                    className={clsx(
                      linkStyles({ color: "foreground" }),
                      "data-[active=true]:text-primary data-[active=true]:font-medium",
                    )}
                    color="foreground"
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                </NavbarItem>
              ))}
            </>
          ) : (
            <>
              {siteConfig.navItems.map((item) => (
                <NavbarItem key={item.href}>
                  <Link
                    className={clsx(
                      linkStyles({ color: "foreground" }),
                      "data-[active=true]:text-primary data-[active=true]:font-medium",
                    )}
                    color="foreground"
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                </NavbarItem>
              ))}
            </>
          )}

        </div>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        <NavbarItem className="hidden sm:flex gap-2">
          <ThemeSwitch />
        </NavbarItem>
        <Modal isOpen={isOpen} onOpenChange={CloseModal} placement={isMobile ? "top" : "center"} isDismissable={false} isKeyboardDismissDisabled={true}>
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>{isResetingPassword ? "Đặt lại mật khẩu" : "Đăng nhập"}</ModalHeader>
                <ModalBody>
                  {!isResetingPassword ? (
                    <>
                      <p>Đăng nhập để sử dụng các tính năng của PT Education</p>
                      <form onSubmit={formik.handleSubmit}>
                        <Input name="username" label="Tên đăng nhập" value={formik.values.username} onChange={formik.handleChange} placeholder="Id hoặc email" />
                        {formik.errors.username && formik.touched.username && (
                          <p style={{ color: "red" }}>{formik.errors.username}</p>
                        )}
                        <Input name="password" label="Mật khẩu" type="password" value={formik.values.password} onChange={formik.handleChange} placeholder="Nhập mật khẩu" className="mt-3" />
                        {formik.errors.password && formik.touched.password && (
                          <p style={{ color: "red" }}>{formik.errors.password}</p>
                        )}
                        <Button fullWidth id="send-code-button" color="primary" type="submit" isLoading={onLoading} style={{ marginTop: "2vh", marginBottom: "2vh" }}>
                          Tiếp tục
                        </Button>
                        <Button onClick={() => setIsResetingPassword(!isResetingPassword)}>Quên mật khẩu?</Button>
                      </form>
                    </>
                  ) : (
                    <>
                      {isOTPTyping ? (
                        <>
                          <p>Nhập mã OTP đã được gửi đến email của bạn</p>
                          <form onSubmit={formikVerifyOTPReset.handleSubmit}>
                            <Input name="otpCode" label="OTP Code" value={formikVerifyOTPReset.values.otpCode} onChange={formikVerifyOTPReset.handleChange} placeholder="Nhập OTP Code" />
                            {formikVerifyOTPReset.errors.otpCode && formikVerifyOTPReset.touched.otpCode && (
                              <p style={{ color: "red" }}>{formikVerifyOTPReset.errors.otpCode}</p>
                            )}
                            <p className="mt-2">Bạn chưa nhận được OTP? <Button className={`${canResend ? "cursor-pointer" : "cursor-not-allowed"} ml-2`} isLoading={onSendingOTP} isDisabled={!canResend || onSendingOTP} onClick={() => resendOTP()}>Gửi lại {canResend ? null : `sau ${minutesResend}:${secondsResend < 10 ? "0" : ""}${secondsResend}`}</Button></p>
                            <Button fullWidth id="send-code-button" color="primary" type="submit" isLoading={onLoading} style={{ marginTop: "2vh", marginBottom: "2vh" }}>
                              Tiếp tục
                            </Button>
                            <Button onClick={() => handleCancel()}>Quay lại đăng nhập</Button>
                          </form>
                        </>
                      ) : (
                        <>
                          {isTypingPassword ? (
                            <>
                              <p>Nhập mật khẩu mới</p>
                              <form onSubmit={formikPasswordReset.handleSubmit}>
                                <Input name="newPassword" label="Mật khẩu mới" type="password" value={formikPasswordReset.values.newPassword} onChange={formikPasswordReset.handleChange} placeholder="Nhập mật khẩu mới" />
                                {formikPasswordReset.errors.newPassword && formikPasswordReset.touched.newPassword && (
                                  <p style={{ color: "red" }}>{formikPasswordReset.errors.newPassword}</p>
                                )}
                                <Input name="confirmPassword" label="Nhập lại mật khẩu mới" type="password" className="mt-3" value={formikPasswordReset.values.confirmPassword} onChange={formikPasswordReset.handleChange} placeholder="Nhập lại mật khẩu mới" />
                                {formikPasswordReset.errors.confirmPassword && formikPasswordReset.touched.confirmPassword && (
                                  <p style={{ color: "red" }}>{formikPasswordReset.errors.confirmPassword}</p>
                                )}
                                <Button fullWidth id="send-code-button" color="primary" type="submit" isLoading={onLoading} style={{ marginTop: "2vh", marginBottom: "2vh" }}>
                                  Tiếp tục
                                </Button>
                                <Button onClick={() => handleCancel()}>Quay lại đăng nhập</Button>
                              </form>
                            </>
                          ) : (
                            <>
                              <p>Nhập email để đặt lại mật khẩu</p>
                              <form onSubmit={formikEnterMailReset.handleSubmit}>
                                <Input name="email" label="Email" value={formikEnterMailReset.values.email} onChange={formikEnterMailReset.handleChange} placeholder="Nhập email" />
                                {formikEnterMailReset.errors.email && formikEnterMailReset.touched.email && (
                                  <p style={{ color: "red" }}>{formikEnterMailReset.errors.email}</p>
                                )}
                                <Button fullWidth id="send-code-button" color="primary" type="submit" isLoading={onLoading} style={{ marginTop: "2vh", marginBottom: "2vh" }}>
                                  Tiếp tục
                                </Button>
                                <Button onClick={() => handleCancel()}>Quay lại đăng nhập</Button>
                              </form>
                            </>
                          )}
                        </>
                      )}
                    </>
                  )}
                </ModalBody>
              </>
            )}
          </ModalContent>
        </Modal>
        <NavbarItem className="hidden md:flex">
          {localStorage.getItem("token") == null ? (
            <Button
              isExternal
              as={Link}
              className="text-sm font-normal text-default-600 bg-default-100"
              // href={siteConfig.links.sponsor}
              onPress={onOpen}
              startContent={<UserIcon />}
              variant="flat"
            >
              Đăng nhập
            </Button>
          ) : (
            <Dropdown>
              <DropdownTrigger>
                <Button
                  id="user-button"
                  isExternal
                  as={Link}
                  className="text-sm font-normal text-default-600 bg-default-100 border-solid border-2 border-zinc-400"
                  // href={siteConfig.links.sponsor}
                  startContent={<UserIcon />}
                  endContent={<DropdownIcon />}
                  variant="flat"
                >
                  Chào, {localStorage.getItem("name")}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                className="shadow-xl"
                aria-label="Dropdown menu with icons"
                variant="bordered"
              >
                <DropdownSection aria-label="Profile & Actions" showDivider>
                  <DropdownItem key="info" startContent={<UserIcon />} href="/user/me">
                    Thông tin cá nhân
                  </DropdownItem>
                </DropdownSection>
                <DropdownItem
                  key="logout"
                  className="text-danger"
                  color="danger"
                  startContent={<LogoutIcon />}
                  onPress={() => Logout()}
                //startContent={<DeleteDocumentIcon />}
                >
                  Đăng xuất
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          )}
        </NavbarItem>
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        {/* <Link isExternal href={siteConfig.links.github}>
          <GithubIcon className="text-default-500" />
        </Link> */}
        <ThemeSwitch />
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu>
        {/* {searchInput} */}
        {localStorage.getItem("token") == null ? (
          <Button
            isExternal
            as={Link}
            className="text-sm font-normal text-default-600 bg-default-100"
            // href={siteConfig.links.sponsor}
            onPress={onOpen}
            startContent={<UserIcon />}
            variant="flat"
          >
            Đăng nhập
          </Button>
        ) : (
          <Dropdown>
            <DropdownTrigger>
              <Button
                id="user-button"
                isExternal
                as={Link}
                className="text-sm font-normal text-default-600 bg-default-100 border-solid border-2 border-zinc-400"
                // href={siteConfig.links.sponsor}
                startContent={<UserIcon />}
                endContent={<DropdownIcon />}
                variant="flat"
              >
                Chào, {localStorage.getItem("name")}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              className="shadow-xl"
              aria-label="Dropdown menu with icons"
              variant="bordered"
            >
              <DropdownSection aria-label="Profile & Actions" showDivider>
                <DropdownItem
                  key="info"
                  startContent={<UserIcon />}
                  href="/user/me"
                >
                  Thông tin cá nhân
                </DropdownItem>
              </DropdownSection>
              <DropdownItem
                key="logout"
                className="text-danger"
                color="danger"
                startContent={<LogoutIcon />}
                onPress={() => Logout()}
              //startContent={<DeleteDocumentIcon />}
              >
                Đăng xuất
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        )}
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {localStorage.getItem("role") == "Admin" ||
            localStorage.getItem("role") == "Manager" ? (
            <>
              {siteConfig.navMenuItemsAdmin.map((item, index) => (
                <NavbarMenuItem key={`${item}-${index}`}>
                  <Link
                    // color={
                    //   index === 3
                    //     ? "primary"
                    //     : index === siteConfig.navMenuItemsAdmin.length - 1
                    //       ? "danger"
                    //       : "foreground"
                    // }
                    color="foreground"
                    href={item.href}
                    size="lg"
                  >
                    {item.label}
                  </Link>
                </NavbarMenuItem>
              ))}
            </>
          ) : (
            <>
              {siteConfig.navMenuItems.map((item, index) => (
                <NavbarMenuItem key={`${item}-${index}`}>
                  <Link
                    // color={
                    //   index === 3
                    //     ? "primary"
                    //     : index === siteConfig.navMenuItems.length - 1
                    //       ? "danger"
                    //       : "foreground"
                    // }
                    color="foreground"
                    href={item.href}
                    size="lg"
                  >
                    {item.label}
                  </Link>
                </NavbarMenuItem>
              ))}
            </>
          )}
        </div>
      </NavbarMenu>
    </NextUINavbar>
  );
};
