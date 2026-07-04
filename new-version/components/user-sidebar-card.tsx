"use client";

import { Avatar, Card } from "@heroui/react";
import { useRouter } from "next/navigation";

export type UserCardProps = {
    name: string;
    role: string;
    avatarUrl: string;
}

export const UserCard = ({ name, role, avatarUrl }: UserCardProps) => {
    const router = useRouter();
    return (
        <Card className="w-full rounded-xl px-3 cursor-pointer border border-transparent transition-all duration-300 hover:bg-default-100 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md hover:border-default-200 dark:hover:border-default-100" variant="secondary" onClick={() => router.push("/profile")}>
            <Card.Content className="flex flex-row gap-4">
                <div>
                    <Avatar size="md">
                        {avatarUrl ? (
                            <Avatar.Image
                                alt={name}
                                src={avatarUrl}
                            />
                        ) : null}
                        <Avatar.Fallback className="border-none bg-gradient-to-br from-[#00b4d8] to-[#90e0ef] text-white">
                            {name.split(" ").map((part) => part[0]).join("").slice(name.split(" ").length - 2, name.split(" ").length).toUpperCase()}
                        </Avatar.Fallback>
                    </Avatar>
                </div>
                <div className="flex flex-col line-clamp-1">
                    <span className="font-semibold text-sm">
                        {name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {role}
                    </span>
                </div>
            </Card.Content>
        </Card>
    )
}
