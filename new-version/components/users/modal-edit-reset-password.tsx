import { Button, Description, FieldError, Input, InputGroup, Label, Modal, Radio, RadioGroup, Spinner, TextField } from "@heroui/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { useResetPassword } from "@/hooks/users/use-reset-password";

export default function ModalEditResetPassword({
    isOpen,
    setOpen,
    close,
    userId,
    userName
}: {
    isOpen: boolean;
    setOpen: (value: boolean) => void;
    close: () => void;
    userId: string;
    userName: string;
}) {
    const [value, setValue] = useState("automatic");
    const [isShowPassword, setIsShowPassword] = useState(false);
    const [password, setPassword] = useState("");
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };
    const [isMounted, setIsMounted] = useState(false);
    const { resolvedTheme } = useTheme();

    const resetPasswordMutation = useResetPassword(userId, () => {
        close();
    });

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setPassword("");
            setValue("automatic");
            setIsShowPassword(false);
        }
    }, [isOpen]);

    const getInputVariant = (): "primary" | "secondary" | undefined => {
        return isMounted && resolvedTheme === "dark" ? "secondary" : undefined;
    };

    const handleEditSubmit = () => {
        if (value === "custom" && password.length < 6) {
            return;
        }
        resetPasswordMutation.mutate({
            password: value === "automatic" ? null : password
        });
    };

    // Calculate derived submit button disable state (no render side-effects)
    const isSubmitDisabled = value === "custom" && password.length < 6;

    return (
        <Modal>
            <Modal.Backdrop isOpen={isOpen} onOpenChange={setOpen}>
                <Modal.Container size="lg">
                    <Modal.Dialog className="w-full md:max-w-3xl">
                        <Modal.Header className="flex flex-col gap-2 pb-2">
                            <h2 className="text-xl font-bold text-foreground">Đặt lại mật khẩu</h2>
                            <Description className="text-muted">{userId} - {userName}</Description>
                        </Modal.Header>
                        <Modal.Body className="px-6 py-6 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-8">
                            <RadioGroup name="reset-password" value={value} onChange={setValue} orientation="horizontal" className="flex flex-row gap-12 justify-between" variant="secondary">
                                <Radio value="automatic" className="flex flex-col items-start gap-1">
                                    <Radio.Content className="flex flex-row items-center gap-2">
                                        <Radio.Control>
                                            <Radio.Indicator />
                                        </Radio.Control>
                                        <span className="font-semibold text-foreground">Tự động</span>
                                    </Radio.Content>
                                    <Description className="text-muted-foreground text-sm ml-7 max-w-[280px]">
                                        Hệ thống sẽ tạo mật khẩu ngẫu nhiên
                                    </Description>
                                </Radio>
                                <Radio value="custom" className="flex flex-col items-start gap-1">
                                    <Radio.Content className="flex flex-row items-center gap-2">
                                        <Radio.Control>
                                            <Radio.Indicator />
                                        </Radio.Control>
                                        <span className="font-semibold text-foreground">Tùy chỉnh</span>
                                    </Radio.Content>
                                    <Description className="text-muted-foreground text-sm ml-7 max-w-[280px]">
                                        Đặt mật khẩu tùy chỉnh cho người dùng
                                    </Description>
                                </Radio>
                            </RadioGroup>
                            {value === "custom" ? (
                                <TextField
                                    isRequired
                                    name="password"
                                    validate={(val) => {
                                        if (val.length < 6) {
                                            return "Mật khẩu cần ít nhất 6 ký tự";
                                        }
                                        return null;
                                    }}
                                >
                                    <Label htmlFor="password" className="font-medium text-foreground/80">
                                        Mật khẩu
                                    </Label>

                                    <InputGroup /*variant={getInputVariant()}*/>
                                        <InputGroup.Input
                                            suppressHydrationWarning
                                            autoComplete="current-password"
                                            id="password"
                                            name="password"
                                            value={password}
                                            onChange={handleInputChange}
                                            placeholder="Nhập mật khẩu"
                                            type={isShowPassword ? "text" : "password"}
                                        />
                                        <InputGroup.Suffix>
                                            <button
                                                className="focus:outline-none flex items-center justify-center"
                                                type="button"
                                                onClick={() => setIsShowPassword(!isShowPassword)}
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
                            ) : null}
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="ghost" onPress={() => close()} isDisabled={resetPasswordMutation.isPending}>
                                Hủy
                            </Button>
                            <Button
                                variant="primary"
                                onPress={handleEditSubmit}
                                isDisabled={isSubmitDisabled || resetPasswordMutation.isPending}
                            >
                                {resetPasswordMutation.isPending && <Spinner size="sm" color="current" className="mr-2" />}
                                Đặt lại mật khẩu
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}