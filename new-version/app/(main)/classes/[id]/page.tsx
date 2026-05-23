import { Card } from "@/components/classes/card";
import { FaUser, FaUsers } from "react-icons/fa";
import { HiClipboardDocumentList } from "react-icons/hi2";
import { IoCalendarOutline } from "react-icons/io5";
import { TbPresentationAnalytics } from "react-icons/tb";

export default async function ClassDetailPage() {
    return (
        <main className="min-h-screen flex flex-col justify-start">
            <div className="py-6 px-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Lớp học</h1>
                        <p className="text-muted mt-2">Trang quản lý lớp học</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 pt-4">
                    <Card logo={<FaUsers className="w-5 h-5" />} title="Tổng số học sinh" description="40" />
                    <Card logo={<HiClipboardDocumentList className="w-5 h-5" />} title="Điểm trung bình của lớp" description="7.5" />
                    <Card logo={<IoCalendarOutline className="w-5 h-5" />} title="Số buổi học đã diễn ra" description="18/20" />
                    <Card logo={<TbPresentationAnalytics className="w-5 h-5" />} title="Tỉ lệ chuyên cần" description="85%" />
                </div>
            </div>
        </main>
    )
}