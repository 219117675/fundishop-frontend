
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../api";
import "./HomeownerDashboard.css";

function getStoredUser() {
    const storedUser = sessionStorage.getItem("fundiShopUser");

    if (!storedUser) return null;

    try {
        return JSON.parse(storedUser);
    } catch (error) {
        console.error("Invalid user data:", error);
        sessionStorage.removeItem("fundiShopUser");
        return null;
    }
}

function HomeownerDashboard() {
    const [user] = useState(getStoredUser);

    const userId = user?.id ?? null;
    const token = user?.token ?? "";

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(Boolean(userId));
    const [error, setError] = useState("");

    const loadBookings = useCallback(async () => {
        if (!userId) {
            setBookings([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch(
                `${API_URL}/api/bookings/customer/${userId}`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                        ...(token
                            ? { Authorization: `Bearer ${token}` }
                            : {}),
                    },
                }
            );

            if (!response.ok) {
                const errorText = await response.text();

                console.error(
                    "Booking request failed:",
                    response.status,
                    errorText
                );

                throw new Error("We couldn't load your bookings.");
            }

            const data = await response.json();
            setBookings(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error loading homeowner bookings:", err);
            setBookings([]);
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong while loading your bookings."
            );
        } finally {
            setLoading(false);
        }
    }, [userId, token]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadBookings();
        }, 0);

        return () => window.clearTimeout(timer);
    }, [loadBookings]);

    const getStatusClass = (status) => {
        switch (status) {
            case "ACCEPTED":
                return "status-accepted";
            case "COMPLETED":
                return "status-completed";
            case "DECLINED":
                return "status-declined";
            case "CANCELLED":
                return "status-cancelled";
            case "RESCHEDULED":
                return "status-rescheduled";
            case "REQUESTED":
            default:
                return "status-requested";
        }
    };

    const formatStatus = (status) => {
        if (!status) return "Requested";

        return status
            .toLowerCase()
            .replace(/_/g, " ")
            .replace(/\b\w/g, (letter) => letter.toUpperCase());
    };

    const getFundiName = (booking) => {
        const fundiUser = booking?.fundiProfile?.user;

        if (!fundiUser) return "Fundi";
        if (fundiUser.fullName?.trim()) return fundiUser.fullName.trim();

        if (fundiUser.firstName?.trim()) {
            const firstName = fundiUser.firstName.trim();
            const lastName = fundiUser.lastName?.trim();

            return lastName ? `${firstName} ${lastName}` : firstName;
        }

        if (fundiUser.name?.trim()) return fundiUser.name.trim();

        return "Fundi";
    };

    const getFundiTrade = (booking) => {
        const trade = booking?.fundiProfile?.tradeCategory;

        const trades = {
            ELECTRICAL: "Electrician",
            PLUMBING: "Plumber",
            HANDYMAN: "Handyman",
            PAINTING: "Painter",
            GENERAL: "General services",
            CARPENTRY: "Carpenter",
            TILING: "Tiler",
            BRICKLAYING: "Bricklayer",
            ROOFING: "Roofer",
            WELDING: "Welder",
            GARDENING: "Gardener",
        };

        return trades[trade] || trade || "Professional";
    };

    const getInitials = (name) => {
        if (!name) return "F";

        return name
            .split(" ")
            .filter(Boolean)
            .map((part) => part[0])
            .join("")
            .toUpperCase()
            .substring(0, 2);
    };

    const formatDate = (date) => {
        if (!date) return "Date not set";

        const parsedDate = new Date(`${date}T00:00:00`);

        if (Number.isNaN(parsedDate.getTime())) return date;

        return parsedDate.toLocaleDateString("en-ZA", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const formatTime = (time) => {
        if (!time) return "Time not set";

        const parts = time.split(":");
        const hours = Number(parts[0]);
        const minutes = parts[1] || "00";

        if (Number.isNaN(hours)) return time.substring(0, 5);

        const date = new Date();
        date.setHours(hours, Number(minutes), 0, 0);

        return date.toLocaleTimeString("en-ZA", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    const getUserName = () => {
        if (!user) return "";

        if (user.firstName?.trim()) return user.firstName.trim();

        if (user.fullName?.trim()) {
            return user.fullName.trim().split(/\s+/)[0];
        }

        if (user.name?.trim()) {
            return user.name.trim().split(/\s+/)[0];
        }

        return "";
    };

    const pendingBookings = useMemo(
        () => bookings.filter((booking) => booking.status === "REQUESTED"),
        [bookings]
    );

    const acceptedBookings = useMemo(
        () => bookings.filter((booking) => booking.status === "ACCEPTED"),
        [bookings]
    );

    const completedBookings = useMemo(
        () => bookings.filter((booking) => booking.status === "COMPLETED"),
        [bookings]
    );

    const upcomingBookings = useMemo(
        () =>
            bookings
                .filter((booking) =>
                    ["REQUESTED", "ACCEPTED", "RESCHEDULED"].includes(
                        booking.status
                    )
                )
                .sort((a, b) => {
                    const dateA = `${a.scheduledDate || ""} ${a.scheduledTime || ""}`;
                    const dateB = `${b.scheduledDate || ""} ${b.scheduledTime || ""}`;
                    return dateA.localeCompare(dateB);
                }),
        [bookings]
    );

    if (!user) {
        return (
            <main className="homeowner-dashboard">
                <div className="dashboard-container">
                    <section className="dashboard-empty dashboard-login-empty">
                        <div className="empty-icon">👤</div>
                        <span className="section-label">YOUR FUNDISHOP ACCOUNT</span>
                        <h2>Please log in</h2>
                        <p>
                            Log in to manage your bookings and find trusted
                            professionals for your home.
                        </p>
                        <Link to="/login" className="empty-button">
                            Go to Login <span aria-hidden="true">→</span>
                        </Link>
                    </section>
                </div>
            </main>
        );
    }

    return (
        <main className="homeowner-dashboard">
            <div className="dashboard-container">
                <section className="dashboard-header">
                    <div className="dashboard-welcome-copy">
                        <div className="dashboard-label">
                            <span className="dashboard-label-dot" />
                            HOMEOWNER DASHBOARD
                        </div>

                        <h1>
                            Welcome back{getUserName() ? "," : ""}
                            <span className="welcome-name">
                                {getUserName() || " Homeowner"}
                            </span>
                            !
                        </h1>

                        <p>
                            Your home deserves the best care. Keep track of
                            your projects and connect with trusted local Fundis.
                        </p>

                        <div className="dashboard-header-actions">
                            <Link to="/fundis" className="find-fundi-button">
                                <span aria-hidden="true">＋</span>
                                Find a Fundi
                                <span aria-hidden="true">↗</span>
                            </Link>

                            <Link
                                to="/my-bookings"
                                className="header-secondary-link"
                            >
                                View my bookings <span aria-hidden="true">→</span>
                            </Link>
                        </div>
                    </div>

                    <div className="dashboard-hero-art" aria-hidden="true">
                        <div className="hero-art-circle hero-art-circle-one" />
                        <div className="hero-art-circle hero-art-circle-two" />
                        <div className="hero-art-house">⌂</div>
                        <div className="hero-art-tool hero-art-tool-one">🔧</div>
                        <div className="hero-art-tool hero-art-tool-two">✦</div>
                        <div className="hero-art-caption">
                            <span className="hero-art-check">✓</span>
                            <span>
                                <strong>Home care, simplified</strong>
                                <small>Your next project starts here</small>
                            </span>
                        </div>
                    </div>
                </section>

                <section
                    className="dashboard-stats"
                    aria-label="Booking summary"
                >
                    <article className="dashboard-stat-card stat-total">
                        <div className="stat-card-top">
                            <span className="stat-icon">▦</span>
                            <span className="stat-card-label">ALL ACTIVITY</span>
                        </div>
                        <strong className="stat-number">
                            {loading ? "—" : bookings.length}
                        </strong>
                        <span className="stat-title">Total bookings</span>
                        <span className="stat-description">
                            All your service requests
                        </span>
                    </article>

                    <article className="dashboard-stat-card stat-pending">
                        <div className="stat-card-top">
                            <span className="stat-icon">◷</span>
                            <span className="stat-card-label">AWAITING RESPONSE</span>
                        </div>
                        <strong className="stat-number">
                            {loading ? "—" : pendingBookings.length}
                        </strong>
                        <span className="stat-title">Pending</span>
                        <span className="stat-description">
                            Waiting for a Fundi
                        </span>
                    </article>

                    <article className="dashboard-stat-card stat-accepted">
                        <div className="stat-card-top">
                            <span className="stat-icon">✓</span>
                            <span className="stat-card-label">CONFIRMED</span>
                        </div>
                        <strong className="stat-number">
                            {loading ? "—" : acceptedBookings.length}
                        </strong>
                        <span className="stat-title">Accepted</span>
                        <span className="stat-description">
                            Bookings confirmed
                        </span>
                    </article>

                    <article className="dashboard-stat-card stat-completed">
                        <div className="stat-card-top">
                            <span className="stat-icon">★</span>
                            <span className="stat-card-label">JOB HISTORY</span>
                        </div>
                        <strong className="stat-number">
                            {loading ? "—" : completedBookings.length}
                        </strong>
                        <span className="stat-title">Completed</span>
                        <span className="stat-description">
                            Jobs finished
                        </span>
                    </article>
                </section>

                {error && (
                    <div className="dashboard-error" role="alert">
                        <span className="dashboard-error-icon">!</span>
                        <div>
                            <strong>We couldn't load your bookings</strong>
                            <p>
                                {error} Please check your connection and try
                                again.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="dashboard-retry-button"
                            onClick={loadBookings}
                            disabled={loading}
                        >
                            {loading ? "Loading…" : "Try again"}
                        </button>
                    </div>
                )}

                <div className="dashboard-grid">
                    <section className="dashboard-section upcoming-section">
                        <div className="section-header">
                            <div>
                                <span className="section-label">STAY ON TRACK</span>
                                <h2>Upcoming bookings</h2>
                                <p className="section-subtitle">
                                    Your next home projects at a glance.
                                </p>
                            </div>

                            <Link to="/my-bookings" className="view-all-link">
                                View all <span aria-hidden="true">→</span>
                            </Link>
                        </div>

                        {loading ? (
                            <div className="dashboard-loading">
                                <span className="loading-spinner" />
                                <span>Loading your bookings…</span>
                            </div>
                        ) : upcomingBookings.length === 0 ? (
                            <div className="dashboard-empty">
                                <div className="empty-icon">📅</div>
                                <h3>No upcoming bookings yet</h3>
                                <p>
                                    When you book a professional, your upcoming
                                    appointments will appear here.
                                </p>
                                <Link to="/fundis" className="empty-button">
                                    Find your Fundi <span aria-hidden="true">→</span>
                                </Link>
                            </div>
                        ) : (
                            <div className="upcoming-bookings-list">
                                {upcomingBookings.slice(0, 3).map((booking) => {
                                    const fundiName = getFundiName(booking);

                                    return (
                                        <article
                                            className="dashboard-booking-card"
                                            key={booking.id}
                                        >
                                            <div className="dashboard-booking-avatar">
                                                {getInitials(fundiName)}
                                            </div>

                                            <div className="dashboard-booking-info">
                                                <h3>{fundiName}</h3>
                                                <p className="booking-trade">
                                                    {getFundiTrade(booking)}
                                                </p>

                                                <div className="booking-meta">
                                                    <span>
                                                        <span aria-hidden="true">▦</span>
                                                        {formatDate(booking.scheduledDate)}
                                                    </span>
                                                    <span>
                                                        <span aria-hidden="true">◷</span>
                                                        {formatTime(booking.scheduledTime)}
                                                    </span>
                                                </div>

                                                {booking.serviceRequired && (
                                                    <p className="booking-service-name">
                                                        {booking.serviceRequired}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="dashboard-booking-status">
                                                <span
                                                    className={`status-badge ${getStatusClass(
                                                        booking.status
                                                    )}`}
                                                >
                                                    <span className="status-dot" />
                                                    {formatStatus(booking.status)}
                                                </span>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}

                        {!loading && upcomingBookings.length > 0 && (
                            <Link
                                to="/my-bookings"
                                className="section-bottom-link"
                            >
                                Manage all bookings <span aria-hidden="true">→</span>
                            </Link>
                        )}
                    </section>

                    <section className="dashboard-section quick-actions-section">
                        <div className="section-header">
                            <div>
                                <span className="section-label">MAKE YOURSELF AT HOME</span>
                                <h2>Quick actions</h2>
                                <p className="section-subtitle">
                                    Everything you need, one click away.
                                </p>
                            </div>
                        </div>

                        <div className="quick-actions">
                            <Link to="/fundis" className="quick-action-card">
                                <span className="quick-action-icon quick-icon-teal">
                                    <span aria-hidden="true">⌕</span>
                                </span>
                                <span className="quick-action-copy">
                                    <strong>Find a Fundi</strong>
                                    <small>
                                        Browse local professionals for your project.
                                    </small>
                                </span>
                                <span className="quick-arrow" aria-hidden="true">↗</span>
                            </Link>

                            <Link
                                to="/my-bookings"
                                className="quick-action-card"
                            >
                                <span className="quick-action-icon quick-icon-blue">
                                    <span aria-hidden="true">▦</span>
                                </span>
                                <span className="quick-action-copy">
                                    <strong>My bookings</strong>
                                    <small>
                                        Check appointments and booking statuses.
                                    </small>
                                </span>
                                <span className="quick-arrow" aria-hidden="true">↗</span>
                            </Link>

                            <Link to="/profile" className="quick-action-card">
                                <span className="quick-action-icon quick-icon-purple">
                                    <span aria-hidden="true">♙</span>
                                </span>
                                <span className="quick-action-copy">
                                    <strong>Manage account</strong>
                                    <small>
                                        Go to your account and personal details.
                                    </small>
                                </span>
                                <span className="quick-arrow" aria-hidden="true">↗</span>
                            </Link>
                        </div>

                        <div className="dashboard-help-card">
                            <span className="help-card-icon" aria-hidden="true">✦</span>
                            <div>
                                <strong>A project on your mind?</strong>
                                <p>
                                    Find the right professional to help bring it
                                    to life.
                                </p>
                                <Link to="/fundis">
                                    Explore professionals <span aria-hidden="true">→</span>
                                </Link>
                            </div>
                        </div>
                    </section>
                </div>

                {bookings.length > 0 && (
                    <section className="recent-bookings-section">
                        <div className="section-header">
                            <div>
                                <span className="section-label">YOUR ACTIVITY</span>
                                <h2>Recent bookings</h2>
                                <p className="section-subtitle">
                                    A quick look at your latest service requests.
                                </p>
                            </div>

                            <Link to="/my-bookings" className="view-all-link">
                                All bookings <span aria-hidden="true">→</span>
                            </Link>
                        </div>

                        <div className="recent-bookings-table">
                            <div className="table-header">
                                <span>Professional</span>
                                <span>Service</span>
                                <span>Scheduled date</span>
                                <span>Status</span>
                            </div>

                            {bookings.slice(0, 5).map((booking) => {
                                const fundiName = getFundiName(booking);

                                return (
                                    <div className="table-row" key={booking.id}>
                                        <div className="table-fundi">
                                            <div className="table-avatar">
                                                {getInitials(fundiName)}
                                            </div>
                                            <div className="table-fundi-info">
                                                <strong>{fundiName}</strong>
                                                <small>{getFundiTrade(booking)}</small>
                                            </div>
                                        </div>

                                        <span className="table-service">
                                            {booking.serviceRequired ||
                                                booking.jobDescription ||
                                                "Home service"}
                                        </span>

                                        <span className="table-date">
                                            {formatDate(booking.scheduledDate)}
                                        </span>

                                        <span>
                                            <span
                                                className={`status-badge ${getStatusClass(
                                                    booking.status
                                                )}`}
                                            >
                                                <span className="status-dot" />
                                                {formatStatus(booking.status)}
                                            </span>
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                <footer className="dashboard-footer">
                    <span className="footer-brand-mark">F</span>
                    <span>
                        <strong>FundiShop</strong>
                        <small>Making home services simpler.</small>
                    </span>
                    <Link to="/fundis">
                        Find your next Fundi <span aria-hidden="true">→</span>
                    </Link>
                </footer>
            </div>
        </main>
    );
}

export default HomeownerDashboard;
