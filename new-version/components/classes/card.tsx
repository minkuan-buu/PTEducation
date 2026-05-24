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
        <div className="group flex items-center gap-3 rounded-2xl border p-4 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/20 text-blue-600 transition-transform duration-200 ease-out group-hover:scale-105">
                {typeof logo === "string" ? <span className="text-sm font-semibold">{logo}</span> : logo}
            </div>
            <div className="min-w-0">
                <p className="text-sm font-medium text-slate-400">{title}</p>
                <p className="text-xl font-semibold">{description}</p>
            </div>
        </div>
    );
}