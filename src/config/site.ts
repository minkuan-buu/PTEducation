export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Vite + NextUI",
  description: "Make beautiful websites regardless of your design experience.",
  navItems: [
    {
      label: "Điểm kiểm tra",
      href: "/",
    },
    {
      label: "Điểm danh",
      href: "/attendance",
    },
    // {
    //   label: "Pricing",
    //   href: "/pricing",
    // },
    // {
    //   label: "Blog",
    //   href: "/blog",
    // },
    // {
    //   label: "About",
    //   href: "/about",
    // },
  ],
  navItemsAdmin: [
    {
      label: "Quản lý lớp học",
      href: "/manage-classes",
    },
    {
      label: "Quản lý trợ giảng",
      href: "/manage-assistants",
    },
  ],
  navMenuItemsAdmin: [
    {
      label: "Quản lý lớp học",
      href: "/manage-classes",
    },
    {
      label: "Quản lý trợ giảng",
      href: "/manage-assistants",
    },
    // {
    //   label: "Logout",
    //   href: "/logout",
    // },
  ],
  navMenuItems: [
    {
      label: "Điểm kiểm tra",
      href: "/",
    },
    {
      label: "Điểm danh",
      href: "/attendance",
    },
    // {
    //   label: "Projects",
    //   href: "/projects",
    // },
    // {
    //   label: "Team",
    //   href: "/team",
    // },
    // {
    //   label: "Calendar",
    //   href: "/calendar",
    // },
    // {
    //   label: "Settings",
    //   href: "/settings",
    // },
    // {
    //   label: "Help & Feedback",
    //   href: "/help-feedback",
    // },
    // {
    //   label: "Logout",
    //   href: "/logout",
    // },
  ],
  links: {
    github: "https://github.com/nextui-org/nextui",
    twitter: "https://twitter.com/getnextui",
    docs: "https://nextui-docs-v2.vercel.app",
    discord: "https://discord.gg/9b6yyZKmH4",
    sponsor: "https://patreon.com/jrgarciadev",
    pteducation: "http://pteducation.edu.vn",
  },
};
