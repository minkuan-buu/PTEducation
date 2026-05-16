"use client";

import { Avatar, Card } from "@heroui/react";



export const UserCard = () => {
    return (
        <Card className="w-full rounded-xl px-3" variant="secondary">
            <Card.Content className="flex flex-row gap-4">
                <div>
                    <Avatar size="md">
                        <Avatar.Image
                            alt="Jane"
                            src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/blue.jpg"
                        />
                        <Avatar.Fallback delayMs={600}>JD</Avatar.Fallback>
                    </Avatar>
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-sm">
                        Đoàn Ngọc Minh Quân
                    </span>
                    <span className="text-xs text-muted-foreground">
                        Role
                    </span>
                </div>
            </Card.Content>
        </Card>
    )
}
