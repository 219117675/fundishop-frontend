import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await fetch(
                "http://localhost:8080/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: formData.email,
                        password: formData.password,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Invalid email or password."
                );
            }

            console.log("LOGIN SUCCESS:", data);

            // Save the logged-in user for the next stages
            localStorage.setItem(
                "fundiShopUser",
                JSON.stringify(data)
            );

            // Redirect based on role
            if (data.role === "HOMEOWNER") {
                navigate("/homeowner");
            } else if (data.role === "FUNDI") {
                navigate("/fundi-dashboard");
            } else if (data.role === "ADMIN") {
                navigate("/admin");
            }

        } catch (err) {
            console.error("LOGIN ERROR:", err);

            setError(
                err.message ||
                "Unable to login. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="login-page">

            <div className="login-card">

                <div className="login-header">

                    <span className="login-label">
                        WELCOME BACK
                    </span>

                    <h1>Login to FundiShop</h1>

                    <p>
                        Sign in to connect with trusted
                        professionals.
                    </p>

                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <div className="form-group">

                        <label htmlFor="email">
                            Email Address
                        </label>

                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            required
                        />

                    </div>

                    <div className="form-group">

                        <label htmlFor="password">
                            Password
                        </label>

                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            required
                        />

                    </div>

                    <button
                        type="submit"
                        className="login-submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Signing In..."
                            : "Login"}
                    </button>

                </form>

                <p className="register-link">
                    Don't have an account?{" "}
                    <Link to="/register">
                        Create an account
                    </Link>
                </p>

            </div>

        </main>
    );
}

export default Login;