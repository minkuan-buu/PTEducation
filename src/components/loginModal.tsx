import * as Yup from "yup";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import { Button, Input, Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/react";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import {
    LOGIN,
    SENDOTP,
    VERIFYOTP,
    RESETPASSWORD
} from "../api/api";

export const LoginModal = ({ isOpen, onOpenChange, onLoading, setOnLoading }) => {
    const [isMobile, setIsMobile] = useState(false);
    const [isResetingPassword, setIsResetingPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [OTPCreateAt, setOTPCreateAt] = useState < Date > (null);
    const [isOTPTyping, setIsOTPTyping] = useState(false);
    const [isTypingPassword, setTypingPassword] = useState(false);

    const handleResize = () => {
        setIsMobile(window.innerWidth <= 640);
    };

    const ChangeOption = () => {
        setIsResetingPassword(!isResetingPassword);
        setShowPassword(false);
    }

    useEffect(() => {
        handleResize(); // Check initially
        window.addEventListener('resize', handleResize); // Update on resize
        return () => window.removeEventListener('resize', handleResize); // Cleanup
    }, []);

    const [minutesResend, setMinutesResend] = useState(0);
    const [secondsResend, setSecondsResend] = useState(0);
    const [canResend, setCanResend] = useState(false);
    const [onSendingOTP, setOnSendingOTP] = useState(false);

    async function resendOTP() {
        setOnSendingOTP(true);
        try {
            const { isSuccess, res } = await SENDOTP(localStorage.getItem("email_reset"));

            if (!isSuccess) {
                let result = await res.json();
                alert(result.message);
            } else {
                let result = await res.json();
                alert("Đã gửi mã OTP đến email của bạn");
                var now = new Date();
                setOTPCreateAt(now);
                setCanResend(false);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setOnSendingOTP(false);
        }
    }

    useEffect(() => {
        if (!isOTPTyping) return;
        const createdTime = new Date(OTPCreateAt);
        const canResend = createdTime.setMinutes(createdTime.getMinutes() + 2);
        const firstNow = new Date();
        let time = canResend - firstNow.getTime();
        setMinutesResend(Math.floor((time % (1000 * 60 * 60)) / (1000 * 60)));
        setSecondsResend(Math.floor((time % (1000 * 60)) / 1000));
        const interval = setInterval(() => {
            const now = new Date();
            let time = canResend - now.getTime();
            setMinutesResend(Math.floor((time % (1000 * 60 * 60)) / (1000 * 60)));
            setSecondsResend(Math.floor((time % (1000 * 60)) / 1000));
            if (time < 0) {
                setCanResend(true);
                clearInterval(interval);
                setMinutesResend(0);
                setSecondsResend(0);
            }
        }, 1000);
    }, [isOTPTyping, OTPCreateAt]);



    const formikEnterMailReset = useFormik({
        initialValues: {
            email: "",
        },
        validationSchema: Yup.object({
            email: Yup.string().email().min(5, "Must be at least 5 characters").required("Required"),
        }),
        onSubmit: async (values) => {
            setOnLoading(true);
            try {
                const { isSuccess, res } = await SENDOTP(values.email);

                if (!isSuccess) {
                    let result = await res.json();
                    alert(result.message);
                } else {
                    let result = await res.json();
                    alert("Đã gửi mã OTP đến email của bạn");
                    localStorage.setItem("email_reset", values.email);
                    var now = new Date();
                    setOTPCreateAt(now);
                    setIsOTPTyping(true);
                }
            } catch (error) {
                console.log(error);
            } finally {
                setOnLoading(false);
            }
        },
    });

    const formikVerifyOTPReset = useFormik({
        initialValues: {
            email: localStorage.getItem("email_reset"),
            otpCode: "",
        },
        validationSchema: Yup.object({
            otpCode: Yup.string().length(6, "OTP code must be exactly 6 digits").required("Required"),
        }),
        onSubmit: async (values) => {
            values.email = localStorage.getItem("email_reset");
            console.log(values);
            setOnLoading(true);
            try {
                const { isSuccess, res } = await VERIFYOTP(values);

                if (!isSuccess) {
                    let result = await res.json();
                    alert(result.message);
                } else {
                    let result = await res.json();
                    setIsOTPTyping(false);
                    localStorage.setItem("temp_token", result.data.tempToken);
                    setTypingPassword(true);
                }
            } catch (error) {
                console.log(error);
            } finally {
                setOnLoading(false);
            }
        },
    });

    const formikPasswordReset = useFormik({
        initialValues: {
            newPassword: "",
            confirmPassword: "",
        },
        validationSchema: Yup.object({
            newPassword: Yup.string().min(6, "Must be at least 6 characters").required("Required"),
            confirmPassword: Yup.string().oneOf([Yup.ref("newPassword"), null], "Passwords must match").required("Required"),
        }),
        onSubmit: async (values) => {
            console.log(values);
            setOnLoading(true);
            var tempToken = localStorage.getItem("temp_token");
            try {
                const { isSuccess, res } = await RESETPASSWORD(tempToken, values);

                if (!isSuccess) {
                    if (res.status == 401) {
                        LogoutResetPassword();
                        return;
                    }
                    let result = await res.json();
                    alert(result.message);
                } else {
                    let result = await res.json();
                    alert("Đổi mật khẩu thành công");
                    localStorage.removeItem("temp_token");
                    localStorage.removeItem("email_reset");
                    setIsResetingPassword(false);
                    setIsOTPTyping(false);
                    setTypingPassword(false);
                    formikEnterMailReset.resetForm();
                    formikVerifyOTPReset.resetForm();
                    formikPasswordReset.resetForm();
                }
            } catch (error) {
                console.log(error);
            } finally {
                setOnLoading(false);
            }
        },
    });

    function CloseModal() {
        onOpenChange();
        formik.resetForm();
        formikEnterMailReset.resetForm();
        formikVerifyOTPReset.resetForm();
        formikPasswordReset.resetForm();
        setIsOTPTyping(false);
        setTypingPassword(false);
        setIsResetingPassword(false);
        setShowPassword(false);
    }

    function handleCancel() {
        localStorage.removeItem("temp_token");
        localStorage.removeItem("email_reset");
        formikEnterMailReset.resetForm();
        formikVerifyOTPReset.resetForm();
        formikPasswordReset.resetForm();
        setCanResend(false);
        setIsOTPTyping(false);
        setTypingPassword(false);
        setIsResetingPassword(false);
    }

    const formik = useFormik({
        initialValues: {
            username: "",
            password: "",
        },
        validationSchema: Yup.object({
            username: Yup.string().min(5, "Must be at least 5 characters").required("Required"),
            password: Yup.string().min(6, "Must be at least 6 characters").required("Required"),
        }),
        onSubmit: async (values) => {
            setOnLoading(true);
            try {
                const { isSuccess, res } = await LOGIN(values);

                if (!isSuccess) {
                    let result = await res.json();
                    alert(result.message);
                } else {
                    let result = await res.json();

                    localStorage.setItem(
                        "isShowChangePassword",
                        result.data.isNeedChangePassword ?? false.toString(),
                    );
                    localStorage.setItem(
                        "isNeedToChangePassword",
                        result.data.isNeedChangePassword ?? false.toString(),
                    );
                    localStorage.setItem("token", result.data.token);
                    localStorage.setItem("role", result.data.role);
                    localStorage.setItem("name", result.data.name);
                    window.location.href = "/";
                    CloseModal();
                }
            } catch (error) {
                console.log(error);
            } finally {
                setOnLoading(false);
            }
        },
    });


    return (
        <Modal isOpen={isOpen} onOpenChange={CloseModal} placement={isMobile ? "top" : "center"} isDismissable={false} isKeyboardDismissDisabled={true}>
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader>{isResetingPassword ? "Đặt lại mật khẩu" : "Đăng nhập"}</ModalHeader>
                        <ModalBody>
                            {!isResetingPassword ? (
                                <>
                                    <p>Đăng nhập để sử dụng các tính năng của PT Education</p>
                                    <form onSubmit={formik.handleSubmit}>
                                        <Input name="username" label="Tên đăng nhập" value={formik.values.username} onChange={formik.handleChange} placeholder="Id hoặc email" />
                                        {formik.errors.username && formik.touched.username && (
                                            <p style={{ color: "red" }}>{formik.errors.username}</p>
                                        )}
                                        <Input
                                            name="password"
                                            label="Mật khẩu"
                                            type={showPassword ? "text" : "password"}
                                            value={formik.values.password}
                                            onChange={formik.handleChange}
                                            placeholder="Nhập mật khẩu"
                                            className="mt-3"
                                            endContent={<div
                                                className="w-12 h-10 flex items-center justify-center cursor-pointer 
                            rounded-full transition-colors duration-200 ease-in-out 
                            hover:bg-slate-400"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                                            </div>}
                                        />
                                        {formik.errors.password && formik.touched.password && (
                                            <p style={{ color: "red" }}>{formik.errors.password}</p>
                                        )}
                                        <Button fullWidth id="send-code-button" color="primary" type="submit" isLoading={onLoading} style={{ marginTop: "2vh", marginBottom: "2vh" }}>
                                            Tiếp tục
                                        </Button>
                                        <Button onClick={() => ChangeOption()}>Quên mật khẩu?</Button>
                                    </form>
                                </>
                            ) : (
                                <>
                                    {isOTPTyping ? (
                                        <>
                                            <p>Nhập mã OTP đã được gửi đến email của bạn</p>
                                            <form onSubmit={formikVerifyOTPReset.handleSubmit}>
                                                <Input name="otpCode" label="OTP Code" value={formikVerifyOTPReset.values.otpCode} onChange={formikVerifyOTPReset.handleChange} placeholder="Nhập OTP Code" />
                                                {formikVerifyOTPReset.errors.otpCode && formikVerifyOTPReset.touched.otpCode && (
                                                    <p style={{ color: "red" }}>{formikVerifyOTPReset.errors.otpCode}</p>
                                                )}
                                                <p className="mt-2">Bạn chưa nhận được OTP? <Button className={`${canResend ? "cursor-pointer" : "cursor-not-allowed"} ml-2`} isLoading={onSendingOTP} isDisabled={!canResend || onSendingOTP} onClick={() => resendOTP()}>Gửi lại {canResend ? null : `sau ${minutesResend}:${secondsResend < 10 ? "0" : ""}${secondsResend}`}</Button></p>
                                                <Button fullWidth id="send-code-button" color="primary" type="submit" isLoading={onLoading} style={{ marginTop: "2vh", marginBottom: "2vh" }}>
                                                    Tiếp tục
                                                </Button>
                                                <Button onClick={() => handleCancel()}>Quay lại đăng nhập</Button>
                                            </form>
                                        </>
                                    ) : (
                                        <>
                                            {isTypingPassword ? (
                                                <>
                                                    <p>Nhập mật khẩu mới</p>
                                                    <form onSubmit={formikPasswordReset.handleSubmit}>
                                                        <Input name="newPassword" label="Mật khẩu mới" type={showPassword ? "text" : "password"} value={formikPasswordReset.values.newPassword} onChange={formikPasswordReset.handleChange} placeholder="Nhập mật khẩu mới" endContent={<div
                                                            className="w-12 h-10 flex items-center justify-center cursor-pointer 
                            rounded-full transition-colors duration-200 ease-in-out 
                            hover:bg-slate-400"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                        >
                                                            {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                                                        </div>} />
                                                        {formikPasswordReset.errors.newPassword && formikPasswordReset.touched.newPassword && (
                                                            <p style={{ color: "red" }}>{formikPasswordReset.errors.newPassword}</p>
                                                        )}
                                                        <Input name="confirmPassword" label="Nhập lại mật khẩu mới" type={showPasswordConfirm ? "text" : "password"} className="mt-3" value={formikPasswordReset.values.confirmPassword} onChange={formikPasswordReset.handleChange} placeholder="Nhập lại mật khẩu mới" endContent={<div
                                                            className="w-12 h-10 flex items-center justify-center cursor-pointer 
                            rounded-full transition-colors duration-200 ease-in-out 
                            hover:bg-slate-400"
                                                            onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                                                        >
                                                            {showPasswordConfirm ? <IoEyeOffOutline /> : <IoEyeOutline />}
                                                        </div>} />
                                                        {formikPasswordReset.errors.confirmPassword && formikPasswordReset.touched.confirmPassword && (
                                                            <p style={{ color: "red" }}>{formikPasswordReset.errors.confirmPassword}</p>
                                                        )}
                                                        <Button fullWidth id="send-code-button" color="primary" type="submit" isLoading={onLoading} style={{ marginTop: "2vh", marginBottom: "2vh" }}>
                                                            Tiếp tục
                                                        </Button>
                                                        <Button onClick={() => handleCancel()}>Quay lại đăng nhập</Button>
                                                    </form>
                                                </>
                                            ) : (
                                                <>
                                                    <p>Nhập email để đặt lại mật khẩu</p>
                                                    <form onSubmit={formikEnterMailReset.handleSubmit}>
                                                        <Input name="email" label="Email" value={formikEnterMailReset.values.email} onChange={formikEnterMailReset.handleChange} placeholder="Nhập email" />
                                                        {formikEnterMailReset.errors.email && formikEnterMailReset.touched.email && (
                                                            <p style={{ color: "red" }}>{formikEnterMailReset.errors.email}</p>
                                                        )}
                                                        <Button fullWidth id="send-code-button" color="primary" type="submit" isLoading={onLoading} style={{ marginTop: "2vh", marginBottom: "2vh" }}>
                                                            Tiếp tục
                                                        </Button>
                                                        <Button onClick={() => handleCancel()}>Quay lại đăng nhập</Button>
                                                    </form>
                                                </>
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </ModalBody>
                    </>
                )}
            </ModalContent>
        </Modal>
    )
}