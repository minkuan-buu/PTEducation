import { useEffect, useState, useRef } from "react";

interface Option {
    id: string;
    name: string;
}

interface CustomSelectProps {
    label: string;
    placeholder?: string;
    options: Option[];
    selectedKeys: Set<string>;
    onSelectionChange: (keys: Set<string>) => void;
}

export default function CustomSelect({
    label,
    placeholder,
    options,
    selectedKeys,
    onSelectionChange
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const idRef = useRef < string > (crypto.randomUUID()); // Unique ID cho mỗi select
    const selectedId = Array.from(selectedKeys)[0];
    const selectedOption = options.find((o) => o.id === selectedId);

    // Khi mở select, gửi sự kiện để các select khác đóng lại
    const triggerRef = useRef < HTMLDivElement > (null);
    const [dropdownTop, setDropdownTop] = useState(0);
    const [dropdownLeft, setDropdownLeft] = useState(0);
    const [dropdownWidth, setDropdownWidth] = useState(0);
    const theme = localStorage.getItem("theme") || "light";

    const handleToggleOpen = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        if (newState && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setDropdownTop(rect.bottom + window.scrollY);
            setDropdownLeft(rect.left + window.scrollX);
            setDropdownWidth(rect.width);
        }
        if (newState) {
            window.dispatchEvent(new CustomEvent("custom-select-open", { detail: idRef.current }));
        }
    };

    // Đóng nếu sự kiện phát ra từ select khác
    useEffect(() => {
        const handleOtherSelectOpen = (e: Event) => {
            const event = e as CustomEvent;
            if (event.detail !== idRef.current) {
                setIsOpen(false);
            }
        };
        window.addEventListener("custom-select-open", handleOtherSelectOpen);
        return () => {
            window.removeEventListener("custom-select-open", handleOtherSelectOpen);
        };
    }, []);

    return (
        <div className="relative w-full mb-4">
            <label className="block text-sm text-gray-500 mb-1">{label}</label>
            <div
                ref={triggerRef}
                className={`border px-4 py-2 rounded-md cursor-pointer ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-800"} shadow-sm min-h-12 flex items-center justify-between`}
                onClick={handleToggleOpen}
                role="button"
                tabIndex={0}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        handleToggleOpen();
                    }
                }}
            >
                <span className={`truncate ${selectedOption ? "" : "text-gray-500"}`}>{selectedOption?.name || placeholder || "Tùy chọn..."}</span>
                <span className="ml-2">▾</span>
            </div>

            {isOpen && (
                <div
                    className={`fixed mt-1 border rounded-md shadow-md z-[9999] max-h-60 overflow-y-auto ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}
                    style={{
                        top: dropdownTop,
                        left: dropdownLeft,
                        width: dropdownWidth
                    }}
                >
                    {options.map((opt) => (
                        <div
                            key={opt.id}
                            className={`px-4 py-2 ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"} cursor-pointer ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-800"} ${selectedId === opt.id ? "bg-gray-200 font-semibold" : ""}`}
                            role="option"
                            tabIndex={0}
                            aria-selected={selectedId === opt.id}
                            onClick={() => {
                                onSelectionChange(new Set([opt.id]));
                                setIsOpen(false);
                            }}
                        >
                            {opt.name}
                        </div>
                    ))}
                </div>
            )}

        </div>
    );
}
