
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./FundiProfile.css";

function FundiProfile() {
    const { id } = useParams();

    const [fundi, setFundi] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchFundi();
    }, [id]);

    const fetchFundi = async () => {
        try {
            setLoading(true);
            setError("");
            setFundi(null);

            const response = await fetch(
                `http://localhost:8080/api/fundiprofiles/${id}`
    );

if (response.status === 404) {
    setFundi(null);
    return;
}

if (!response.ok) {
    throw new Error("Failed to load Fundi profile.");
}

const data = await response.json();

console.log("FUNDI PROFILE:", data);

setFundi(data);

} catch (err) {
    console.error("Error loading Fundi profile:", err);

    setError(
        "Unable to load this Fundi profile at the moment."
    );

} finally {
    setLoading(false);
}
};

const getTradeName = (tradeCategory) => {
    const tradeNames = {
        ELECTRICAL: "Electrician",
        PLUMBING: "Plumber",
        HANDYMAN: "Handyman",
        PAINTING: "Painter",
        GENERAL: "General",
    };

    return (
        tradeNames[tradeCategory] ||
        tradeCategory ||
        "General"
    );
};

const getInitials = (name) => {
    if (!name) {
        return "F";
    }

    return name
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
};

const formatMoney = (amount) => {
    if (amount === null || amount === undefined) {
        return "0.00";
    }

    return Number(amount).toFixed(2);
};

/*
 * LOADING
 */
if (loading) {
    return (
        <main className="profile-page">

            <div className="profile-not-found">

                <div className="profile-loading-spinner"></div>

                <h1>
                    Loading Fundi Profile...
                </h1>

                <p>
                    Please wait while we load the Fundi's
                    information.
                </p>

            </div>

        </main>
    );
}

/*
 * ERROR
 */
if (error) {
    return (
        <main className="profile-page">

            <div className="profile-not-found">

                <h1>
                    Something went wrong
                </h1>

                <p>
                    {error}
                </p>

                <button
                    type="button"
                    className="back-button"
                    onClick={fetchFundi}
                >
                    Try Again
                </button>

            </div>

        </main>
    );
}

/*
 * FUND I NOT FOUND
 */
if (!fundi) {
    return (
        <main className="profile-page">

            <div className="profile-not-found">

                <h1>
                    Fundi not found
                </h1>

                <p>
                    The Fundi you are looking for does not exist.
                </p>

                <Link
                    to="/fundis"
                    className="back-button"
                >
                    Back to Fundis
                </Link>

            </div>

        </main>
    );
}

/*
 * FUND I DATA
 */
const fullName =
    fundi.user?.fullName || "Unnamed Fundi";

const email =
    fundi.user?.email || "Email not available";

const phone =
    fundi.user?.phone || "Phone not available";

const trade =
    getTradeName(fundi.tradeCategory);

const verified =
    fundi.verificationStatus === "VERIFIED";

return (
    <main className="profile-page">

        <div className="profile-container">

            {/* Back */}
            <Link
                to="/fundis"
                className="back-link"
            >
                ← Back to Fundis
            </Link>

            {/* ============================= */}
            {/* PROFILE HEADER */}
            {/* ============================= */}

            <section className="profile-header">

                <div className="profile-avatar">
                    {getInitials(fullName)}
                </div>

                <div className="profile-main-info">

                    <div className="profile-name-row">

                        <h1>
                            {fullName}
                        </h1>

                        {verified && (
                            <span className="profile-verified">
                                    ✓ Verified
                                </span>
                        )}

                    </div>

                    <p className="profile-trade">
                        {trade}
                    </p>

                    <p className="profile-location">
                        📍 Service area:{" "}
                        {fundi.serviceAreaRadiusKm || 0} km
                    </p>

                    <div className="profile-stats">

                            <span>
                                💰 Callout Fee: R
                                {formatMoney(fundi.calloutFee)}
                            </span>

                        <span>
                                R
                            {formatMoney(fundi.hourlyRate)}
                            /hour
                            </span>

                    </div>

                </div>

                <div className="profile-action">

                    <Link
                        to={`/booking/${fundi.id}`}
                        className="book-button"
                    >
                        Book This Fundi
                    </Link>

                </div>

            </section>

            {/* ============================= */}
            {/* PROFILE CONTENT */}
            {/* ============================= */}

            <div className="profile-content">

                {/* ABOUT */}
                <section className="profile-section">

                    <h2>
                        About
                    </h2>

                    <p>
                        {fundi.bio ||
                            "This Fundi has not added a bio yet."}
                    </p>

                </section>

                {/* PROFESSIONAL INFORMATION */}
                <section className="profile-section">

                    <h2>
                        Professional Information
                    </h2>

                    <div className="profile-services">

                        <div className="profile-service">
                            <span>✓</span>
                            Trade: {trade}
                        </div>

                        <div className="profile-service">
                            <span>✓</span>
                            Callout Fee: R
                            {formatMoney(fundi.calloutFee)}
                        </div>

                        <div className="profile-service">
                            <span>✓</span>
                            Hourly Rate: R
                            {formatMoney(fundi.hourlyRate)}
                        </div>

                        <div className="profile-service">
                            <span>✓</span>
                            Service Area:{" "}
                            {fundi.serviceAreaRadiusKm || 0} km
                        </div>

                        <div className="profile-service">
                            <span>✓</span>
                            Verification:{" "}
                            {fundi.verificationStatus || "PENDING"}
                        </div>

                    </div>

                </section>

                {/* CONTACT */}
                <section className="profile-section">

                    <h2>
                        Contact
                    </h2>

                    <p>
                        📞 {phone}
                    </p>

                    <p>
                        ✉️ {email}
                    </p>

                </section>

            </div>

        </div>

    </main>
);
}

export default FundiProfile;
