
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../api";
import "./Register.css";

const initialFormData = {
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "HOMEOWNER",
    tradeCategory: "",
    bio: "",
    calloutFee: "",
    hourlyRate: "",
    serviceAreaRadiusKm: "",
};

const Register = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState(initialFormData);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleRoleChange = (event) => {
        const role = event.target.value;

        setFormData((previous) => ({
            ...previous,
            role,
            tradeCategory: "",
            bio: "",
            calloutFee: "",
            hourlyRate: "",
            serviceAreaRadiusKm: "",
        }));
    };

    const validateForm = () => {
        if (!formData.fullName.trim()) {
            return "Please enter your full name.";
        }

        if (!formData.email.trim()) {
            return "Please enter your email address.";
        }

        if (!formData.phone.trim()) {
            return "Please enter your phone number.";
        }

        if (!formData.password) {
            return "Please enter a password.";
        }

        if (formData.password.length < 6) {
            return "Password must be at least 6 characters long.";
        }

        if (formData.password !== formData.confirmPassword) {
            return "Passwords do not match.";
        }

        if (!["HOMEOWNER", "FUNDI"].includes(formData.role)) {
            return "Please select a valid account type.";
        }

        if (formData.role === "FUNDI") {
            if (!formData.tradeCategory) {
                return "Please select your trade category.";
            }

            if (!formData.bio.trim()) {
                return "Please enter a short description about your services.";
            }

            if (
                formData.calloutFee === "" ||
                !Number.isFinite(Number(formData.calloutFee)) ||
                Number(formData.calloutFee) < 0
            ) {
                return "Please enter a valid callout fee of R0 or more.";
            }

            if (
                formData.hourlyRate === "" ||
                !Number.isFinite(Number(formData.hourlyRate)) ||
                Number(formData.hourlyRate) < 0
            ) {
                return "Please enter a valid hourly rate of R0 or more.";
            }

            if (
                formData.serviceAreaRadiusKm === "" ||
                !Number.isFinite(Number(formData.serviceAreaRadiusKm)) ||
                Number(formData.serviceAreaRadiusKm) <= 0
            ) {
                return "Service area radius must be greater than 0.";
            }
        }

        return null;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage("");
        setError("");

        const validationError = validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);

        try {
            const requestBody = {
                fullName: formData.fullName.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                password: formData.password,
                role: formData.role,
            };

            if (formData.role === "FUNDI") {
                requestBody.tradeCategory = formData.tradeCategory;
                requestBody.bio = formData.bio.trim();
                requestBody.calloutFee = Number(formData.calloutFee);
                requestBody.hourlyRate = Number(formData.hourlyRate);
                requestBody.serviceAreaRadiusKm = Number(
                    formData.serviceAreaRadiusKm
                );
            }

            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            });

            let data = null;

            try {
                data = await response.json();
            } catch {
                data = null;
            }

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    data?.error ||
                    "Registration failed. Please try again."
                );
            }

            setMessage(
                "Registration successful! Redirecting you to login..."
            );
            setFormData({ ...initialFormData });

            window.setTimeout(() => {
                navigate("/login");
            }, 1500);
        } catch (registrationError) {
            console.error("Registration error:", registrationError);

            setError(
                registrationError instanceof Error
                    ? registrationError.message
                    : "Unable to register. Please check your connection and try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="register-page">
            <section className="register-container">
                <Link to="/" className="auth-brand" aria-label="FundiShop home">
                    <span className="auth-brand-mark">F</span>
                    <span>
                        Fundi<span className="auth-brand-accent">Shop</span>
                    </span>
                </Link>

                <header className="register-header">
                    <span className="auth-eyebrow">GET STARTED</span>
                    <h1>Create your account.</h1>
                    <p>
                        Join FundiShop to find trusted professionals or grow
                        your service business.
                    </p>
                </header>

                {message && (
                    <div className="auth-message auth-success" role="status">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="auth-message auth-error" role="alert">
                        {error}
                    </div>
                )}

                <form className="register-form" onSubmit={handleSubmit}>
                    <fieldset className="account-type-fieldset" disabled={loading}>
                        <legend>How will you use FundiShop?</legend>

                        <div className="account-type-options">
                            <label
                                className={`account-type-option ${
                                    formData.role === "HOMEOWNER" ? "selected" : ""
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="role"
                                    value="HOMEOWNER"
                                    checked={formData.role === "HOMEOWNER"}
                                    onChange={handleRoleChange}
                                />
                                <span className="account-type-icon" aria-hidden="true">
                                    H
                                </span>
                                <span className="account-type-copy">
                                    <strong>Homeowner</strong>
                                    <small>Find help for your home</small>
                                </span>
                            </label>

                            <label
                                className={`account-type-option ${
                                    formData.role === "FUNDI" ? "selected" : ""
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="role"
                                    value="FUNDI"
                                    checked={formData.role === "FUNDI"}
                                    onChange={handleRoleChange}
                                />
                                <span className="account-type-icon" aria-hidden="true">
                                    F
                                </span>
                                <span className="account-type-copy">
                                    <strong>Fundi</strong>
                                    <small>Offer your services</small>
                                </span>
                            </label>
                        </div>
                    </fieldset>

                    <div className="register-section-heading">
                        <h2>Your details</h2>
                        <p>Enter your contact information to get started.</p>
                    </div>

                    <div className="auth-field">
                        <label htmlFor="register-full-name">Full name</label>
                        <input
                            id="register-full-name"
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            autoComplete="name"
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="register-email">Email address</label>
                        <input
                            id="register-email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            autoComplete="email"
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="register-phone">Phone number</label>
                        <input
                            id="register-phone"
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Enter your phone number"
                            autoComplete="tel"
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="register-password">Password</label>
                        <div className="auth-password-wrap">
                            <input
                                id="register-password"
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="At least 6 characters"
                                autoComplete="new-password"
                                minLength={6}
                                disabled={loading}
                                required
                            />
                            <button
                                type="button"
                                className="auth-password-toggle"
                                onClick={() => setShowPassword((value) => !value)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                disabled={loading}
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    <div className="auth-field">
                        <label htmlFor="register-confirm-password">
                            Confirm password
                        </label>
                        <div className="auth-password-wrap">
                            <input
                                id="register-confirm-password"
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Enter your password again"
                                autoComplete="new-password"
                                disabled={loading}
                                required
                            />
                            <button
                                type="button"
                                className="auth-password-toggle"
                                onClick={() =>
                                    setShowConfirmPassword((value) => !value)
                                }
                                aria-label={
                                    showConfirmPassword
                                        ? "Hide confirm password"
                                        : "Show confirm password"
                                }
                                disabled={loading}
                            >
                                {showConfirmPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    {formData.role === "FUNDI" && (
                        <section className="fundi-registration-section">
                            <div className="fundi-registration-heading">
                                <span className="auth-eyebrow">SERVICE PROVIDER</span>
                                <h2>Tell us about your work</h2>
                                <p>
                                    These details help customers understand
                                    your services and rates.
                                </p>
                            </div>

                            <div className="auth-field">
                                <label htmlFor="register-trade">
                                    Trade category
                                </label>
                                <select
                                    id="register-trade"
                                    name="tradeCategory"
                                    value={formData.tradeCategory}
                                    onChange={handleChange}
                                    disabled={loading}
                                    required
                                >
                                    <option value="">Select your trade</option>
                                    <option value="PLUMBER">Plumber</option>
                                    <option value="ELECTRICIAN">Electrician</option>
                                    <option value="CARPENTER">Carpenter</option>
                                    <option value="PAINTER">Painter</option>
                                    <option value="BUILDER">Builder</option>
                                    <option value="TILER">Tiler</option>
                                    <option value="GARDENER">Gardener</option>
                                    <option value="HANDYMAN">Handyman</option>
                                    <option value="CLEANER">Cleaner</option>
                                    <option value="ROOFER">Roofer</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            <div className="auth-field">
                                <label htmlFor="register-bio">
                                    About your services
                                </label>
                                <textarea
                                    id="register-bio"
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    placeholder="Describe your services and experience"
                                    rows={4}
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <div className="register-rate-grid">
                                <div className="auth-field">
                                    <label htmlFor="register-callout-fee">
                                        Callout fee (R)
                                    </label>
                                    <input
                                        id="register-callout-fee"
                                        type="number"
                                        name="calloutFee"
                                        value={formData.calloutFee}
                                        onChange={handleChange}
                                        placeholder="e.g. 250"
                                        min="0"
                                        step="0.01"
                                        disabled={loading}
                                        required
                                    />
                                </div>

                                <div className="auth-field">
                                    <label htmlFor="register-hourly-rate">
                                        Hourly rate (R)
                                    </label>
                                    <input
                                        id="register-hourly-rate"
                                        type="number"
                                        name="hourlyRate"
                                        value={formData.hourlyRate}
                                        onChange={handleChange}
                                        placeholder="e.g. 350"
                                        min="0"
                                        step="0.01"
                                        disabled={loading}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="auth-field">
                                <label htmlFor="register-service-radius">
                                    Service area radius (km)
                                </label>
                                <input
                                    id="register-service-radius"
                                    type="number"
                                    name="serviceAreaRadiusKm"
                                    value={formData.serviceAreaRadiusKm}
                                    onChange={handleChange}
                                    placeholder="e.g. 25"
                                    min="0.1"
                                    step="0.1"
                                    disabled={loading}
                                    required
                                />
                                <p className="auth-field-hint">
                                    How far are you willing to travel for a job?
                                </p>
                            </div>
                        </section>
                    )}

                    <button
                        type="submit"
                        className="auth-submit-button register-submit-button"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="auth-spinner" />
                                Creating account...
                            </>
                        ) : (
                            "Create your account"
                        )}
                    </button>

                    <p className="register-terms-note">
                        By creating an account, make sure the information you
                        provide is accurate and up to date.
                    </p>
                </form>

                <div className="auth-divider">
                    <span>ALREADY A MEMBER?</span>
                </div>

                <p className="auth-switch">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </section>
        </main>
    );
};

export default Register;
