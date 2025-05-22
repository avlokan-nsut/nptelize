import { useState, ChangeEvent, FC, useEffect } from "react";
import * as z from "zod";
import { useAuthStore } from "../../store/useAuthStore";
import { useNavigate } from "react-router-dom";

const loginSchema = z.object({
    email: z
        .string()
        .min(1, "Email is required")
        .email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type LoginFormErrors = Partial<Record<keyof LoginFormData, string>>;
type UserRole = "admin";

const AdminLoginForm: FC = () => {
    const [role] = useState<UserRole>("admin");
    const [formData, setFormData] = useState<LoginFormData>({
        email: "",
        password: "",
    });
    const [errors, setErrors] = useState<LoginFormErrors>({});
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const login = useAuthStore((state) => state.login);
    const authError = useAuthStore((state) => state.error);
    const user = useAuthStore((state) => state.user);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate("/");
        }
    }, [user, navigate]);

    const eyeClosedIcon = (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
            />
        </svg>
    );

    const eyeOpenIcon = (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
            />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
        </svg>
    );

    useEffect(() => {
        if (authError) {
            setToastMessage(authError);
            setTimeout(() => {
                useAuthStore.setState({ error: null });
                setToastMessage(null);
            }, 2000);
        }
    }, [authError]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (errors[name as keyof LoginFormData]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name as keyof LoginFormData];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (): Promise<void> => {
        try {
            loginSchema.parse(formData);
            setErrors({});
            setIsLoading(true);

            const { email, password } = formData;
            await login({ email, password, role });
        } catch (error) {
            setIsLoading(false);
            if (error instanceof z.ZodError) {
                const formattedErrors: LoginFormErrors = {};
                error.errors.forEach((err) => {
                    const path = err.path[0];
                    if (path) {
                        formattedErrors[path as keyof LoginFormData] =
                            err.message;
                    }
                });
                setErrors(formattedErrors);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 flex items-center justify-center min-h-screen bg-gray-50">
            {toastMessage && (
                <div
                    className={`absolute top-[70px] right-4 px-4 py-3 rounded border ${
                        authError
                            ? "bg-red-200 border-red-400 text-red-700"
                            : "bg-green-200 border-green-400 text-green-700"
                    }`}
                    role="alert"
                >
                    <span className="block sm :inline ml-2">
                        {toastMessage}
                    </span>
                </div>
            )}
            <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
                {/* Login Header */}
                <h2 className="mb-1 text-2xl font-bold text-center text-gray-800">
                    Admin Login
                </h2>
                <p className="mb-6 text-center text-gray-500">
                    Login to admin dashboard
                </p>

                {/* Login Form */}
                <div className="space-y-4">
                    {/* Email Field */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                                errors.email
                                    ? "border-red-500"
                                    : "border-gray-300"
                            }`}
                            placeholder="Enter your email"
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`w-full pr-10 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                                    errors.password
                                        ? "border-red-500"
                                        : "border-gray-300"
                                }`}
                                placeholder="Enter your password"
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 px-3 flex items-center justify-center text-gray-500"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                            >
                                {showPassword ? eyeClosedIcon : eyeOpenIcon}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-sm text-red-500">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        className="w-full py-2 mt-6 font-medium text-white transition-colors bg-black rounded-md hover:bg-black focus:outline-none focus:ring-2 focus:ring-gray-80 focus:ring-offset-2"
                        disabled={isLoading}
                    >
                        {isLoading ? "Submitting..." : "Submit"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminLoginForm;