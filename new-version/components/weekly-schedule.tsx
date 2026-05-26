"use client";

import React, { useMemo } from "react";

export type EventItem = {
    id: string;
    title: string;
    day: number;
    start: string;
    end: string;
    colorTheme?: "blue" | "purple" | "green" | "orange";
};

function parseTime(value?: string) {
    // Nếu value không tồn tại, trả về giờ mặc định là 0:00 để tránh lỗi split undefined
    if (!value) return { hour: 0, minute: 0 };

    const [hh, mm] = value.split(":").map((v) => parseInt(v, 10));
    return { hour: hh || 0, minute: mm || 0 };
}

const colorMap: Record<string, string> = {
    blue: "bg-blue-100/90 border-blue-300 text-blue-900 dark:bg-blue-500/20 dark:border-blue-500/30 dark:text-blue-200",
    purple: "bg-purple-100/90 border-purple-300 text-purple-900 dark:bg-purple-500/20 dark:border-purple-500/30 dark:text-purple-200",
    green: "bg-green-100/90 border-green-300 text-green-900 dark:bg-green-500/20 dark:border-green-500/30 dark:text-green-200",
    orange: "bg-orange-100/90 border-orange-300 text-orange-900 dark:bg-orange-500/20 dark:border-orange-500/30 dark:text-orange-200",
    default: "bg-indigo-50/90 border-indigo-200 text-indigo-900 dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-200"
};

export default function WeeklySchedule({
    events = [],
    hoursStart = 8,
    hoursEnd = 21,
}: {
    events?: EventItem[];
    hoursStart?: number;
    hoursEnd?: number;
}) {
    const dayNames = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];

    let displayStart = hoursStart;
    let displayEnd = hoursEnd;

    if (events.length > 0) {
        let minStart = Infinity;
        let maxEnd = -Infinity;
        events.forEach((ev) => {
            const s = parseTime(ev.start);
            const e = parseTime(ev.end);
            const startVal = s.hour + s.minute / 60;
            const endVal = e.hour + e.minute / 60;
            if (!Number.isNaN(startVal)) minStart = Math.min(minStart, startVal);
            if (!Number.isNaN(endVal)) maxEnd = Math.max(maxEnd, endVal);
        });

        if (minStart !== Infinity && maxEnd !== -Infinity) {
            displayStart = Math.max(0, Math.floor(minStart));
            displayEnd = Math.min(24, Math.ceil(maxEnd));
        }
    }

    const hours = Array.from(
        { length: displayEnd - displayStart + 1 },
        (_, i) => displayStart + i
    );

    const activeDays = useMemo(() => {
        const activeDaySet = new Set<number>();
        events.forEach((ev) => {
            if (typeof ev.day === "number" && ev.day >= 0 && ev.day <= 6) {
                activeDaySet.add(ev.day);
            }
        });
        return events.length === 0
            ? [0, 1, 2, 3, 4, 5, 6]
            : Array.from(activeDaySet).sort((a, b) => a - b);
    }, [events]);

    const ROW_HEIGHT = 64;
    const OFFSET_Y = 24;
    const totalHeight = (hours.length - 1) * ROW_HEIGHT + OFFSET_Y * 2;

    const rightContentWidth = activeDays.length > 3
        ? `${(activeDays.length / 3) * 100}%`
        : '100%';

    return (
        <div className="w-full rounded-2xl">
            {/* Lớp vỏ ngoài cùng - Đã gộp thành 1 Container cuộn duy nhất (overflow-auto) */}
            <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl overflow-auto shadow-sm max-h-[600px] relative custom-scrollbar">

                {/* Container co giãn để chứa nội dung tràn ngang */}
                <div className="flex flex-col" style={{ width: rightContentWidth, minWidth: '100%' }}>

                    {/* 1. STICKY HEADER ROW (Dính trên cùng) */}
                    <div className="flex sticky top-0 z-40 bg-slate-50 dark:bg-neutral-800 border-b border-slate-200 dark:border-neutral-800 h-14 shadow-sm">

                        {/* Góc vuông trên cùng bên trái - Phải dính cả Top và Left với Z-index cao nhất */}
                        <div className="w-20 shrink-0 sticky left-0 z-50 bg-slate-50 dark:bg-neutral-800 border-r border-slate-200 dark:border-neutral-800"></div>

                        {/* Tên các ngày */}
                        <div className="flex-1 flex">
                            {activeDays.map((dayIdx) => (
                                <div key={dayIdx} className="flex-1 flex items-center justify-center text-sm font-semibold text-slate-700 dark:text-neutral-300 border-r border-slate-200 dark:border-neutral-700/50 last:border-r-0">
                                    {dayNames[dayIdx]}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 2. BODY ROW (Nội dung lưới và sự kiện) */}
                    <div className="flex relative" style={{ height: `${totalHeight}px` }}>

                        {/* Trục thời gian bên trái (Chỉ cần dính Left) */}
                        <div className="w-20 shrink-0 sticky left-0 z-30 bg-white dark:bg-neutral-900 border-r border-slate-200 dark:border-neutral-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                            {hours.map((hour, i) => (
                                <div
                                    key={hour}
                                    className="absolute w-full flex justify-center text-xs font-medium text-slate-400 dark:text-neutral-500"
                                    style={{ top: `${i * ROW_HEIGHT + OFFSET_Y - 8}px` }}
                                >
                                    <span className="bg-white dark:bg-neutral-900 px-1">{String(hour).padStart(2, "0")}:00</span>
                                </div>
                            ))}
                        </div>

                        {/* Không gian lưới và thẻ học */}
                        <div className="flex-1 relative">

                            {/* Lưới kẻ ngang và dọc */}
                            <div className="absolute inset-0 pointer-events-none">
                                {/* Các đường ngang */}
                                {hours.map((hour, i) => {
                                    const y = i * ROW_HEIGHT + OFFSET_Y;
                                    return (
                                        <React.Fragment key={hour}>
                                            <div className="absolute w-full border-b border-slate-200 dark:border-neutral-800 z-0" style={{ top: `${y}px` }}></div>
                                            {i < hours.length - 1 && (
                                                <div className="absolute w-full border-b border-dashed border-slate-200 dark:border-neutral-800/70 z-0" style={{ top: `${y + ROW_HEIGHT / 2}px` }}></div>
                                            )}
                                        </React.Fragment>
                                    );
                                })}

                                {/* Các đường dọc chia cột */}
                                <div className="absolute inset-0 flex">
                                    {activeDays.map((dayIdx) => (
                                        <div key={dayIdx} className="flex-1 border-r border-slate-100 dark:border-neutral-800/50 last:border-r-0"></div>
                                    ))}
                                </div>
                            </div>

                            {/* Render thẻ sự kiện */}
                            <div className="absolute inset-0 flex">
                                {activeDays.map((dayIdx) => (
                                    <div key={dayIdx} className="flex-1 relative">
                                        {events
                                            .filter((ev) => ev.day === dayIdx)
                                            .map((ev) => {
                                                const s = parseTime(ev.start);
                                                const endT = parseTime(ev.end);

                                                const startVal = s.hour + s.minute / 60;
                                                const endVal = endT.hour + endT.minute / 60;

                                                const topPx = (startVal - displayStart) * ROW_HEIGHT + OFFSET_Y;
                                                const heightPx = (endVal - startVal) * ROW_HEIGHT;

                                                const styleClass = colorMap[ev.colorTheme || "default"];

                                                return (
                                                    <div
                                                        key={ev.id}
                                                        className={`absolute left-1.5 right-1.5 rounded-lg border flex flex-col p-3 shadow-sm hover:shadow-md transition-all z-20 overflow-hidden backdrop-blur-sm ${styleClass}`}
                                                        style={{
                                                            top: `${topPx}px`,
                                                            height: `${heightPx}px`,
                                                        }}
                                                    >
                                                        <div className="font-semibold text-sm truncate mb-1">
                                                            {ev.title}
                                                        </div>
                                                        <div className="text-xs opacity-80">
                                                            {ev.start} - {ev.end}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}