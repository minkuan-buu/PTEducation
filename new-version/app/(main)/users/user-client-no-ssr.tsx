"use client";

import dynamic from "next/dynamic";

const UserClient = dynamic(() => import("./user-client"), {
    ssr: false,
});

export default function UserClientNoSSR() {
    return <UserClient />;
}