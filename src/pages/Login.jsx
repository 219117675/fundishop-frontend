
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_URL } from "../api";
import {
    saveLoggedInUser,
    getDashboardPath,
} from "../utils/auth";
import "./Login.css";

function Login() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        // Clear an old error when the user edits the form.
        if (error) {
            setError("");
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setMessage("");
        setError("");

        const email = formData.email.trim();
        const password = formData.password;

        if (!email || !password) {
            setError("Please enter your email and password.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `${API_URL}/api/auth/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email,
                        password,
                    }),
                }
            );

            const responseText = await response.text();
            let data = {};

            if (responseText) {
                try {
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    console.error(
                        "Could not parse login response:",
                        parseError
                    );
                }
            }

            if (!response.ok || !data.success) {
                setError(
                    data.message ||
                    "Login failed. Please check your email and password."
                );
                return;
            }

            // Normalize the role before validating it.
            const role =
                typeof data.role === "string"
                    ? data.role.trim().toUpperCase()
                    : "";

            if (!["HOMEOWNER", "FUNDI", "ADMIN"].includes(role)) {
                console.error("Unexpected login role:", data.role);

                setError(
                    "Login failed: a valid user role was not returned."
                );
                return;
            }

            if (
                data.id === undefined ||
                data.id === null ||
                String(data.id).trim() === ""
            ) {
                console.error("Login response did not include a user ID.");

                setError("Login failed: user ID was not returned.");
                return;
            }

            if (
                typeof data.token !== "string" ||
                !data.token.trim()
            ) {
                console.error(
                    "Login response did not include a valid token."
                );

                setError(
                    "Login failed: authentication token was not returned."
                );
                return;
            }

            const loggedInUser = {
                id: data.id,
                role,
                email: data.email || email,
                fullName: data.fullName || "",
                firstName: data.firstName || "",
                lastName: data.lastName || "",
                phone: data.phone || "",
                token: data.token,
            };

            // Save the user through the shared authentication helper.
            // This also clears the old localStorage session.
            const savedUser = saveLoggedInUser(loggedInUser);

            setMessage("Login successful. Redirecting...");

            // Send each role to its correct dashboard.
            const dashboardPath = getDashboardPath(savedUser.role);

            navigate(dashboardPath, {
                replace: true,
            });
        } catch (requestError) {
            console.error("Login error:", requestError);

            setError(
                requestError instanceof Error &&
                requestError.message.includes(
                    "login response"
                )
                    ? requestError.message
                    : "Unable to connect to the server. Please make sure the backend is running and try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="login-page">
            <section className="login-container">
                <Link
                    to="/"
                    className="auth-brand"
                    aria-label="FundiShop home"
                >
                    <span className="auth-brand-mark">F</span>
                    <span>
                        Fundi
                        <span className="auth-brand-accent">
                            Shop
                        </span>
                    </span>
                </Link>

                <div className="login-header">
                    <span className="auth-eyebrow">
                        WELCOME BACK
                    </span>
                    <h1>Good to see you again.</h1>
                    <p>Sign in to continue with FundiShop.</p>
                </div>

                {message && (
                    <div
                        className="auth-message auth-success"
                        role="status"
                    >
                        {message}
                    </div>
                )}

                {error && (
                    <div
                        className="auth-message auth-error"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                <form
                    className="login-form"
                    onSubmit={handleSubmit}
                >
                    <div className="auth-field">
                        <label htmlFor="login-email">
                            Email address
                        </label>

                        <input
                            id="login-email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            autoComplete="email"
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <div className="auth-label-row">
                            <label htmlFor="login-password">
                                Password
                            </label>
                        </div>

                        <div className="auth-password-wrap">
                            <input
                                id="login-password"
                                name="password"
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                disabled={loading}
                                required
                            />

                            <button
                                type="button"
                                className="auth-password-toggle"
                                onClick={() =>
                                    setShowPassword((value) => !value)
                                }
                                aria-label={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                                disabled={loading}
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="auth-submit-button"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="auth-spinner" />
                                Signing in...
                            </>
                        ) : (
                            "Sign in to your account"
                        )}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>NEW TO FUNDISHOP?</span>
                </div>

                <p className="auth-switch">
                    Don't have an account?{" "}
                    <Link to="/register">
                        Create an account
                    </Link>
                </p>

                <p className="auth-trust-note">
                    Find trusted professionals for your home,
                    or grow your service business.
                </p>
            </section>
        </main>
    );
}

export default Login;
