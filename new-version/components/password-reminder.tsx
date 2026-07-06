"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/user-context";
import ModalChangePassword from "@/components/users/modal-change-password";

export function PasswordReminder() {
    const { user } = useUser();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (user && user.isNeedChangePassword) {
            const today = new Date().toLocaleDateString("vi-VN");
            const lastReminder = localStorage.getItem("lastPasswordReminder");

            if (lastReminder !== today) {
                setIsOpen(true);
                localStorage.setItem("lastPasswordReminder", today);
            }
        }
    }, [user]);

    if (!user) return null;

    return (
        <ModalChangePassword
            isOpen={isOpen}
            setOpen={setIsOpen}
            close={() => setIsOpen(false)}
        />
    );
}
