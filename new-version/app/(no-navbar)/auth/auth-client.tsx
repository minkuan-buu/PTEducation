'use client';

import { useEffect, useState } from "react";
import {
    Button,
    Card,
    Description,
    FieldError,
    Fieldset,
    FieldsetLegend,
    Input,
    InputGroup,
    Label,
    ListBox,
    Select,
    Spinner,
    Switch,
    TextField,
    toast
} from "@heroui/react";
import { motion } from "framer-motion";
import { v2 } from "@/services/api";
import { AxiosError } from "axios";
import { useUser } from "@/context/user-context";
import { useTheme } from "next-themes";
import { useRouter, useSearchParams } from "next/navigation";
import { RegisterPayload } from "@/services/api/v2";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";

type ClassOption = {
    id: string;
    name: string;
};

type AuthClientProps = {
    classOptions: ClassOption[];
    nextPath?: string;
};

export default function AuthClient({ classOptions, nextPath }: AuthClientProps) {
    const { resolvedTheme } = useTheme();
    const { setUser } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isMounted, setIsMounted] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [isShowPassword, setIsShowPassword] = useState(false);
    const [registerStudent, setRegisterStudent] = useState<{ name: string; email: string; phone: string; class: string; school: string }>({ name: "", email: "", phone: "", class: "", school: "" });
    const [guardianList, setGuardianList] = useState<Array<{ id: string; name: string; email: string; phone: string; relation: string; isPrimary: boolean }>>([{ id: "g-0", name: "", email: "", phone: "", relation: "Ba", isPrimary: true }]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const getInputVariant = () => {
        return isMounted && resolvedTheme === "dark" ? "secondary" : undefined;
    };

    function normalizeNextPath(rawNext?: string | null) {
        if (!rawNext) {
            return "/";
        }

        if (rawNext.startsWith("/") && !rawNext.startsWith("//")) {
            return rawNext;
        }

        try {
            const decoded = decodeURIComponent(rawNext);
            if (decoded.startsWith("/") && !decoded.startsWith("//")) {
                return decoded;
            }
        } catch {
            // ignore decode errors
        }

        return "/";
    }

    function getSafeNextPath() {
        const nextFromQuery = searchParams.get("next");
        return normalizeNextPath(nextFromQuery ?? nextPath);
    }

    function handleInputChange() {
        if (loginError) {
            setLoginError(null);
        }
    }

    function generateId() {
        return `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function handleAddGuardian() {
        setGuardianList((prev) => [...prev, { id: generateId(), name: "", email: "", phone: "", relation: "Ba", isPrimary: false }]);
    }

    function handleRemoveGuardian(id: string) {
        setGuardianList((prev) => {
            const removed = prev.find((g) => g.id === id);
            const next = prev.filter((g) => g.id !== id);

            if (!removed?.isPrimary || next.length === 0) {
                return next;
            }

            return next.map((g, index) => ({ ...g, isPrimary: index === 0 }));
        });
    }

    function handleGuardianPrimaryChange(id: string) {
        setGuardianList((prev) =>
            prev.map((g) => (g.id === id ? { ...g, isPrimary: true } : { ...g, isPrimary: false }))
        );
    }

    function handleGuardianFieldChange(
        id: string,
        field: "name" | "email" | "phone" | "relation",
        value: string,
    ) {
        setGuardianList((prev) =>
            prev.map((g) => (g.id === id ? { ...g, [field]: value } : g))
        );
    }

    async function handleLoginSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoginError(null);
        setIsSubmitting(true);

        try {
            const formData = new FormData(event.currentTarget);
            const username = String(formData.get("username") ?? "");
            const password = String(formData.get("password") ?? "");

            const result = await v2.login({
                username,
                password,
            });

            setUser({
                id: result.data.id,
                phoneNumber: result.data.phoneNumber,
                name: result.data.name,
                email: result.data.email,
                role: result.data.role,
            });

            router.push(getSafeNextPath());

            console.log("login success:", result);
        } catch (error) {
            const axiosError = error as AxiosError<{ message?: string }>;
            setLoginError(
                axiosError.response?.data?.message ??
                "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.",
            );
            console.error("login error:", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleRegisterSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        console.log("Registering student:", registerStudent);
        console.log("Guardians:", guardianList);
        var reqRegister: RegisterPayload = {
            name: registerStudent.name,
            email: registerStudent.email,
            phone: registerStudent.phone,
            school: registerStudent.school,
            classId: registerStudent.class,
            guardians: guardianList.map((g) => ({
                name: g.name,
                email: g.email,
                phone: g.phone,
                relationship: g.relation,
                isPrimary: g.isPrimary,
            })),
        }
        console.log("Register payload:", reqRegister);

        try {
            const result = await v2.register(reqRegister);
            console.log("Registration success:", result);
            toast.success("Đăng ký thành công! Vui lòng chờ xét duyệt và đăng nhập lại.");
            // alert("Đăng ký thành công! Vui lòng chờ xét duyệt và đăng nhập lại.");
            setIsRegistering(false);
        } catch (error) {
            console.error("Registration error:", error);
            toast.danger("Đăng ký thất bại. Vui lòng thử lại.");
        }
    }

    const guardianOptions = [
        { value: "Ba", label: "Ba" },
        { value: "Mẹ", label: "Mẹ" },
        { value: "Anh", label: "Anh" },
        { value: "Chị", label: "Chị" },
        { value: "Em", label: "Em" },
        { value: "Cô", label: "Cô" },
        { value: "Dì", label: "Dì" },
        { value: "Chú", label: "Chú" },
        { value: "Bác", label: "Bác" },
        { value: "Ông", label: "Ông" },
        { value: "Bà", label: "Bà" },
        { value: "Khác", label: "Khác" },
    ];

    return (
        <section className="auth-page-bg relative isolate flex h-full w-full items-center justify-center overflow-hidden">
            <div className="pointer-events-none absolute inset-0">
                <div className="auth-glow-left absolute left-[-8%] top-[-6%] h-[34rem] w-[34rem] rounded-full blur-3xl" />
                <div className="auth-glow-right absolute right-[-2%] top-[2%] h-[28rem] w-[28rem] rounded-full blur-3xl" />
                <div className="auth-glow-bottom absolute left-1/2 top-[82%] h-[26rem] w-[40rem] -translate-x-1/2 rounded-full blur-3xl" />
                <div className="auth-glow-top absolute left-1/2 top-[18%] h-[12rem] w-[22rem] -translate-x-1/2 rounded-full blur-3xl" />
            </div>

            <div className="relative flex h-full w-full items-center justify-center">
                <div className={`relative px-4 flex items-center justify-center ${!isRegistering ? "w-full" : "w-[85%]"}`}>
                    {/* Login Card */}
                    {!isRegistering && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            <Card className="min-w-[26vw] border border-divider/70 bg-content1/80 p-8 shadow-xl shadow-black/10 backdrop-blur-md">
                                <form autoComplete="on" onSubmit={handleLoginSubmit}>
                                    <Fieldset className="w-full">
                                        <FieldsetLegend className="text-2xl font-bold text-foreground">PT Education</FieldsetLegend>
                                        <Description className="mb-2 text-muted">Đăng nhập để tiếp tục</Description>
                                        <Fieldset.Group>
                                            <TextField
                                                isRequired
                                                name="username"
                                                validate={(value) => {
                                                    if (value.length < 6) {
                                                        return "Tên đăng nhập cần ít nhất 6 ký tự";
                                                    }

                                                    return null;
                                                }}
                                            >
                                                <Label htmlFor="username" className="font-medium text-foreground/80">
                                                    Tên đăng nhập
                                                </Label>
                                                <Input
                                                    suppressHydrationWarning
                                                    variant={getInputVariant()}
                                                    autoComplete="username"
                                                    id="username"
                                                    fullWidth
                                                    name="username"
                                                    onChange={handleInputChange}
                                                    placeholder="Nhập ID hoặc email"
                                                    type="text"
                                                />
                                                <FieldError />
                                            </TextField>
                                            <TextField
                                                isRequired
                                                name="password"
                                                validate={(value) => {
                                                    if (value.length < 6) {
                                                        return "Mật khẩu cần ít nhất 6 ký tự";
                                                    }

                                                    return null;
                                                }}
                                            >
                                                <Label htmlFor="password" className="font-medium text-foreground/80">
                                                    Mật khẩu
                                                </Label>

                                                <InputGroup variant={getInputVariant()}>
                                                    <InputGroup.Input
                                                        suppressHydrationWarning
                                                        autoComplete="current-password"
                                                        id="password"
                                                        name="password"
                                                        onChange={handleInputChange}
                                                        placeholder="Nhập mật khẩu"
                                                        type={isShowPassword ? "text" : "password"}
                                                    />
                                                    <InputGroup.Suffix>
                                                        <button
                                                            className="focus:outline-none flex items-center justify-center"
                                                            type="button"
                                                            onClick={() => setIsShowPassword(!isShowPassword)} // Nhớ gắn hàm toggle của bạn vào đây
                                                            aria-label="Toggle password visibility"
                                                        >
                                                            {isShowPassword ? (
                                                                <FaRegEyeSlash className="text-xl text-default-400" />
                                                            ) : (
                                                                <FaRegEye className="text-xl text-default-400" />
                                                            )}
                                                        </button>
                                                    </InputGroup.Suffix>
                                                </InputGroup>
                                                <FieldError />
                                            </TextField>
                                            {loginError ? (
                                                <p className="text-sm text-danger">{loginError}</p>
                                            ) : null}
                                            <button
                                                className="w-full flex flex-row items-center justify-center gap-4 bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:bg-blue-600/70"
                                                disabled={isSubmitting}
                                                type="submit"
                                            >
                                                {isSubmitting ? <Spinner color="current" size="md" /> : null}
                                                {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
                                            </button>
                                        </Fieldset.Group>
                                    </Fieldset>
                                </form>
                                <p className="mt-4 text-sm text-muted">
                                    Chưa có tài khoản?{" "}
                                    <button
                                        className="text-blue-600 hover:underline"
                                        onClick={() => setIsRegistering(true)}
                                        type="button"
                                    >
                                        Đăng ký ngay
                                    </button>
                                </p>
                            </Card>
                        </motion.div>
                    )}

                    {/* Register Card */}
                    {isRegistering && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="w-[85%] py-8 mx-auto"
                        >
                            <div className="flex flex-col items-center">
                                <h2 className="text-3xl font-bold text-foreground mb-2">PT Education</h2>
                                <p className="text-muted mb-6">Điền thông tin để đăng ký tài khoản mới</p>
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                {/* Left Card - Student Info */}
                                <Card className="border border-divider/70 bg-content1/80 p-8 shadow-xl shadow-black/10 backdrop-blur-md">
                                    <form autoComplete="on" onSubmit={handleRegisterSubmit}>
                                        <Fieldset className="w-full">
                                            <FieldsetLegend className="text-2xl font-bold text-foreground">Thông tin học viên</FieldsetLegend>
                                            <Description className="text-muted">Điền thông tin và chọn lớp phù hợp</Description>
                                            <Fieldset.Group>
                                                <TextField
                                                    isRequired
                                                    name="reg-username"
                                                >
                                                    <Label htmlFor="reg-username" className="font-medium text-foreground/80">
                                                        Họ và tên
                                                    </Label>
                                                    <Input
                                                        suppressHydrationWarning
                                                        variant={getInputVariant()}
                                                        autoComplete="name"
                                                        id="reg-username"
                                                        value={registerStudent.name}
                                                        onChange={(e) => setRegisterStudent({ ...registerStudent, name: e.target.value })}
                                                        fullWidth
                                                        name="reg-username"
                                                        placeholder="Họ và tên"
                                                        type="text"
                                                    />
                                                    <FieldError />
                                                </TextField>
                                                <TextField
                                                    isRequired
                                                    name="email"
                                                >
                                                    <Label htmlFor="email" className="font-medium text-foreground/80">
                                                        Email
                                                    </Label>
                                                    <Input
                                                        suppressHydrationWarning
                                                        variant={getInputVariant()}
                                                        autoComplete="email"
                                                        id="email"
                                                        value={registerStudent.email}
                                                        onChange={(e) => setRegisterStudent({ ...registerStudent, email: e.target.value })}
                                                        fullWidth
                                                        name="email"
                                                        placeholder="Nhập email"
                                                        type="email"
                                                    />
                                                    <FieldError />
                                                </TextField>
                                                <TextField
                                                    isRequired
                                                    name="class"
                                                >
                                                    <Label htmlFor="class" className="font-medium text-foreground/80">
                                                        Lớp học
                                                    </Label>
                                                    <Select
                                                        variant={getInputVariant()}
                                                        id="class"
                                                        className="w-full"
                                                        placeholder="Chọn lớp học"
                                                        value={registerStudent.class}
                                                        onChange={(value) => {
                                                            if (value !== null) {
                                                                setRegisterStudent({ ...registerStudent, class: String(value) });
                                                            }
                                                        }}
                                                    >
                                                        <Select.Trigger>
                                                            <Select.Value />
                                                            <Select.Indicator />
                                                        </Select.Trigger>
                                                        <Select.Popover>
                                                            <ListBox>
                                                                {classOptions.map((option) => (
                                                                    <ListBox.Item key={option.id} id={option.id} textValue={option.name}>
                                                                        {option.name}
                                                                        <ListBox.ItemIndicator />
                                                                    </ListBox.Item>
                                                                ))}
                                                            </ListBox>
                                                        </Select.Popover>
                                                    </Select>
                                                    <FieldError />
                                                </TextField>
                                                <TextField
                                                    isRequired
                                                    name="phone"
                                                >
                                                    <Label htmlFor="phone" className="font-medium text-foreground/80">
                                                        Số điện thoại
                                                    </Label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            suppressHydrationWarning
                                                            variant={getInputVariant()}
                                                            id="phone"
                                                            fullWidth
                                                            name="phone"
                                                            placeholder="Vị dụ: 0909xxxxxx"
                                                            type="tel"
                                                            value={registerStudent.phone}
                                                            onChange={(e) => setRegisterStudent({ ...registerStudent, phone: e.target.value })}
                                                        />
                                                    </div>
                                                    <FieldError />
                                                </TextField>
                                                <TextField
                                                    isRequired
                                                    name="school"
                                                >
                                                    <Label htmlFor="school" className="font-medium text-foreground/80">
                                                        Lớp - Trường đang học (bổ sung nếu chưa có)
                                                    </Label>
                                                    <Input
                                                        suppressHydrationWarning
                                                        variant={getInputVariant()}
                                                        id="school"
                                                        fullWidth
                                                        name="school"
                                                        value={registerStudent.school}
                                                        onChange={(e) => setRegisterStudent({ ...registerStudent, school: e.target.value })}
                                                        placeholder="Vị dụ: Lớp 10A1 - Trần Đại Nghĩa"
                                                        type="text"
                                                    />
                                                    <FieldError />
                                                </TextField>
                                                <div className="space-y-4 border-t border-divider pt-4" />
                                                <h3 className="font-semibold text-foreground">Thông tin phụ huynh</h3>
                                                {guardianList.map((guardian) => (
                                                    <div key={guardian.id} className="space-y-4 border border-divider p-5 rounded-2xl">
                                                        <TextField isRequired name="parent-name">
                                                            <Label htmlFor="parent-name" className="font-medium text-foreground/80">
                                                                Họ và tên
                                                            </Label>
                                                            <Input
                                                                suppressHydrationWarning
                                                                variant={getInputVariant()}
                                                                id="parent-name"
                                                                fullWidth
                                                                value={guardian.name}
                                                                name="parent-name"
                                                                placeholder="Họ và tên"
                                                                type="text"
                                                                onChange={(e) => handleGuardianFieldChange(guardian.id, "name", e.target.value)}
                                                            />
                                                            <FieldError />
                                                        </TextField>
                                                        <TextField name="parent-email" isRequired>
                                                            <Label htmlFor="parent-email" className="font-medium text-foreground/80">
                                                                Email
                                                            </Label>
                                                            <Input
                                                                suppressHydrationWarning
                                                                variant={getInputVariant()}
                                                                id="parent-email"
                                                                fullWidth
                                                                value={guardian.email}
                                                                name="parent-email"
                                                                placeholder="Email"
                                                                type="email"
                                                                onChange={(e) => handleGuardianFieldChange(guardian.id, "email", e.target.value)}
                                                            />
                                                            <FieldError />
                                                        </TextField>
                                                        <TextField isRequired name="parent-phone">
                                                            <Label htmlFor="parent-phone" className="font-medium text-foreground/80">
                                                                SDT phụ huynh
                                                            </Label>
                                                            <Input
                                                                suppressHydrationWarning
                                                                variant={getInputVariant()}
                                                                id="parent-phone"
                                                                fullWidth
                                                                value={guardian.phone}
                                                                name="parent-phone"
                                                                placeholder="Vị dụ: 0909xxxxxx"
                                                                type="tel"
                                                                onChange={(e) => handleGuardianFieldChange(guardian.id, "phone", e.target.value)}
                                                            />
                                                            <FieldError />
                                                        </TextField>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex gap-4 items-center">
                                                                <Label htmlFor="relation" className="font-medium text-foreground/80">
                                                                    Quan hệ
                                                                </Label>
                                                                <Select
                                                                    variant={resolvedTheme === "dark" ? "secondary" : undefined}
                                                                    className="w-[256px]"
                                                                    placeholder="Chọn quan hệ"
                                                                    value={guardian.relation || guardianOptions[0].value}
                                                                    onChange={(value) => {
                                                                        if (value !== null) {
                                                                            handleGuardianFieldChange(guardian.id, "relation", String(value));
                                                                        }
                                                                    }}
                                                                >
                                                                    <Select.Trigger>
                                                                        <Select.Value />
                                                                        <Select.Indicator />
                                                                    </Select.Trigger>
                                                                    <Select.Popover>
                                                                        <ListBox>
                                                                            {guardianOptions.map((option) => (
                                                                                <ListBox.Item key={option.value} id={option.value} textValue={option.label}>
                                                                                    {option.label}
                                                                                    <ListBox.ItemIndicator />
                                                                                </ListBox.Item>
                                                                            ))}
                                                                        </ListBox>
                                                                    </Select.Popover>
                                                                </Select>
                                                            </div>
                                                            <div className="flex gap-2 items-center">
                                                                <span className="text-md text-muted">Liên hệ chính</span>
                                                                <Switch isSelected={guardian.isPrimary} onChange={() => handleGuardianPrimaryChange(guardian.id)}>
                                                                    <Switch.Control>
                                                                        <Switch.Thumb />
                                                                    </Switch.Control>
                                                                </Switch>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-row justify-end">
                                                            <Button
                                                                variant="secondary"
                                                                className="text-red-400"
                                                                onClick={() => handleRemoveGuardian(guardian.id)}
                                                                isDisabled={guardianList.length === 1}
                                                            >
                                                                Xóa phụ huynh
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                                <Button variant="primary" className="text-white" onClick={handleAddGuardian}>
                                                    Thêm phụ huynh
                                                </Button>
                                                <button
                                                    className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold"
                                                    type="submit"
                                                >
                                                    Gửi đăng ký
                                                </button>
                                            </Fieldset.Group>

                                        </Fieldset>
                                    </form>
                                </Card>

                                {/* Right Card - Class Schedule */}
                                <Card className="border border-divider/70 bg-content1/80 p-8 shadow-xl shadow-black/10 backdrop-blur-md">
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-2xl font-bold text-foreground">Lịch học trong tuần</h3>
                                        </div>
                                        <div className="space-y-4">
                                            {/* Schedule Header */}
                                            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-divider">
                                                <div className="text-center font-semibold text-foreground">Thứ 2</div>
                                                <div className="text-center font-semibold text-foreground">Thứ 7</div>
                                            </div>

                                            {/* Time slots */}
                                            <div className="space-y-2">
                                                {[12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map((hour) => (
                                                    <div key={hour} className="flex gap-4 items-start">
                                                        <div className="w-16 text-sm text-muted flex-shrink-0">{hour}:00</div>
                                                        <div className="flex-1 grid grid-cols-2 gap-4">
                                                            <div />
                                                            {hour === 13 && (
                                                                <div className="col-span-2 bg-gradient-to-br from-purple-200 to-purple-100 border border-purple-300 rounded-lg p-3">
                                                                    <div className="font-semibold text-sm text-purple-900">Lớp 6 - Thứ 7</div>
                                                                    <div className="text-xs text-purple-700">13:30 - 16:30</div>
                                                                </div>
                                                            )}
                                                            {hour === 17 && (
                                                                <div className="col-span-2 bg-gradient-to-br from-blue-200 to-blue-100 border border-blue-300 rounded-lg p-3">
                                                                    <div className="font-semibold text-sm text-blue-900">Lớp 6 - Thứ 2</div>
                                                                    <div className="text-xs text-blue-700">17:30 - 20:30</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        className="mt-8 w-full text-blue-600 hover:underline text-center py-2"
                                        onClick={() => setIsRegistering(false)}
                                        type="button"
                                    >
                                        Đã có tài khoản? Đăng nhập
                                    </button>
                                </Card>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </section>
    );
}
