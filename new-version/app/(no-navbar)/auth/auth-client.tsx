'use client';

import { useEffect, useMemo, useState } from "react";
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
    toast,
    InputOTP
} from "@heroui/react";
import { motion } from "framer-motion";
import { v1, v2, otp } from "@/services/api";
import { AxiosError } from "axios";
import { useUser } from "@/context/user-context";
import { useTheme } from "next-themes";
import { useRouter, useSearchParams } from "next/navigation";
import { RegisterPayload } from "@/services/api/v2";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";

import { useClassOptions } from "@/hooks/classes/use-class-options";
import WeeklySchedule, { EventItem } from "@/components/weekly-schedule";

type AuthClientProps = {
    nextPath?: string;
};

export default function AuthClient({ nextPath }: AuthClientProps) {
    const { resolvedTheme } = useTheme();
    const { setUser } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: classOptions = [] } = useClassOptions();
    const [isMounted, setIsMounted] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [isShowPassword, setIsShowPassword] = useState(false);
    const [classSelected, setClassSelected] = useState<v2.ClassOption | null>(null);
    const [registerStudent, setRegisterStudent] = useState<{ name: string; email: string; phone: string; class: string; school: string }>({ name: "", email: "", phone: "", class: "", school: "" });
    const [guardianList, setGuardianList] = useState<Array<{ id: string; name: string; email: string; phone: string; relation: string; isPrimary: boolean }>>([{ id: "g-0", name: "", email: "", phone: "", relation: "Ba", isPrimary: true }]);

    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [isOTPTyping, setIsOTPTyping] = useState(false);
    const [isTypingPassword, setIsTypingPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [tempToken, setTempToken] = useState("");
    const [minutesResend, setMinutesResend] = useState(0);
    const [secondsResend, setSecondsResend] = useState(0);
    const [canResend, setCanResend] = useState(false);
    const [onSendingOTP, setOnSendingOTP] = useState(false);
    const [OTPCreateAt, setOTPCreateAt] = useState<Date | null>(null);
    const [isShowPasswordConfirm, setIsShowPasswordConfirm] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isOTPTyping || !OTPCreateAt) return;
        const interval = setInterval(() => {
            const createdTime = new Date(OTPCreateAt);
            const canResendTime = new Date(createdTime.getTime() + 2 * 60000);
            const now = new Date();
            const time = canResendTime.getTime() - now.getTime();

            if (time < 0) {
                setCanResend(true);
                setMinutesResend(0);
                setSecondsResend(0);
                clearInterval(interval);
            } else {
                setMinutesResend(Math.floor((time % (1000 * 60 * 60)) / (1000 * 60)));
                setSecondsResend(Math.floor((time % (1000 * 60)) / 1000));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isOTPTyping, OTPCreateAt]);

    const getInputVariant = (): "primary" | "secondary" | undefined => {
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

    function resetForm() {
        setRegisterStudent({ name: "", email: "", phone: "", class: "", school: "" });
        setGuardianList([{ id: "g-0", name: "", email: "", phone: "", relation: "Ba", isPrimary: true }]);
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
                avatarUrl: result.data.avatarUrl,
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
            resetForm();
            console.log("Registration success:", result);
            toast.success("Đăng ký thành công! Vui lòng chờ xét duyệt và đăng nhập lại.");
            setIsRegistering(false);
        } catch (error) {
            console.error("Registration error:", error);
            toast.danger("Đăng ký thất bại. Vui lòng thử lại.");
        }
    }

    async function handleSendOTP(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSubmitting(true);
        try {
            const formData = new FormData(event.currentTarget);
            const email = String(formData.get("email") ?? "");
            setResetEmail(email);

            await otp.sendOtp(email);
            toast.success("Đã gửi mã OTP đến email của bạn");
            setOTPCreateAt(new Date());
            setIsOTPTyping(true);
        } catch (error) {
            const axiosError = error as AxiosError<{ message?: string }>;
            toast.danger(axiosError.response?.data?.message ?? "Không thể gửi OTP. Vui lòng thử lại.");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleVerifyOTP(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSubmitting(true);
        try {
            const formData = new FormData(event.currentTarget);
            const otpCode = String(formData.get("otpCode") ?? "");

            const result = await otp.verifyOtp({ email: resetEmail, otpCode });
            setTempToken(result.data.tempToken);
            setIsOTPTyping(false);
            setIsTypingPassword(true);
        } catch (error) {
            const axiosError = error as AxiosError<{ message?: string }>;
            toast.danger(axiosError.response?.data?.message ?? "OTP không hợp lệ.");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleResetPasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSubmitting(true);
        try {
            const formData = new FormData(event.currentTarget);
            const newPassword = String(formData.get("newPassword") ?? "");
            const confirmPassword = String(formData.get("confirmPassword") ?? "");

            if (newPassword !== confirmPassword) {
                toast.danger("Mật khẩu không khớp.");
                return;
            }
            if (newPassword.length < 6) {
                toast.danger("Mật khẩu cần ít nhất 6 ký tự.");
                return;
            }

            await v1.resetPassword(tempToken, { newPassword, confirmPassword });
            toast.success("Đổi mật khẩu thành công");
            handleCancelReset();
        } catch (error) {
            const axiosError = error as AxiosError<{ message?: string }>;
            toast.danger(axiosError.response?.data?.message ?? "Đổi mật khẩu thất bại.");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function resendOTP() {
        setOnSendingOTP(true);
        try {
            await otp.sendOtp(resetEmail);
            toast.success("Đã gửi lại mã OTP đến email của bạn");
            setOTPCreateAt(new Date());
            setCanResend(false);
        } catch (error) {
            const axiosError = error as AxiosError<{ message?: string }>;
            toast.danger(axiosError.response?.data?.message ?? "Không thể gửi OTP. Vui lòng thử lại.");
        } finally {
            setOnSendingOTP(false);
        }
    }

    function handleCancelReset() {
        setTempToken("");
        setResetEmail("");
        setCanResend(false);
        setIsOTPTyping(false);
        setIsTypingPassword(false);
        setIsResettingPassword(false);
    }

    const DAY_LABELS: Record<number, string> = {
        1: "Thứ 2",
        2: "Thứ 3",
        3: "Thứ 4",
        4: "Thứ 5",
        5: "Thứ 6",
        6: "Thứ 7",
        0: "Chủ nhật",
    };

    const scheduleEvents = useMemo<EventItem[]>(() => {
        if (!classSelected?.weeklySchedules || !Array.isArray(classSelected.weeklySchedules)) {
            return [];
        }

        const colors: Array<NonNullable<EventItem["colorTheme"]>> = ["blue", "purple", "green", "orange"];

        return classSelected.weeklySchedules.map((schedule, index) => ({
            id: `schedule-${index}`,
            title: `${classSelected.name} - ${DAY_LABELS[schedule.dayOfWeek] ?? `Thứ ${schedule.dayOfWeek + 1}`}`,
            day: schedule.dayOfWeek,
            start: schedule.startTime?.substring(0, 5) || "",
            end: schedule.endTime?.substring(0, 5) || "",
            colorTheme: colors[index % colors.length],
        }));
    }, [classSelected]);

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
                    {!isRegistering && !isResettingPassword && (
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
                                            <div className="flex justify-end w-full mt-[-8px] mb-4">
                                                <button
                                                    className="text-sm text-blue-600 hover:underline cursor-pointer"
                                                    onClick={() => setIsResettingPassword(true)}
                                                    type="button"
                                                >
                                                    Quên mật khẩu?
                                                </button>
                                            </div>
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
                                        className="text-blue-600 hover:underline cursor-pointer"
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
                    {isRegistering && !isResettingPassword && (
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
                                                                const selectedClass = classOptions.find((c) => String(c.id) === String(value));
                                                                if (selectedClass) {
                                                                    setClassSelected(selectedClass);
                                                                }
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
                                        {classSelected !== null ? (
                                            <WeeklySchedule events={scheduleEvents} />
                                        ) : (
                                            <div className="flex justify-center items-center h-full">
                                                <p className="text-foreground">Vui lòng chọn lớp để xem lịch học</p>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        className="mt-8 w-full text-blue-600 hover:underline text-center py-2 cursor-pointer"
                                        onClick={() => setIsRegistering(false)}
                                        type="button"
                                    >
                                        Đã có tài khoản? Đăng nhập
                                    </button>
                                </Card>
                            </div>
                        </motion.div>
                    )}

                    {/* Reset Password Card */}
                    {isResettingPassword && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            <Card className="min-w-[26vw] border border-divider/70 bg-content1/80 p-8 shadow-xl shadow-black/10 backdrop-blur-md">
                                <Fieldset className="w-full">
                                    <FieldsetLegend className="text-2xl font-bold text-foreground">PT Education</FieldsetLegend>
                                    <Description className="mb-2 text-muted">Đặt lại mật khẩu</Description>

                                    {!isOTPTyping && !isTypingPassword && (
                                        <form autoComplete="on" onSubmit={handleSendOTP}>
                                            <Fieldset.Group>
                                                <TextField isRequired name="email">
                                                    <Label htmlFor="reset-email" className="font-medium text-foreground/80">Email</Label>
                                                    <Input suppressHydrationWarning variant={getInputVariant()} id="reset-email" name="email" placeholder="Nhập email" type="email" />
                                                    <FieldError />
                                                </TextField>
                                                <button className="w-full flex flex-row items-center justify-center gap-4 bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:bg-blue-600/70" disabled={isSubmitting} type="submit">
                                                    {isSubmitting ? <Spinner color="current" size="md" /> : null}
                                                    {isSubmitting ? "Đang gửi..." : "Tiếp tục"}
                                                </button>
                                            </Fieldset.Group>
                                        </form>
                                    )}

                                    {isOTPTyping && (
                                        <form autoComplete="on" onSubmit={handleVerifyOTP}>
                                            <p className="text-sm text-muted mb-4">Nhập mã OTP đã được gửi đến email của bạn.</p>
                                            <Fieldset.Group>
                                                <div className="flex flex-col gap-2 w-full justify-start py-2">
                                                    <Label htmlFor="otpCode" className="font-medium text-foreground/80 self-start">Mã OTP</Label>
                                                    <InputOTP maxLength={6} name="otpCode" id="otpCode" variant={getInputVariant()}>
                                                        <InputOTP.Group>
                                                            <InputOTP.Slot className="size-12 rounded-2xl border-2 text-lg font-bold" index={0} />
                                                            <InputOTP.Slot className="size-12 rounded-2xl border-2 text-lg font-bold" index={1} />
                                                            <InputOTP.Slot className="size-12 rounded-2xl border-2 text-lg font-bold" index={2} />
                                                            <InputOTP.Slot className="size-12 rounded-2xl border-2 text-lg font-bold" index={3} />
                                                            <InputOTP.Slot className="size-12 rounded-2xl border-2 text-lg font-bold" index={4} />
                                                            <InputOTP.Slot className="size-12 rounded-2xl border-2 text-lg font-bold" index={5} />
                                                        </InputOTP.Group>
                                                    </InputOTP>
                                                </div>
                                                <p className="text-sm text-foreground/80 mt-1">
                                                    Bạn chưa nhận được OTP?{" "}
                                                    <button type="button" className={`text-blue-600 hover:underline ${canResend ? "" : "opacity-50 cursor-not-allowed hover:no-underline"}`} disabled={!canResend || onSendingOTP} onClick={resendOTP}>
                                                        Gửi lại {canResend ? "" : `sau ${minutesResend}:${secondsResend < 10 ? "0" : ""}${secondsResend}`}
                                                    </button>
                                                </p>
                                                <button className="w-full flex flex-row items-center justify-center gap-4 bg-blue-600 text-white py-2 mt-2 rounded-xl hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:bg-blue-600/70" disabled={isSubmitting} type="submit">
                                                    {isSubmitting ? <Spinner color="current" size="md" /> : null}
                                                    {isSubmitting ? "Đang xác thực..." : "Tiếp tục"}
                                                </button>
                                            </Fieldset.Group>
                                        </form>
                                    )}

                                    {isTypingPassword && (
                                        <form autoComplete="on" onSubmit={handleResetPasswordSubmit}>
                                            <Fieldset.Group>
                                                <TextField isRequired name="newPassword">
                                                    <Label htmlFor="newPassword" className="font-medium text-foreground/80">Mật khẩu mới</Label>
                                                    <InputGroup variant={getInputVariant()}>
                                                        <InputGroup.Input suppressHydrationWarning id="newPassword" name="newPassword" placeholder="Nhập mật khẩu mới" type={isShowPassword ? "text" : "password"} />
                                                        <InputGroup.Suffix>
                                                            <button className="focus:outline-none flex items-center justify-center" type="button" onClick={() => setIsShowPassword(!isShowPassword)}>
                                                                {isShowPassword ? <FaRegEyeSlash className="text-xl text-default-400" /> : <FaRegEye className="text-xl text-default-400" />}
                                                            </button>
                                                        </InputGroup.Suffix>
                                                    </InputGroup>
                                                    <FieldError />
                                                </TextField>
                                                <TextField isRequired name="confirmPassword">
                                                    <Label htmlFor="confirmPassword" className="font-medium text-foreground/80">Nhập lại mật khẩu</Label>
                                                    <InputGroup variant={getInputVariant()}>
                                                        <InputGroup.Input suppressHydrationWarning id="confirmPassword" name="confirmPassword" placeholder="Nhập lại mật khẩu mới" type={isShowPasswordConfirm ? "text" : "password"} />
                                                        <InputGroup.Suffix>
                                                            <button className="focus:outline-none flex items-center justify-center" type="button" onClick={() => setIsShowPasswordConfirm(!isShowPasswordConfirm)}>
                                                                {isShowPasswordConfirm ? <FaRegEyeSlash className="text-xl text-default-400" /> : <FaRegEye className="text-xl text-default-400" />}
                                                            </button>
                                                        </InputGroup.Suffix>
                                                    </InputGroup>
                                                    <FieldError />
                                                </TextField>
                                                <button className="w-full flex flex-row items-center justify-center gap-4 bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:bg-blue-600/70" disabled={isSubmitting} type="submit">
                                                    {isSubmitting ? <Spinner color="current" size="md" /> : null}
                                                    {isSubmitting ? "Đang đổi mật khẩu..." : "Tiếp tục"}
                                                </button>
                                            </Fieldset.Group>
                                        </form>
                                    )}
                                    <div className="flex justify-center w-full mt-4">
                                        <button className="text-sm text-muted hover:text-foreground transition-colors" onClick={handleCancelReset} type="button">
                                            Quay lại đăng nhập
                                        </button>
                                    </div>
                                </Fieldset>
                            </Card>
                        </motion.div>
                    )}
                </div>
            </div>
        </section>
    );
}
