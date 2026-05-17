"use client";

import { Avatar, Card } from "@heroui/react";

export type UserCardProps = {
    name: string;
    role: string;
    avatarUrl: string;
}

export const UserCard = ({ name, role, avatarUrl }: UserCardProps) => {
    return (
        <Card className="w-full rounded-xl px-3" variant="secondary">
            <Card.Content className="flex flex-row gap-4">
                <div>
                    <Avatar size="md">
                        <Avatar.Image
                            alt={name}
                            src={avatarUrl}
                        />
                        <Avatar.Fallback className="border-none bg-gradient-to-br from-[#00b4d8] to-[#90e0ef] text-white">
                            {name.split(" ").map((part) => part[0]).join("").toUpperCase()}
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
