import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./FundiDashboard.css";

function FundiDashboard() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

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

            // Get the Fundi profile belonging to this user
            fetch("http://localhost:8080/api/fundiprofiles")
                .then((response) => {
                    if (!response.ok) {
                        throw new Error("Unable to load Fundi profile.");
                    }

                    return response.json();
                })
                .then((profiles) => {
                    const myProfile = profiles.find(
                        (item) =>
                            item.user &&
                            item.user.id === parsedUser.id
                    );

                    setProfile(myProfile || null);
                })
                .catch((error) => {
                    console.error(
                        "Error loading Fundi profile:",
                        error
                    );
                })
                .finally(() => {
                    setLoadingProfile(false);
                });

        } catch (error) {
            console.error("Invalid user data:", error);

            localStorage.removeItem("fundiShopUser");

            navigate("/login");
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("fundiShopUser");
        navigate("/login");
    };

    if (!user) {
        return null;
    }

    return (
        <main className="fundi-dashboard">

            {/* ================================
                DASHBOARD HEADER
            ================================= */}

            {/* Dashboard Header */}

            <section className="fundi-dashboard-header">

                <div className="dashboard-header-label">
        <span className="dashboard-label">
            FUNDISHOP FUNDI PORTAL
        </span>
                </div>

                <div className="dashboard-header-main">
                    <h1>
                        Welcome, {user.fullName}
                    </h1>

                    <p>
                        Manage your services, bookings and Fundi profile.
                    </p>
                </div>

                <button
                    className="dashboard-logout"
                    onClick={handleLogout}
                >
                    Logout
                </button>

            </section>


            {/* ================================
                VERIFICATION STATUS
            ================================= */}

            <section className="verification-card">

                <div className="verification-icon">
                    ✓
                </div>

                <div className="verification-content">

                    <span>
                        PROFILE VERIFICATION
                    </span>

                    <h2>
                        {profile?.verificationStatus || "PENDING"}
                    </h2>

                    <p>
                        {profile?.verificationStatus === "VERIFIED"
                            ? "Your Fundi profile has been verified and is visible to homeowners."
                            : "Your Fundi profile is currently awaiting verification."}
                    </p>

                </div>

                <div className="verification-status">
                    {profile?.verificationStatus || "PENDING"}
                </div>

            </section>


            {/* ================================
                PROFESSIONAL PROFILE
            ================================= */}

            <section className="professional-section">

                <div className="section-heading">

                    <span>
                        MY FUNDI PROFILE
                    </span>

                    <h2>
                        Your professional information
                    </h2>

                    <p>
                        This information is shown to homeowners when
                        they view your Fundi profile.
                    </p>

                </div>


                {loadingProfile ? (

                    <div className="profile-loading">
                        Loading your professional profile...
                    </div>

                ) : profile ? (

                    <div className="professional-card">

                        {/* Trade */}

                        <div className="professional-item">

                            <div className="professional-icon">
                                🔧
                            </div>

                            <div>

                                <span>
                                    Trade
                                </span>

                                <strong>
                                    {profile.tradeCategory}
                                </strong>

                            </div>

                        </div>


                        {/* Bio */}

                        <div className="professional-item professional-bio">

                            <div className="professional-icon">
                                👤
                            </div>

                            <div>

                                <span>
                                    About Me
                                </span>

                                <strong>
                                    {profile.bio || "No bio added yet."}
                                </strong>

                            </div>

                        </div>


                        {/* Callout Fee */}

                        <div className="professional-item">

                            <div className="professional-icon">
                                💵
                            </div>

                            <div>

                                <span>
                                    Callout Fee
                                </span>

                                <strong>
                                    R{profile.calloutFee}
                                </strong>

                            </div>

                        </div>


                        {/* Hourly Rate */}

                        <div className="professional-item">

                            <div className="professional-icon">
                                ⏱️
                            </div>

                            <div>

                                <span>
                                    Hourly Rate
                                </span>

                                <strong>
                                    R{profile.hourlyRate}
                                    <small>/hour</small>
                                </strong>

                            </div>

                        </div>


                        {/* Service Area */}

                        <div className="professional-item">

                            <div className="professional-icon">
                                📍
                            </div>

                            <div>

                                <span>
                                    Service Area
                                </span>

                                <strong>
                                    {profile.serviceAreaRadiusKm} km
                                </strong>

                            </div>

                        </div>


                        {/* Verification */}

                        <div className="professional-item">

                            <div className="professional-icon">
                                ✓
                            </div>

                            <div>

                                <span>
                                    Verification
                                </span>

                                <strong>
                                    {profile.verificationStatus}
                                </strong>

                            </div>

                        </div>

                    </div>

                ) : (

                    <div className="no-profile-card">

                        <div className="no-profile-icon">
                            🔧
                        </div>

                        <div>

                            <h3>
                                Complete your Fundi profile
                            </h3>

                            <p>
                                Add your trade, bio, pricing and
                                service area so homeowners can find you.
                            </p>

                        </div>

                        <button>
                            Create Profile
                        </button>

                    </div>

                )}

            </section>


            {/* ================================
                DASHBOARD FEATURES
            ================================= */}

            <section className="dashboard-section">

                <div className="section-heading">

                    <span>
                        FUNDISHOP
                    </span>

                    <h2>
                        Manage your work
                    </h2>

                    <p>
                        Everything you need to manage your Fundi business.
                    </p>

                </div>


                <div className="dashboard-grid">


                    {/* PROFILE */}

                    <div className="dashboard-card">

                        <div className="dashboard-card-icon">
                            👤
                        </div>

                        <div className="dashboard-card-content">

                            <h3>
                                My Profile
                            </h3>

                            <p>
                                Manage your Fundi information,
                                services and pricing.
                            </p>

                        </div>

                        <button
                            onClick={() =>
                                navigate("/fundi-profile")
                            }
                        >
                            Manage Profile
                        </button>

                    </div>


                    {/* BOOKINGS */}

                    <div className="dashboard-card">

                        <div className="dashboard-card-icon">
                            📅
                        </div>

                        <div className="dashboard-card-content">

                            <h3>
                                Bookings
                            </h3>

                            <p>
                                View and manage your upcoming
                                jobs and appointments.
                            </p>

                        </div>

                        <button
                            onClick={() =>
                                navigate("/fundi-bookings")
                            }
                        >
                            View Bookings
                        </button>

                    </div>


                    {/* REVIEWS */}

                    <div className="dashboard-card">

                        <div className="dashboard-card-icon">
                            ⭐
                        </div>

                        <div className="dashboard-card-content">

                            <h3>
                                Reviews
                            </h3>

                            <p>
                                See what homeowners say about
                                your completed work.
                            </p>

                        </div>

                        <button
                            onClick={() =>
                                navigate("/fundi-reviews")
                            }
                        >
                            View Reviews
                        </button>

                    </div>


                    {/* EARNINGS */}

                    <div className="dashboard-card">

                        <div className="dashboard-card-icon">
                            💰
                        </div>

                        <div className="dashboard-card-content">

                            <h3>
                                Earnings
                            </h3>

                            <p>
                                Track your earnings from
                                completed jobs.
                            </p>

                        </div>

                        <button
                            onClick={() =>
                                navigate("/fundi-earnings")
                            }
                        >
                            View Earnings
                        </button>

                    </div>

                </div>

            </section>


            {/* ================================
                ACCOUNT INFORMATION
            ================================= */}

            <section className="account-section">

                <div className="section-heading">

                    <span>
                        ACCOUNT INFORMATION
                    </span>

                    <h2>
                        Your account
                    </h2>

                    <p>
                        Your basic FundiShop account details.
                    </p>

                </div>


                <div className="account-card">

                    <div className="account-row">

                        <span>
                            Full Name
                        </span>

                        <strong>
                            {user.fullName}
                        </strong>

                    </div>


                    <div className="account-row">

                        <span>
                            Email Address
                        </span>

                        <strong>
                            {user.email}
                        </strong>

                    </div>


                    <div className="account-row">

                        <span>
                            Phone Number
                        </span>

                        <strong>
                            {user.phone || "Not provided"}
                        </strong>

                    </div>


                    <div className="account-row">

                        <span>
                            Account Type
                        </span>

                        <strong>
                            Fundi
                        </strong>

                    </div>

                </div>

            </section>


            {/* ================================
                FOOTER SPACE
            ================================= */}

            <div className="dashboard-bottom-space"></div>

        </main>
    );
}

export default FundiDashboard;