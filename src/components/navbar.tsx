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
import { useDisclosure, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Dropdown, DropdownTrigger, DropdownMenu, DropdownSection, DropdownItem  } from "@nextui-org/react";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/icons";
import {
  LOGIN
} from "../api/api";
import Logout from "@/pages/logout";

export const Navbar = () => {
  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  const [onLoading, setOnLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  function CloseModal(){
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
                <ModalHeader>Đăng nhập</ModalHeader>
                <ModalBody>
                  <p>Đăng nhập để sử dụng các tính năng của PT Education</p>
                  <form onSubmit={formik.handleSubmit}>
                    <Input name="username" label="Tên đăng nhập" value={formik.values.username} onChange={formik.handleChange} placeholder="Id hoặc email"/>
                    {formik.errors.username && formik.touched.username && (
                      <p style={{ color: "red" }}>{formik.errors.username}</p>
                    )}
                    <Input name="password" label="Mật khẩu" type="password" value={formik.values.password} onChange={formik.handleChange} placeholder="Nhập mật khẩu" className="mt-3"/>
                    {formik.errors.password && formik.touched.password && (
                      <p style={{ color: "red" }}>{formik.errors.password}</p>
                    )}
                    <Button fullWidth id="send-code-button" color="primary" type="submit" isLoading={onLoading} style={{ marginTop: "2vh", marginBottom:"2vh"}}>
                      Tiếp tục
                    </Button>
                  </form>
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
