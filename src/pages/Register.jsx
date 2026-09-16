
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Register.css";

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        role: "HOMEOWNER",

        // Fundi profile fields
        tradeCategory: "GENERAL",
        bio: "",
        calloutFee: "",
        hourlyRate: "",
        serviceAreaRadiusKm: "",
    });

    const [message, setMessage] = useState("");
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

        setMessage("");
        setError("");

        // Password validation
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        // Fundi validation
        if (formData.role === "FUNDI") {
            if (!formData.tradeCategory) {
                setError("Please select your trade category.");
                return;
            }

            if (!formData.bio.trim()) {
                setError("Please tell us a little about your services.");
                return;
            }

            if (!formData.hourlyRate) {
                setError("Please enter your hourly rate.");
                return;
            }

            if (!formData.serviceAreaRadiusKm) {
                setError("Please enter your service area radius.");
                return;
            }
        }

        setLoading(true);

        try {
            const requestBody = {
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                role: formData.role,
            };

            // Only send Fundi information when registering as a Fundi
            if (formData.role === "FUNDI") {
                requestBody.tradeCategory = formData.tradeCategory;
                requestBody.bio = formData.bio;
                requestBody.calloutFee = formData.calloutFee
                    ? Number(formData.calloutFee)
                    : null;
                requestBody.hourlyRate = Number(formData.hourlyRate);
                requestBody.serviceAreaRadiusKm =
                    Number(formData.serviceAreaRadiusKm);
            }

            const response = await fetch(
                "http://localhost:8080/api/auth/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(requestBody),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Registration failed. Please check your details."
                );
            }

            setMessage(
                formData.role === "FUNDI"
                    ? "Fundi account created successfully! Your profile is now pending verification."
                    : "Account created successfully!"
            );

            setTimeout(() => {
                navigate("/login");
            }, 1800);

        } catch (err) {
            console.error("REGISTRATION ERROR:", err);

            setError(
                err.message ||
                "Unable to create your account. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="register-page">

            <div className="register-card">

                <div className="register-header">

                    <span className="register-label">
                        JOIN FUNDISHOP
                    </span>

                    <h1>Create your account</h1>

                    <p>
                        Connect with trusted professionals
                        or offer your services.
                    </p>

                </div>

                {message && (
                    <div className="success-message">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    {/* FULL NAME */}

                    <div className="form-group">

                        <label htmlFor="fullName">
                            Full Name
                        </label>

                        <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            required
                        />

                    </div>

                    {/* EMAIL */}

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

                    {/* PHONE */}

                    <div className="form-group">

                        <label htmlFor="phone">
                            Phone Number
                        </label>

                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Enter your phone number"
                            required
                        />

                    </div>

                    {/* PASSWORD */}

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
                            placeholder="Create a password"
                            required
                        />

                    </div>

                    {/* CONFIRM PASSWORD */}

                    <div className="form-group">

                        <label htmlFor="confirmPassword">
                            Confirm Password
                        </label>

                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm your password"
                            required
                        />

                    </div>

                    {/* ROLE */}

                    <div className="role-section">

                        <label>
                            I want to register as:
                        </label>

                        <div className="role-options">

                            <label className="role-option">

                                <input
                                    type="radio"
                                    name="role"
                                    value="HOMEOWNER"
                                    checked={
                                        formData.role === "HOMEOWNER"
                                    }
                                    onChange={handleChange}
                                />

                                <span>
                                    Homeowner
                                </span>

                            </label>

                            <label className="role-option">

                                <input
                                    type="radio"
                                    name="role"
                                    value="FUNDI"
                                    checked={
                                        formData.role === "FUNDI"
                                    }
                                    onChange={handleChange}
                                />

                                <span>
                                    Fundi
                                </span>

                            </label>

                        </div>

                    </div>

                    {/* FUNDI INFORMATION */}

                    {formData.role === "FUNDI" && (

                        <div className="fundi-section">

                            <div className="fundi-section-header">

                                <span className="register-label">
                                    FUND I PROFILE
                                </span>

                                <h2>
                                    Tell us about your services
                                </h2>

                                <p>
                                    This information will appear on your
                                    Fundi profile.
                                </p>

                            </div>

                            {/* TRADE CATEGORY */}

                            <div className="form-group">

                                <label htmlFor="tradeCategory">
                                    Trade Category
                                </label>

                                <select
                                    id="tradeCategory"
                                    name="tradeCategory"
                                    value={formData.tradeCategory}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="ELECTRICAL">
                                        Electrical
                                    </option>

                                    <option value="PLUMBING">
                                        Plumbing
                                    </option>

                                    <option value="HANDYMAN">
                                        Handyman
                                    </option>

                                    <option value="PAINTING">
                                        Painting
                                    </option>

                                    <option value="GENERAL">
                                        General
                                    </option>
                                </select>

                            </div>

                            {/* BIO */}

                            <div className="form-group">

                                <label htmlFor="bio">
                                    About Your Services
                                </label>

                                <textarea
                                    id="bio"
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    placeholder="Tell homeowners about your experience and the services you provide..."
                                    rows="4"
                                    required
                                />

                            </div>

                            {/* CALLOUT FEE */}

                            <div className="form-group">

                                <label htmlFor="calloutFee">
                                    Callout Fee (R)
                                </label>

                                <input
                                    type="number"
                                    id="calloutFee"
                                    name="calloutFee"
                                    value={formData.calloutFee}
                                    onChange={handleChange}
                                    placeholder="e.g. 250"
                                    min="0"
                                    step="0.01"
                                />

                            </div>

                            {/* HOURLY RATE */}

                            <div className="form-group">

                                <label htmlFor="hourlyRate">
                                    Hourly Rate (R)
                                </label>

                                <input
                                    type="number"
                                    id="hourlyRate"
                                    name="hourlyRate"
                                    value={formData.hourlyRate}
                                    onChange={handleChange}
                                    placeholder="e.g. 350"
                                    min="0"
                                    step="0.01"
                                    required
                                />

                            </div>

                            {/* SERVICE AREA */}

                            <div className="form-group">

                                <label htmlFor="serviceAreaRadiusKm">
                                    Service Area Radius (km)
                                </label>

                                <input
                                    type="number"
                                    id="serviceAreaRadiusKm"
                                    name="serviceAreaRadiusKm"
                                    value={
                                        formData.serviceAreaRadiusKm
                                    }
                                    onChange={handleChange}
                                    placeholder="e.g. 25"
                                    min="1"
                                    required
                                />

                            </div>

                        </div>

                    )}

                    <button
                        type="submit"
                        className="register-submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Creating Account..."
                            : "Create Account"}
                    </button>

                </form>

                <p className="login-link">

                    Already have an account?{" "}

                    <Link to="/login">
                        Login
                    </Link>

                </p>

            </div>

        </main>
    );
}

export default Register;

