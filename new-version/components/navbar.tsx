"use client";

import { useState } from "react";
import { Button, Kbd, Link, TextField, InputGroup, Avatar, Description, Label, Header, Dropdown, Separator } from "@heroui/react";
import NextLink from "next/link";
import clsx from "clsx";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import {
  TwitterIcon,
  GithubIcon,
  DiscordIcon,
  HeartFilledIcon,
  SearchIcon,
  Logo,
} from "@/components/icons";
import { CiFloppyDisk, CiSquarePlus } from "react-icons/ci";
import { BiFolderOpen } from "react-icons/bi";
import { IoPerson, IoTrashBin } from "react-icons/io5";
import { LuLogOut } from "react-icons/lu";
import { IoMdSettings } from "react-icons/io";
import { TbLogout } from "react-icons/tb";
import { FiChevronDown } from "react-icons/fi";

type NavbarProps = {
  isSidebarOpen?: boolean;
};

export const Navbar = ({ isSidebarOpen = false }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const searchInput = (
    <TextField aria-label="Search" type="search">
      <InputGroup>
        <InputGroup.Prefix>
          <SearchIcon className="text-base text-muted pointer-events-none flex-shrink-0" />
        </InputGroup.Prefix>
        <InputGroup.Input
          className="text-sm"
          aria-label="Search"
          id="nav-search-input"
          name="nav-search"
          placeholder="Search..."
        />
        <InputGroup.Suffix>
          <Kbd className="hidden lg:inline-flex">
            <Kbd.Abbr keyValue="command" />
            <Kbd.Content>K</Kbd.Content>
          </Kbd>
        </InputGroup.Suffix>
      </InputGroup>
    </TextField>
  );

  return (
    <nav className="fixed top-0 z-40 w-full border-b border-separator bg-background/70 backdrop-blur-lg">
      <header className="ml-auto flex h-16 max-w-[83vw] items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-4">
          <NextLink className="flex items-center gap-1" href="https://pteducation.edu.vn/" target="_blank" rel="noopener noreferrer">
            {/* <Logo /> */}
            <Button variant="primary" size="lg" className="bg-gradient-to-tr from-[#48cae4] to-[#00b4d8] hover:scale-103 transition-transform">
              Truy cập E-Learning
            </Button>
          </NextLink>
          <ul className="hidden lg:flex gap-4 ml-2">
            {/* {siteConfig.navItems.map((item) => (
              <li key={item.href}>
                <NextLink
                  className={clsx(
                    "text-foreground hover:text-accent transition-colors",
                    "data-[active=true]:text-accent data-[active=true]:font-medium",
                  )}
                  href={item.href}
                >
                  {item.label}
                </NextLink>
              </li>
            ))} */}
          </ul>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          {/* <Link
            aria-label="Twitter"
            href={siteConfig.links.twitter}
            rel="noopener noreferrer"
            target="_blank"
          >
            <TwitterIcon className="text-muted" />
          </Link>
          <Link
            aria-label="Discord"
            href={siteConfig.links.discord}
            rel="noopener noreferrer"
            target="_blank"
          >
            <DiscordIcon className="text-muted" />
          </Link>
          <Link
            aria-label="Github"
            href={siteConfig.links.github}
            rel="noopener noreferrer"
            target="_blank"
          >
            <GithubIcon className="text-muted" />
          </Link> */}
          {/* <ThemeSwitch /> */}
          <div className="hidden lg:flex">{searchInput}</div>
          <div className="hidden md:flex">
            {/* <Button
              className="text-sm font-normal"
              variant="tertiary"
              onPress={() => window.open(siteConfig.links.sponsor, "_blank")}
            >
              <HeartFilledIcon className="text-danger" />
              Sponsor
            </Button> */}
            <Dropdown isOpen={isUserMenuOpen} onOpenChange={setIsUserMenuOpen}>
              <Dropdown.Trigger className="rounded-full">
                <div className="relative">
                  <Avatar>
                    <Avatar.Image
                      alt="Blue"
                      src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/blue.jpg"
                    />
                    <Avatar.Fallback>ON</Avatar.Fallback>
                  </Avatar>
                  <span className="absolute right-0 bottom-0 grid size-4 place-items-center rounded-full not-dark:bg-white dark:bg-black ring-2 ring-background">
                    <FiChevronDown
                      className={clsx(
                        "size-3 text-muted transition-transform",
                        isUserMenuOpen && "rotate-180",
                      )}
                      aria-hidden="true"
                    />
                  </span>
                </div>
              </Dropdown.Trigger>
              <Dropdown.Popover>
                <div className="px-3 pt-3 pb-1">
                  <div className="flex items-center gap-2">
                    <Avatar size="sm">
                      <Avatar.Image
                        alt="Jane"
                        src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/blue.jpg"
                      />
                      <Avatar.Fallback delayMs={600}>JD</Avatar.Fallback>
                    </Avatar>
                    <div className="flex flex-col gap-0">
                      <p className="text-sm leading-5 font-medium">Jane Doe</p>
                      <p className="text-xs leading-none text-muted">jane@example.com</p>
                    </div>
                  </div>
                </div>
                <Dropdown.Menu>
                  <Dropdown.Item id="profile" textValue="Profile">
                    <div className="flex w-full items-center justify-between gap-2">
                      <Label>Hồ sơ </Label>
                      <IoPerson className="size-4 text-muted" />
                    </div>
                  </Dropdown.Item>
                  <Dropdown.Item id="settings" textValue="Settings">
                    <div className="flex w-full items-center justify-between gap-2">
                      <Label>Cài đặt</Label>
                      <IoMdSettings className="size-4 text-muted" />
                    </div>
                  </Dropdown.Item>
                  <Dropdown.Item id="logout" textValue="Logout" variant="danger">
                    <div className="flex w-full items-center justify-between gap-2">
                      <Label>Đăng xuất</Label>
                      <TbLogout className="size-4 text-danger" />
                    </div>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>

          </div>
        </div>

        <div className="flex sm:hidden items-center gap-2">
          <Link
            aria-label="Github"
            href={siteConfig.links.github}
            rel="noopener noreferrer"
            target="_blank"
          >
            <GithubIcon className="text-muted" />
          </Link>
          {/* <ThemeSwitch /> */}
          <button
            aria-expanded={isMenuOpen}
            aria-label="Toggle menu"
            className="p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  d="M6 18L18 6M6 6l12 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              ) : (
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              )}
            </svg>
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <div className="border-t border-separator sm:hidden">
          <div className="p-4">{searchInput}</div>
          <ul className="flex flex-col gap-2 px-4 pb-4">
            {/* {siteConfig.navMenuItems.map((item, index) => (
              <li key={`${item.label}-${index}`}>
                <Link
                  className={clsx(
                    "block py-2 text-lg no-underline",
                    index === 2
                      ? "text-accent"
                      : index === siteConfig.navMenuItems.length - 1
                        ? "text-danger"
                        : "text-foreground",
                  )}
                  href="#"
                >
                  {item.label}
                </Link>
              </li>
            ))} */}
          </ul>
        </div>
      )}
    </nav>
  );
};
