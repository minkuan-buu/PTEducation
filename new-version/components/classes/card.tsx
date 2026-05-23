import type { ReactNode } from "react";

export const Card = ({
    logo,
    title,
    description,
}: {
    logo?: ReactNode;
    title: string;
    description: string;
}) => {
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/10 text-blue-600">
                {typeof logo === "string" ? <span className="text-sm font-semibold">{logo}</span> : logo}
            </div>
            <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <p className="text-xl font-semibold text-slate-900">{description}</p>
            </div>
        </div>
    );
}