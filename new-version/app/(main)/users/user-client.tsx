import { Tabs } from "@heroui/react";

export default function UserClient() {
    return (
        <main className="min-h-screen pt-15 flex flex-col justify-start">
            <div className="p-8">
                <h1 className="text-2xl font-bold">Người dùng</h1>
                <p className="text-muted mt-2">Trang quản lý người dùng</p>
                <div className="mt-4">
                    <Tabs className="w-full max-w-md">
                        <Tabs.ListContainer>
                            <Tabs.List aria-label="Options">
                                <Tabs.Tab id="students">
                                    Học sinh
                                    <Tabs.Indicator />
                                </Tabs.Tab>
                                <Tabs.Tab id="teachers">
                                    Giảng viên
                                    <Tabs.Indicator />
                                </Tabs.Tab>
                            </Tabs.List>
                        </Tabs.ListContainer>
                        <Tabs.Panel className="pt-2" id="students">
                            <p>View your project overview and recent activity.</p>
                        </Tabs.Panel>
                        <Tabs.Panel className="pt-2" id="teachers">
                            <p>Track your metrics and analyze performance data.</p>
                        </Tabs.Panel>
                    </Tabs>
                </div>
            </div>
        </main>
    );
}