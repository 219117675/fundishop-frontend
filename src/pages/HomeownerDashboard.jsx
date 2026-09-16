import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./HomeownerDashboard.css";

function HomeownerDashboard() {
    const [user, setUser] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser =
            JSON.parse(localStorage.getItem("fundiShopUser"));

        setUser(storedUser);

        if (storedUser?.id) {
            fetchBookings(storedUser.id);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchBookings = async (customerId) => {
        try {
            const response = await fetch(
                `http://localhost:8080/api/bookings/customer/${customerId}`
            );

            if (!response.ok) {
                throw new Error("Failed to load bookings");
            }

            const data = await response.json();

            setBookings(data);

        } catch (error) {
            console.error(
                "Error loading homeowner bookings:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

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
        if (!status) {
            return "REQUESTED";
        }

        return status
            .toLowerCase()
            .replace("_", " ")
            .replace(/\b\w/g, (letter) =>
                letter.toUpperCase()
            );
    };

    const getFundiName = (booking) => {
        return (
            booking.fundiProfile?.user?.fullName ||
            booking.fundiProfile?.user?.name ||
            "Fundi"
        );
    };

    const getFundiTrade = (booking) => {
        const trade =
            booking.fundiProfile?.tradeCategory;

        const trades = {
            ELECTRICAL: "Electrician",
            PLUMBING: "Plumber",
            HANDYMAN: "Handyman",
            PAINTING: "Painter",
            GENERAL: "General",
        };

        return trades[trade] || trade || "Professional";
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
            .toUpperCase();
    };

    const pendingBookings = bookings.filter(
        (booking) =>
            booking.status === "REQUESTED"
    );

    const acceptedBookings = bookings.filter(
        (booking) =>
            booking.status === "ACCEPTED"
    );

    const completedBookings = bookings.filter(
        (booking) =>
            booking.status === "COMPLETED"
    );

    const upcomingBookings = bookings.filter(
        (booking) =>
            booking.status === "REQUESTED" ||
            booking.status === "ACCEPTED" ||
            booking.status === "RESCHEDULED"
    );

    return (
        <main className="homeowner-dashboard">

            <div className="dashboard-container">

                {/* ==========================================
                    WELCOME HEADER
                   ========================================== */}

                <section className="dashboard-header">

                    <div>

                        <span className="dashboard-label">
                            HOMEOWNER DASHBOARD
                        </span>

                        <h1>
                            Welcome back
                            {user?.name
                                ? `, ${user.name}`
                                : ""}
                            !
                        </h1>

                        <p>
                            Manage your bookings and find
                            trusted Fundis for your home.
                        </p>

                    </div>

                    <Link
                        to="/fundis"
                        className="find-fundi-button"
                    >
                        Find a Fundi
                    </Link>

                </section>


                {/* ==========================================
                    STATISTICS
                   ========================================== */}

                <section className="dashboard-stats">

                    <div className="dashboard-stat-card">

                        <div className="stat-icon">
                            📅
                        </div>

                        <div>
                            <strong>
                                {loading
                                    ? "..."
                                    : bookings.length}
                            </strong>

                            <span>
                                Total Bookings
                            </span>
                        </div>

                    </div>


                    <div className="dashboard-stat-card">

                        <div className="stat-icon">
                            ⏳
                        </div>

                        <div>
                            <strong>
                                {loading
                                    ? "..."
                                    : pendingBookings.length}
                            </strong>

                            <span>
                                Pending
                            </span>
                        </div>

                    </div>


                    <div className="dashboard-stat-card">

                        <div className="stat-icon">
                            ✓
                        </div>

                        <div>
                            <strong>
                                {loading
                                    ? "..."
                                    : acceptedBookings.length}
                            </strong>

                            <span>
                                Accepted
                            </span>
                        </div>

                    </div>


                    <div className="dashboard-stat-card">

                        <div className="stat-icon">
                            ★
                        </div>

                        <div>
                            <strong>
                                {loading
                                    ? "..."
                                    : completedBookings.length}
                            </strong>

                            <span>
                                Completed
                            </span>
                        </div>

                    </div>

                </section>


                {/* ==========================================
                    MAIN DASHBOARD GRID
                   ========================================== */}

                <div className="dashboard-grid">


                    {/* ======================================
                        UPCOMING BOOKINGS
                       ====================================== */}

                    <section className="dashboard-section upcoming-section">

                        <div className="section-header">

                            <div>

                                <span className="section-label">
                                    YOUR WORK
                                </span>

                                <h2>
                                    Upcoming Bookings
                                </h2>

                            </div>

                            <Link
                                to="/my-bookings"
                                className="view-all-link"
                            >
                                View All →
                            </Link>

                        </div>


                        {loading ? (

                            <div className="dashboard-loading">
                                Loading bookings...
                            </div>

                        ) : upcomingBookings.length === 0 ? (

                            <div className="dashboard-empty">

                                <div className="empty-icon">
                                    📅
                                </div>

                                <h3>
                                    No upcoming bookings
                                </h3>

                                <p>
                                    You don't have any upcoming
                                    Fundi bookings yet.
                                </p>

                                <Link
                                    to="/fundis"
                                    className="empty-button"
                                >
                                    Find a Fundi
                                </Link>

                            </div>

                        ) : (

                            <div className="upcoming-bookings-list">

                                {upcomingBookings
                                    .slice(0, 3)
                                    .map((booking) => {

                                        const fundiName =
                                            getFundiName(
                                                booking
                                            );

                                        return (
                                            <div
                                                className="dashboard-booking-card"
                                                key={booking.id}
                                            >

                                                <div className="dashboard-booking-avatar">

                                                    {getInitials(
                                                        fundiName
                                                    )}

                                                </div>


                                                <div className="dashboard-booking-info">

                                                    <h3>
                                                        {fundiName}
                                                    </h3>

                                                    <p className="booking-trade">
                                                        {getFundiTrade(
                                                            booking
                                                        )}
                                                    </p>

                                                    <div className="booking-meta">

                                                        <span>
                                                            📅{" "}
                                                            {
                                                                booking.scheduledDate
                                                            }
                                                        </span>

                                                        <span>
                                                            🕐{" "}
                                                            {
                                                                booking.scheduledTime
                                                            }
                                                        </span>

                                                    </div>

                                                </div>


                                                <div className="dashboard-booking-status">

                                                    <span
                                                        className={`status-badge ${getStatusClass(
                                                            booking.status
                                                        )}`}
                                                    >
                                                        {formatStatus(
                                                            booking.status
                                                        )}
                                                    </span>

                                                </div>

                                            </div>
                                        );
                                    })}

                            </div>

                        )}

                    </section>


                    {/* ======================================
                        QUICK ACTIONS
                       ====================================== */}

                    <section className="dashboard-section quick-actions-section">

                        <div className="section-header">

                            <div>

                                <span className="section-label">
                                    QUICK ACTIONS
                                </span>

                                <h2>
                                    What would you like to do?
                                </h2>

                            </div>

                        </div>


                        <div className="quick-actions">


                            {/* Find Fundi */}

                            <Link
                                to="/fundis"
                                className="quick-action-card"
                            >

                                <div className="quick-action-icon">
                                    🔧
                                </div>

                                <div>

                                    <h3>
                                        Find a Fundi
                                    </h3>

                                    <p>
                                        Find trusted professionals
                                        near you.
                                    </p>

                                </div>

                                <span className="quick-arrow">
                                    →
                                </span>

                            </Link>


                            {/* My Bookings */}

                            <Link
                                to="/my-bookings"
                                className="quick-action-card"
                            >

                                <div className="quick-action-icon">
                                    📅
                                </div>

                                <div>

                                    <h3>
                                        My Bookings
                                    </h3>

                                    <p>
                                        View and manage all your
                                        bookings.
                                    </p>

                                </div>

                                <span className="quick-arrow">
                                    →
                                </span>

                            </Link>


                            {/* Profile */}

                            <Link
                                to="/profile"
                                className="quick-action-card"
                            >

                                <div className="quick-action-icon">
                                    👤
                                </div>

                                <div>

                                    <h3>
                                        My Profile
                                    </h3>

                                    <p>
                                        View and update your
                                        account details.
                                    </p>

                                </div>

                                <span className="quick-arrow">
                                    →
                                </span>

                            </Link>


                        </div>

                    </section>

                </div>


                {/* ==========================================
                    RECENT BOOKINGS
                   ========================================== */}

                {bookings.length > 0 && (

                    <section className="recent-bookings-section">

                        <div className="section-header">

                            <div>

                                <span className="section-label">
                                    BOOKING HISTORY
                                </span>

                                <h2>
                                    Recent Bookings
                                </h2>

                            </div>

                            <Link
                                to="/my-bookings"
                                className="view-all-link"
                            >
                                View All →
                            </Link>

                        </div>


                        <div className="recent-bookings-table">

                            <div className="table-header">

                                <span>
                                    Fundi
                                </span>

                                <span>
                                    Service
                                </span>

                                <span>
                                    Date
                                </span>

                                <span>
                                    Status
                                </span>

                            </div>


                            {bookings
                                .slice(0, 5)
                                .map((booking) => {

                                    const fundiName =
                                        getFundiName(
                                            booking
                                        );

                                    return (
                                        <div
                                            className="table-row"
                                            key={booking.id}
                                        >

                                            <div className="table-fundi">

                                                <div className="table-avatar">
                                                    {getInitials(
                                                        fundiName
                                                    )}
                                                </div>

                                                <div>

                                                    <strong>
                                                        {fundiName}
                                                    </strong>

                                                    <small>
                                                        {
                                                            getFundiTrade(
                                                                booking
                                                            )
                                                        }
                                                    </small>

                                                </div>

                                            </div>


                                            <span>
                                                {
                                                    booking.serviceRequired
                                                }
                                            </span>


                                            <span>
                                                {
                                                    booking.scheduledDate
                                                }
                                            </span>


                                            <span
                                                className={`status-badge ${getStatusClass(
                                                    booking.status
                                                )}`}
                                            >
                                                {formatStatus(
                                                    booking.status
                                                )}
                                            </span>

                                        </div>
                                    );
                                })}

                        </div>

                    </section>

                )}

            </div>

        </main>
    );
}

export default HomeownerDashboard;