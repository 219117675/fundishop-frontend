import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../api";
import "./FundiProfileManagement.css";

function getStoredUser() {
    const storedUser = localStorage.getItem("fundiShopUser");

    if (!storedUser) {
        return null;
    }

    try {
        return JSON.parse(storedUser);
    } catch (error) {
        console.error("Invalid stored user:", error);
        return null;
    }
}

function FundiProfileManagement() {
    const [user] = useState(() => getStoredUser());

    const [profile, setProfile] = useState(null);

    const [loading, setLoading] = useState(() => {
        const storedUser = getStoredUser();

        return Boolean(
            storedUser?.id && storedUser?.role === "FUNDI"
        );
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [formData, setFormData] = useState({
        tradeCategory: "",
        bio: "",
        calloutFee: "",
        hourlyRate: "",
        serviceAreaRadiusKm: "",
    });

    useEffect(() => {
        if (!user?.id || user.role !== "FUNDI") {
            return;
        }

        let cancelled = false;

        const loadProfile = async () => {
            try {
                const response = await fetch(
                    `${API_URL}/api/fundiprofiles/user/${user.id}`
                );

                if (response.status === 404) {
                    if (!cancelled) {
                        setProfile(null);
                        setLoading(false);
                    }

                    return;
                }

                const contentType =
                    response.headers.get("content-type") || "";

                const data = contentType.includes("application/json")
                    ? await response.json()
                    : null;

                if (!response.ok) {
                    throw new Error(
                        data?.message ||
                        data?.error ||
                        "Failed to load your fundi profile."
                    );
                }

                if (!cancelled) {
                    setProfile(data);

                    setFormData({
                        tradeCategory: data.tradeCategory || "",
                        bio: data.bio || "",
                        calloutFee:
                            data.calloutFee !== null &&
                            data.calloutFee !== undefined
                                ? String(data.calloutFee)
                                : "",
                        hourlyRate:
                            data.hourlyRate !== null &&
                            data.hourlyRate !== undefined
                                ? String(data.hourlyRate)
                                : "",
                        serviceAreaRadiusKm:
                            data.serviceAreaRadiusKm !== null &&
                            data.serviceAreaRadiusKm !== undefined
                                ? String(data.serviceAreaRadiusKm)
                                : "",
                    });

                    setError("");
                    setLoading(false);
                }
            } catch (loadError) {
                console.error(
                    "Failed to load fundi profile:",
                    loadError
                );

                if (!cancelled) {
                    setError(
                        loadError.message ||
                        "Failed to load your fundi profile."
                    );

                    setLoading(false);
                }
            }
        };

        loadProfile();

        return () => {
            cancelled = true;
        };
    }, [user]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        setError("");
        setSuccess("");
    };

    const validateForm = () => {
        if (!formData.tradeCategory) {
            return "Please select your trade category.";
        }

        if (!formData.bio.trim()) {
            return "Please provide a short description about your services.";
        }

        if (formData.bio.trim().length < 20) {
            return "Your bio should contain at least 20 characters.";
        }

        if (
            formData.calloutFee === "" ||
            Number.isNaN(Number(formData.calloutFee)) ||
            Number(formData.calloutFee) < 0
        ) {
            return "Please enter a valid callout fee.";
        }

        if (
            formData.hourlyRate === "" ||
            Number.isNaN(Number(formData.hourlyRate)) ||
            Number(formData.hourlyRate) < 0
        ) {
            return "Please enter a valid hourly rate.";
        }

        if (
            formData.serviceAreaRadiusKm === "" ||
            Number.isNaN(Number(formData.serviceAreaRadiusKm)) ||
            Number(formData.serviceAreaRadiusKm) <= 0
        ) {
            return "Please enter a valid service area radius.";
        }

        return "";
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!user?.id || user.role !== "FUNDI") {
            setError(
                "Your login session is invalid. Please log in again."
            );

            return;
        }

        const validationError = validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        setSaving(true);

        const profileData = {
            ...(profile?.id ? { id: profile.id } : {}),
            user: {
                id: user.id,
            },
            tradeCategory: formData.tradeCategory,
            bio: formData.bio.trim(),
            calloutFee: Number(formData.calloutFee),
            hourlyRate: Number(formData.hourlyRate),
            serviceAreaRadiusKm: Number(
                formData.serviceAreaRadiusKm
            ),
            verificationStatus:
                profile?.verificationStatus || "PENDING",
            ...(profile?.createdAt
                ? { createdAt: profile.createdAt }
                : {}),
        };

        try {
            const isEditing = Boolean(profile?.id);

            const response = await fetch(
                `${API_URL}/api/fundiprofiles`,
                {
                    method: isEditing ? "PUT" : "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(profileData),
                }
            );

            const contentType =
                response.headers.get("content-type") || "";

            const data = contentType.includes("application/json")
                ? await response.json()
                : null;

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    data?.error ||
                    `Failed to ${
                        isEditing ? "update" : "create"
                    } your fundi profile.`
                );
            }

            setProfile(data);

            setFormData({
                tradeCategory: data.tradeCategory || "",
                bio: data.bio || "",
                calloutFee:
                    data.calloutFee !== null &&
                    data.calloutFee !== undefined
                        ? String(data.calloutFee)
                        : "",
                hourlyRate:
                    data.hourlyRate !== null &&
                    data.hourlyRate !== undefined
                        ? String(data.hourlyRate)
                        : "",
                serviceAreaRadiusKm:
                    data.serviceAreaRadiusKm !== null &&
                    data.serviceAreaRadiusKm !== undefined
                        ? String(data.serviceAreaRadiusKm)
                        : "",
            });

            setSuccess(
                isEditing
                    ? "Your fundi profile has been updated successfully."
                    : "Your fundi profile has been created successfully and submitted for verification."
            );
        } catch (saveError) {
            console.error(
                "Failed to save fundi profile:",
                saveError
            );

            setError(
                saveError.message ||
                "Something went wrong while saving your profile."
            );
        } finally {
            setSaving(false);
        }
    };

    const getVerificationLabel = () => {
        if (!profile?.verificationStatus) {
            return "Pending Verification";
        }

        switch (profile.verificationStatus) {
            case "VERIFIED":
                return "Verified";

            case "REJECTED":
                return "Rejected";

            case "PENDING":
            default:
                return "Pending Verification";
        }
    };

    const getVerificationMessage = () => {
        if (!profile?.verificationStatus) {
            return "Your profile will be reviewed before customers can book your services.";
        }

        switch (profile.verificationStatus) {
            case "VERIFIED":
                return "Your profile has been verified. Customers can now book your services.";

            case "REJECTED":
                return "Your profile has not been approved. Please review your information and contact the administrator if necessary.";

            case "PENDING":
            default:
                return "Your profile is currently waiting for verification. Customers cannot book your services until it is verified.";
        }
    };

    const getUserName = () => {
        if (!user) {
            return "Fundi";
        }

        if (user.firstName) {
            return user.firstName;
        }

        if (user.fullName) {
            return user.fullName;
        }

        if (user.name) {
            return user.name;
        }

        return "Fundi";
    };

    if (!user) {
        return (
            <div className="fundi-profile-management-page">
                <div className="profile-management-container">
                    <div className="error-state">
                        <h2>Login Required</h2>

                        <p>
                            You must be logged in to manage your fundi
                            profile.
                        </p>

                        <Link
                            to="/login"
                            className="primary-button"
                        >
                            Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (user.role !== "FUNDI") {
        return (
            <div className="fundi-profile-management-page">
                <div className="profile-management-container">
                    <div className="error-state">
                        <h2>Access Denied</h2>

                        <p>
                            Only registered fundis can manage a fundi
                            profile.
                        </p>

                        <Link
                            to="/dashboard"
                            className="primary-button"
                        >
                            Go to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="fundi-profile-management-page">
                <div className="profile-management-container">
                    <div className="loading-state">
                        <p>
                            Loading your fundi profile...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fundi-profile-management-page">
            <div className="profile-management-container">
                <div className="profile-management-header">
                    <div>
                        <h1>
                            {profile
                                ? "Manage Your Fundi Profile"
                                : "Create Your Fundi Profile"}
                        </h1>

                        <p>
                            Welcome, {getUserName()}. Keep your
                            professional information up to date so
                            homeowners know what services you provide.
                        </p>
                    </div>

                    <Link
                        to="/fundi-dashboard"
                        className="secondary-button"
                    >
                        Back to Dashboard
                    </Link>
                </div>

                {error && (
                    <div
                        className="error-message"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                {success && (
                    <div
                        className="success-message"
                        role="status"
                    >
                        {success}
                    </div>
                )}

                {profile && (
                    <section className="verification-section">
                        <div>
                            <h2>Verification Status</h2>

                            <p>
                                {getVerificationMessage()}
                            </p>
                        </div>

                        <span
                            className={`verification-badge ${
                                profile.verificationStatus
                                    ? profile.verificationStatus.toLowerCase()
                                    : "pending"
                            }`}
                        >
                            {getVerificationLabel()}
                        </span>
                    </section>
                )}

                <form
                    className="profile-management-form"
                    onSubmit={handleSubmit}
                >
                    <section className="form-section">
                        <div className="section-heading">
                            <h2>
                                Professional Information
                            </h2>

                            <p>
                                Tell homeowners about your trade
                                and the services you offer.
                            </p>
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="tradeCategory">
                                    Trade Category
                                </label>

                                <select
                                    id="tradeCategory"
                                    name="tradeCategory"
                                    value={
                                        formData.tradeCategory
                                    }
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">
                                        Select your trade
                                    </option>

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
                                        General Services
                                    </option>

                                    <option value="CARPENTRY">
                                        Carpentry
                                    </option>

                                    <option value="TILING">
                                        Tiling
                                    </option>
                                </select>
                            </div>

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
                                    min="1"
                                    step="1"
                                    placeholder="e.g. 20"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="bio">
                                About Your Services
                            </label>

                            <textarea
                                id="bio"
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                rows="6"
                                maxLength="1000"
                                placeholder="Describe your experience, services and what homeowners can expect from you..."
                                required
                            />

                            <small>
                                {formData.bio.length}/1000
                                characters
                            </small>
                        </div>
                    </section>

                    <section className="form-section">
                        <div className="section-heading">
                            <h2>Pricing</h2>

                            <p>
                                Set the standard prices homeowners
                                will see when viewing your profile.
                            </p>
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="calloutFee">
                                    Callout Fee (R)
                                </label>

                                <input
                                    type="number"
                                    id="calloutFee"
                                    name="calloutFee"
                                    value={
                                        formData.calloutFee
                                    }
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    placeholder="e.g. 250"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="hourlyRate">
                                    Hourly Rate (R)
                                </label>

                                <input
                                    type="number"
                                    id="hourlyRate"
                                    name="hourlyRate"
                                    value={
                                        formData.hourlyRate
                                    }
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    placeholder="e.g. 350"
                                    required
                                />
                            </div>
                        </div>
                    </section>

                    <section className="form-section account-section">
                        <div className="section-heading">
                            <h2>Account Information</h2>

                            <p>
                                Your account information is connected
                                to your FundiShop profile.
                            </p>
                        </div>

                        <div className="account-information">
                            <div>
                                <span className="account-label">
                                    Name
                                </span>

                                <strong>
                                    {user.firstName ||
                                        user.fullName ||
                                        "Fundi"}{" "}
                                    {user.lastName || ""}
                                </strong>
                            </div>

                            <div>
                                <span className="account-label">
                                    Email
                                </span>

                                <strong>
                                    {user.email ||
                                        "Not available"}
                                </strong>
                            </div>
                        </div>
                    </section>

                    <div className="form-actions">
                        <Link
                            to="/fundi-dashboard"
                            className="secondary-button"
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            className="primary-button"
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : profile
                                    ? "Update Profile"
                                    : "Create Profile"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default FundiProfileManagement;