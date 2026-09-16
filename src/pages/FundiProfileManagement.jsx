
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./FundiProfileManagement.css";

function FundiProfileManagement() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);

    const [formData, setFormData] = useState({
        tradeCategory: "",
        bio: "",
        calloutFee: "",
        hourlyRate: "",
        serviceAreaRadiusKm: "",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const storedUser = localStorage.getItem("fundiShopUser");

        if (!storedUser) {
            navigate("/login");
            return;
        }

        try {
            const parsedUser = JSON.parse(storedUser);

            if (parsedUser.role !== "FUNDI") {
                navigate("/");
                return;
            }

            setUser(parsedUser);

            fetch(
                `http://localhost:8080/api/fundiprofiles/user/${parsedUser.id}`
    )
.then((response) => {
    if (!response.ok) {
        throw new Error(
            "Unable to load your Fundi profile."
        );
    }

    return response.json();
})
    .then((data) => {
        setProfile(data);

        setFormData({
            tradeCategory: data.tradeCategory || "",
            bio: data.bio || "",
            calloutFee: data.calloutFee ?? "",
            hourlyRate: data.hourlyRate ?? "",
            serviceAreaRadiusKm:
                data.serviceAreaRadiusKm ?? "",
        });
    })
    .catch((err) => {
        console.error(err);
        setError(err.message);
    })
    .finally(() => {
        setLoading(false);
    });

} catch (err) {
    console.error("Invalid user data:", err);

    localStorage.removeItem("fundiShopUser");

    navigate("/login");
}
}, [navigate]);

const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
        ...previous,
        [name]: value,
    }));
};

const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");
    setSaving(true);

    try {
        const updatedProfile = {
            id: profile.id,

            user: {
                id: user.id,
            },

            tradeCategory: formData.tradeCategory,

            bio: formData.bio,

            calloutFee:
                formData.calloutFee === ""
                    ? null
                    : Number(formData.calloutFee),

            hourlyRate:
                formData.hourlyRate === ""
                    ? null
                    : Number(formData.hourlyRate),

            serviceAreaRadiusKm:
                formData.serviceAreaRadiusKm === ""
                    ? null
                    : Number(formData.serviceAreaRadiusKm),

            verificationStatus:
            profile.verificationStatus,

            createdAt: profile.createdAt,
        };

        const response = await fetch(
            "http://localhost:8080/api/fundiprofiles",
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedProfile),
            }
        );

        if (!response.ok) {
            throw new Error(
                "Unable to save your profile."
            );
        }

        const data = await response.json();

        setProfile(data);

        setFormData({
            tradeCategory: data.tradeCategory || "",
            bio: data.bio || "",
            calloutFee: data.calloutFee ?? "",
            hourlyRate: data.hourlyRate ?? "",
            serviceAreaRadiusKm:
                data.serviceAreaRadiusKm ?? "",
        });

        setMessage(
            "Your Fundi profile has been updated successfully."
        );

    } catch (err) {
        console.error("PROFILE UPDATE ERROR:", err);

        setError(
            err.message ||
            "Unable to update your profile."
        );
    } finally {
        setSaving(false);
    }
};

if (!user || loading) {
    return (
        <main className="fundi-profile-management-page">
            <div className="profile-management-loading">
                Loading your Fundi profile...
            </div>
        </main>
    );
}

if (!profile) {
    return (
        <main className="fundi-profile-management-page">
            <div className="profile-management-error">
                <h2>Fundi profile not found</h2>

                <p>
                    We could not find a Fundi profile
                    associated with your account.
                </p>

                <Link
                    to="/fundi-dashboard"
                    className="management-back-button"
                >
                    Back to Dashboard
                </Link>
            </div>
        </main>
    );
}

return (
    <main className="fundi-profile-management-page">

        <div className="profile-management-container">

            {/* Back */}

            <Link
                to="/fundi-dashboard"
                className="management-back-link"
            >
                ← Back to Dashboard
            </Link>


            {/* Header */}

            <section className="management-header">

                <div>
                        <span className="management-label">
                            FUNDISHOP FUNDI PORTAL
                        </span>

                    <h1>
                        Manage Your Profile
                    </h1>

                    <p>
                        Keep your professional information
                        accurate and up to date.
                    </p>
                </div>

                <div className="management-status">
                        <span>
                            VERIFICATION
                        </span>

                    <strong>
                        {profile.verificationStatus}
                    </strong>
                </div>

            </section>


            {/* Messages */}

            {message && (
                <div className="profile-success-message">
                    {message}
                </div>
            )}

            {error && (
                <div className="profile-error-message">
                    {error}
                </div>
            )}


            {/* Form */}

            <form
                className="fundi-profile-form"
                onSubmit={handleSubmit}
            >

                {/* Professional Information */}

                <section className="management-card">

                    <div className="management-card-header">

                            <span>
                                PROFESSIONAL INFORMATION
                            </span>

                        <h2>
                            Your services
                        </h2>

                        <p>
                            Tell homeowners what type of work
                            you provide.
                        </p>

                    </div>


                    {/* Trade */}

                    <div className="management-form-group">

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
                                General
                            </option>
                        </select>

                    </div>


                    {/* Bio */}

                    <div className="management-form-group">

                        <label htmlFor="bio">
                            Professional Bio
                        </label>

                        <textarea
                            id="bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            placeholder="Tell homeowners about your experience and the services you provide..."
                            rows="6"
                            maxLength="1000"
                        />

                        <small>
                            {formData.bio.length}/1000 characters
                        </small>

                    </div>

                </section>


                {/* Pricing */}

                <section className="management-card">

                    <div className="management-card-header">

                            <span>
                                PRICING & SERVICE AREA
                            </span>

                        <h2>
                            Your rates
                        </h2>

                        <p>
                            Set your standard pricing and
                            service coverage.
                        </p>

                    </div>


                    <div className="management-form-grid">

                        {/* Callout */}

                        <div className="management-form-group">

                            <label htmlFor="calloutFee">
                                Callout Fee
                            </label>

                            <div className="input-with-prefix">
                                <span>R</span>

                                <input
                                    type="number"
                                    id="calloutFee"
                                    name="calloutFee"
                                    value={formData.calloutFee}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    placeholder="150.00"
                                />
                            </div>

                        </div>


                        {/* Hourly */}

                        <div className="management-form-group">

                            <label htmlFor="hourlyRate">
                                Hourly Rate
                            </label>

                            <div className="input-with-prefix">
                                <span>R</span>

                                <input
                                    type="number"
                                    id="hourlyRate"
                                    name="hourlyRate"
                                    value={formData.hourlyRate}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    placeholder="250.00"
                                />
                            </div>

                        </div>


                        {/* Radius */}

                        <div className="management-form-group">

                            <label htmlFor="serviceAreaRadiusKm">
                                Service Area
                            </label>

                            <div className="input-with-suffix">

                                <input
                                    type="number"
                                    id="serviceAreaRadiusKm"
                                    name="serviceAreaRadiusKm"
                                    value={
                                        formData.serviceAreaRadiusKm
                                    }
                                    onChange={handleChange}
                                    min="1"
                                    max="500"
                                    placeholder="20"
                                />

                                <span>
                                        km
                                    </span>

                            </div>

                        </div>

                    </div>

                </section>


                {/* Account Information */}

                <section className="management-card">

                    <div className="management-card-header">

                            <span>
                                ACCOUNT INFORMATION
                            </span>

                        <h2>
                            Your account
                        </h2>

                        <p>
                            These details come from your
                            FundiShop account.
                        </p>

                    </div>


                    <div className="account-information-grid">

                        <div>
                                <span>
                                    Full Name
                                </span>

                            <strong>
                                {user.fullName}
                            </strong>
                        </div>

                        <div>
                                <span>
                                    Email Address
                                </span>

                            <strong>
                                {user.email}
                            </strong>
                        </div>

                        <div>
                                <span>
                                    Phone Number
                                </span>

                            <strong>
                                {user.phone || "Not provided"}
                            </strong>
                        </div>

                    </div>

                </section>


                {/* Actions */}

                <div className="management-actions">

                    <Link
                        to="/fundi-dashboard"
                        className="cancel-profile-button"
                    >
                        Cancel
                    </Link>

                    <button
                        type="submit"
                        className="save-profile-button"
                        disabled={saving}
                    >
                        {saving
                            ? "Saving Changes..."
                            : "Save Changes"}
                    </button>

                </div>

            </form>

        </div>

    </main>
);
}

export default FundiProfileManagement;
