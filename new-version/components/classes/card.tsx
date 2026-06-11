import { cn } from "@heroui/react";
import type { ReactNode } from "react";

type ColorVariant = "blue" | "purple" | "emerald" | "cyan" | "amber" | "primary" | "default";

interface CardProps {
    logo?: ReactNode;
    title: string;
    description: ReactNode;
    color?: ColorVariant;
    className?: string;
    iconClassName?: string;
    titleClassName?: string;
    descriptionClassName?: string;
}

const colorStyles: Record<ColorVariant, { bg: string; text: string; hover: string }> = {
    blue: {
        bg: "bg-blue-600/20",
        text: "text-blue-600",
        hover: "hover:border-blue-200",
    },
    purple: {
        bg: "bg-purple-500/10",
        text: "text-purple-500",
        hover: "hover:border-purple-200",
    },
    emerald: {
        bg: "bg-emerald-500/10",
        text: "text-emerald-500",
        hover: "hover:border-emerald-200",
    },
    cyan: {
        bg: "bg-[#00b4d8]/10",
        text: "text-[#00b4d8]",
        hover: "hover:border-[#00b4d8]/50",
    },
    amber: {
        bg: "bg-amber-500/10",
        text: "text-amber-500",
        hover: "hover:border-amber-200",
    },
    primary: {
        bg: "bg-primary/10",
        text: "text-primary",
        hover: "hover:border-primary/20",
    },
    default: {
        bg: "bg-default-100",
        text: "text-foreground",
        hover: "hover:border-default-400",
    }
};

export const Card = ({
    logo,
    title,
    description,
    color = "blue",
    className,
    iconClassName,
    titleClassName,
    descriptionClassName,
}: CardProps) => {
    const style = colorStyles[color];

    return (
        <div className={cn("group flex items-center gap-4 rounded-2xl border border-divider p-5 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md bg-background/50 backdrop-blur-md", style.hover, className)}>
            {logo && (
                <div className={cn("flex p-3.5 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 ease-out group-hover:scale-105", style.bg, style.text, iconClassName)}>
                    {typeof logo === "string" ? <span className="text-sm font-semibold">{logo}</span> : logo}
                </div>
            )}
            <div className="min-w-0 flex-1">
                <p className={cn("text-xs font-medium text-muted-foreground uppercase tracking-wider", titleClassName)}>{title}</p>
                <div className={cn("text-xl font-bold mt-1 truncate", style.text, descriptionClassName)}>{description}</div>
            </div>
        </div>
    );
}