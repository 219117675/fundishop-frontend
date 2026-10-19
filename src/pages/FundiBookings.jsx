import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../api";
import "./FundiBookings.css";

function getStoredUser() {
    const storedUser = localStorage.getItem("fundiShopUser");

    if (!storedUser) {
        return null;
    }

    try {
        return JSON.parse(storedUser);
    } catch (error) {
        console.error("Invalid stored user:", error);
        localStorage.removeItem("fundiShopUser");
        return null;
    }
}

function getToken() {
    return (
        localStorage.getItem("fundiShopToken") ||
        localStorage.getItem("token") ||
        localStorage.getItem("jwtToken") ||
        ""
    );
}

function FundiBookings() {
    const navigate = useNavigate();

    const [user] = useState(() => getStoredUser());
    const [profile, setProfile] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingBookingId, setUpdatingBookingId] = useState(null);
    const [activeFilter, setActiveFilter] = useState("ALL");

    useEffect(() => {
        let cancelled = false;

        const loadBookings = async () => {
            const storedUser = getStoredUser();
            const token = getToken();

            if (
                !storedUser ||
                !storedUser.id ||
                storedUser.role !== "FUNDI"
            ) {
                navigate("/login", { replace: true });
                return;
            }

            try {
                setLoading(true);
                setError("");

                const headers = {
                    Accept: "application/json",
                };

                if (token) {
                    headers.Authorization = `Bearer ${token}`;
                }

                const profileUrl =
                    `${API_URL}/api/fundiprofiles/user/${storedUser.id}`;

                const profileResponse = await fetch(
                    profileUrl,
                    {
                        method: "GET",
                        headers,
                    }
                );

                if (cancelled) {
                    return;
                }

                if (profileResponse.status === 401) {
                    localStorage.removeItem("fundiShopToken");
                    localStorage.removeItem("token");
                    localStorage.removeItem("jwtToken");

                    setError(
                        "Your login session has expired. Please log in again."
                    );

                    setTimeout(() => {
                        navigate("/login", { replace: true });
                    }, 1200);

                    return;
                }

                if (profileResponse.status === 403) {
                    throw new Error(
                        "You do not have permission to access your Fundi profile."
                    );
                }

                if (profileResponse.status === 404) {
                    setProfile(null);
                    setBookings([]);
                    return;
                }

                if (!profileResponse.ok) {
                    throw new Error(
                        `Unable to load your Fundi profile. Server returned ${profileResponse.status}.`
                    );
                }

                const myProfile = await profileResponse.json();

                if (cancelled) {
                    return;
                }

                if (!myProfile || !myProfile.id) {
                    setProfile(null);
                    setBookings([]);
                    return;
                }

                setProfile(myProfile);

                const bookingsUrl =
                    `${API_URL}/api/bookings/fundi/${myProfile.id}`;

                const bookingsResponse = await fetch(
                    bookingsUrl,
                    {
                        method: "GET",
                        headers,
                    }
                );

                if (cancelled) {
                    return;
                }

                if (bookingsResponse.status === 401) {
                    throw new Error(
                        "Your login session has expired. Please log in again."
                    );
                }

                if (bookingsResponse.status === 403) {
                    throw new Error(
                        "You do not have permission to view these bookings."
                    );
                }

                if (bookingsResponse.status === 404) {
                    setBookings([]);
                    return;
                }

                if (!bookingsResponse.ok) {
                    throw new Error(
                        `Unable to load bookings. Server returned ${bookingsResponse.status}.`
                    );
                }

                const bookingsData =
                    await bookingsResponse.json();

                if (cancelled) {
                    return;
                }

                setBookings(
                    Array.isArray(bookingsData)
                        ? bookingsData
                        : []
                );
            } catch (err) {
                if (cancelled) {
                    return;
                }

                console.error(
                    "Error loading Fundi bookings:",
                    err
                );

                setError(
                    err.message ||
                    "Unable to load bookings."
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadBookings();

        return () => {
            cancelled = true;
        };
    }, [navigate]);

    const getHomeownerName = (homeowner) => {
        if (!homeowner) {
            return "Homeowner";
        }

        if (homeowner.fullName) {
            return homeowner.fullName;
        }

        const firstName = homeowner.firstName || "";
        const lastName = homeowner.lastName || "";

        const combinedName =
            `${firstName} ${lastName}`.trim();

        if (combinedName) {
            return combinedName;
        }

        if (homeowner.name) {
            return homeowner.name;
        }

        return "Homeowner";
    };

    /*
     * REQUESTED and RESCHEDULED bookings both require
     * action from the Fundi.
     */
    const isPendingFundiDecision = (status) => {
        return (
            status === "REQUESTED" ||
            status === "RESCHEDULED"
        );
    };

    const updateBookingStatus = async (
        bookingId,
        status
    ) => {
        if (!bookingId || !status) {
            return;
        }

        const booking = bookings.find(
            (currentBooking) =>
                currentBooking.id === bookingId
        );

        if (!booking) {
            return;
        }

        /*
         * A Fundi can respond to:
         *
         * REQUESTED   -> ACCEPTED / DECLINED
         * RESCHEDULED -> ACCEPTED / DECLINED
         */
        if (!isPendingFundiDecision(booking.status)) {
            setError(
                "This booking is no longer waiting for a Fundi response."
            );
            return;
        }

        if (
            status !== "ACCEPTED" &&
            status !== "DECLINED"
        ) {
            setError(
                "Invalid booking status update."
            );
            return;
        }

        try {
            setUpdatingBookingId(bookingId);
            setError("");

            const token = getToken();

            const headers = {
                Accept: "application/json",
            };

            if (token) {
                headers.Authorization =
                    `Bearer ${token}`;
            }

            const response = await fetch(
                `${API_URL}/api/bookings/${bookingId}/status?status=${status}`,
                {
                    method: "PUT",
                    headers,
                }
            );

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
                    `Unable to update booking. Server returned ${response.status}.`
                );
            }

            if (!data) {
                throw new Error(
                    "The server did not return the updated booking."
                );
            }

            setBookings(
                (currentBookings) =>
                    currentBookings.map(
                        (currentBooking) =>
                            currentBooking.id === data.id
                                ? data
                                : currentBooking
                    )
            );
        } catch (err) {
            console.error(
                "Error updating booking:",
                err
            );

            setError(
                err.message ||
                "Unable to update the booking. Please try again."
            );
        } finally {
            setUpdatingBookingId(null);
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case "REQUESTED":
                return "status-requested";

            case "ACCEPTED":
                return "status-accepted";

            case "DECLINED":
                return "status-declined";

            case "COMPLETED":
                return "status-completed";

            case "RESCHEDULED":
                return "status-rescheduled";

            case "CANCELLED":
                return "status-cancelled";

            default:
                return "status-default";
        }
    };

    const formatStatus = (status) => {
        if (!status) {
            return "Unknown";
        }

        return status
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(
                /\b\w/g,
                (letter) => letter.toUpperCase()
            );
    };

    const formatDate = (date) => {
        if (!date) {
            return "Not specified";
        }

        const parsedDate =
            new Date(`${date}T00:00:00`);

        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return "Not specified";
        }

        return parsedDate.toLocaleDateString(
            "en-ZA",
            {
                day: "numeric",
                month: "long",
                year: "numeric",
            }
        );
    };

    const formatTime = (time) => {
        if (!time) {
            return "Not specified";
        }

        return String(time).substring(0, 5);
    };

    const formatCurrency = (amount) => {
        if (
            amount === null ||
            amount === undefined ||
            amount === ""
        ) {
            return "Not specified";
        }

        const numericAmount = Number(amount);

        if (Number.isNaN(numericAmount)) {
            return "Not specified";
        }

        return numericAmount.toLocaleString(
            "en-ZA",
            {
                style: "currency",
                currency: "ZAR",
                minimumFractionDigits: 2,
            }
        );
    };

    const bookingCounts = useMemo(() => {
        return {
            total: bookings.length,

            requested: bookings.filter(
                (booking) =>
                    booking.status === "REQUESTED"
            ).length,

            rescheduled: bookings.filter(
                (booking) =>
                    booking.status === "RESCHEDULED"
            ).length,

            accepted: bookings.filter(
                (booking) =>
                    booking.status === "ACCEPTED"
            ).length,

            completed: bookings.filter(
                (booking) =>
                    booking.status === "COMPLETED"
            ).length,
        };
    }, [bookings]);

    const filteredBookings = useMemo(() => {
        if (activeFilter === "ALL") {
            return bookings;
        }

        /*
         * REQUESTS filter shows both brand-new requests
         * and homeowner reschedule requests.
         */
        if (activeFilter === "REQUESTS") {
            return bookings.filter(
                (booking) =>
                    booking.status === "REQUESTED" ||
                    booking.status === "RESCHEDULED"
            );
        }

        return bookings.filter(
            (booking) =>
                booking.status === activeFilter
        );
    }, [bookings, activeFilter]);

    if (loading) {
        return (
            <main className="fundi-bookings-page">
                <div className="bookings-loading">
                    <div className="bookings-spinner"></div>

                    <h1>
                        Loading Bookings
                    </h1>

                    <p>
                        Please wait while we load your booking requests.
                    </p>
                </div>
            </main>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <main className="fundi-bookings-page">
            <div className="fundi-bookings-container">

                {/* BACK LINK */}

                <Link
                    to="/fundi-dashboard"
                    className="bookings-back-link"
                >
                    <span className="back-arrow">
                        ←
                    </span>

                    Back to Dashboard
                </Link>

                {/* PAGE HEADER */}

                <header className="bookings-header">

                    <div className="bookings-heading-content">
                        <span className="bookings-label">
                            FUNDISHOP FUNDI PORTAL
                        </span>

                        <h1>
                            My Bookings
                        </h1>

                        <p>
                            Manage homeowner requests,
                            upcoming work and your booking history.
                        </p>
                    </div>

                    {profile && (
                        <div className="fundi-profile-mini">
                            <div className="profile-mini-avatar">
                                {getHomeownerName({
                                    firstName: profile.firstName,
                                    lastName: profile.lastName,
                                    fullName: profile.name
                                })
                                    .charAt(0)
                                    .toUpperCase()}
                            </div>

                            <div>
                                <span>
                                    FUNDI
                                </span>

                                <strong>
                                    {profile.name ||
                                        profile.businessName ||
                                        "My Profile"}
                                </strong>
                            </div>
                        </div>
                    )}

                </header>

                {/* ERROR */}

                {error && (
                    <div className="bookings-error">
                        <span className="error-icon">
                            !
                        </span>

                        <div>
                            <strong>
                                Something went wrong
                            </strong>

                            <p>
                                {error}
                            </p>
                        </div>
                    </div>
                )}

                {/* PROFILE NOT FOUND */}

                {!profile && !error && (
                    <div className="no-bookings">
                        <div className="no-bookings-icon">
                            🔧
                        </div>

                        <h2>
                            Fundi profile not found
                        </h2>

                        <p>
                            Your Fundi profile could not
                            be found. Please complete your
                            Fundi profile first.
                        </p>

                        <Link
                            to="/fundi-profile"
                            className="profile-button"
                        >
                            Go to My Profile
                        </Link>
                    </div>
                )}

                {/* SUMMARY */}

                {profile && bookings.length > 0 && (
                    <>
                        <section className="bookings-summary">

                            <div className="summary-item summary-total">
                                <div className="summary-icon">
                                    📋
                                </div>

                                <div>
                                    <span>
                                        TOTAL BOOKINGS
                                    </span>

                                    <strong>
                                        {bookingCounts.total}
                                    </strong>
                                </div>
                            </div>

                            <div className="summary-item summary-requested">
                                <div className="summary-icon">
                                    ⏳
                                </div>

                                <div>
                                    <span>
                                        REQUESTS
                                    </span>

                                    <strong>
                                        {bookingCounts.requested +
                                            bookingCounts.rescheduled}
                                    </strong>
                                </div>
                            </div>

                            <div className="summary-item summary-accepted">
                                <div className="summary-icon">
                                    ✓
                                </div>

                                <div>
                                    <span>
                                        ACCEPTED
                                    </span>

                                    <strong>
                                        {bookingCounts.accepted}
                                    </strong>
                                </div>
                            </div>

                            <div className="summary-item summary-completed">
                                <div className="summary-icon">
                                    ★
                                </div>

                                <div>
                                    <span>
                                        COMPLETED
                                    </span>

                                    <strong>
                                        {bookingCounts.completed}
                                    </strong>
                                </div>
                            </div>

                        </section>

                        {/* FILTERS */}

                        <section className="booking-filters">

                            <div>
                                <span className="filters-label">
                                    VIEW BOOKINGS
                                </span>

                                <h2>
                                    Booking requests
                                </h2>
                            </div>

                            <div className="filter-buttons">

                                <button
                                    type="button"
                                    className={
                                        activeFilter === "ALL"
                                            ? "filter-button active"
                                            : "filter-button"
                                    }
                                    onClick={() =>
                                        setActiveFilter("ALL")
                                    }
                                >
                                    All
                                    <span>
                                        {bookingCounts.total}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    className={
                                        activeFilter === "REQUESTS"
                                            ? "filter-button active"
                                            : "filter-button"
                                    }
                                    onClick={() =>
                                        setActiveFilter("REQUESTS")
                                    }
                                >
                                    Requests
                                    <span>
                                        {bookingCounts.requested +
                                            bookingCounts.rescheduled}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    className={
                                        activeFilter === "ACCEPTED"
                                            ? "filter-button active"
                                            : "filter-button"
                                    }
                                    onClick={() =>
                                        setActiveFilter("ACCEPTED")
                                    }
                                >
                                    Accepted
                                    <span>
                                        {bookingCounts.accepted}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    className={
                                        activeFilter === "COMPLETED"
                                            ? "filter-button active"
                                            : "filter-button"
                                    }
                                    onClick={() =>
                                        setActiveFilter("COMPLETED")
                                    }
                                >
                                    Completed
                                    <span>
                                        {bookingCounts.completed}
                                    </span>
                                </button>

                            </div>

                        </section>
                    </>
                )}

                {/* NO BOOKINGS */}

                {profile &&
                    bookings.length === 0 &&
                    !error && (
                        <div className="no-bookings">

                            <div className="no-bookings-icon">
                                📅
                            </div>

                            <h2>
                                No bookings yet
                            </h2>

                            <p>
                                You don't have any booking
                                requests yet. New homeowner
                                requests will appear here.
                            </p>

                        </div>
                    )}

                {/* FILTER HAS NO RESULTS */}

                {profile &&
                    bookings.length > 0 &&
                    filteredBookings.length === 0 && (
                        <div className="no-bookings filter-empty">

                            <div className="no-bookings-icon">
                                🔎
                            </div>

                            <h2>
                                No {formatStatus(activeFilter).toLowerCase()} bookings
                            </h2>

                            <p>
                                There are currently no bookings
                                with this status.
                            </p>

                            <button
                                type="button"
                                className="profile-button"
                                onClick={() =>
                                    setActiveFilter("ALL")
                                }
                            >
                                View All Bookings
                            </button>

                        </div>
                    )}

                {/* BOOKINGS */}

                {filteredBookings.length > 0 && (
                    <section className="bookings-list">

                        {filteredBookings.map(
                            (booking) => {
                                const homeowner =
                                    booking.customer;

                                const isUpdating =
                                    updatingBookingId ===
                                    booking.id;

                                const isRescheduleRequest =
                                    booking.status ===
                                    "RESCHEDULED";

                                return (
                                    <article
                                        className="booking-card"
                                        key={booking.id}
                                    >

                                        {/* CARD HEADER */}

                                        <div className="booking-card-header">

                                            <div className="booking-title-area">

                                                <span className="booking-card-label">
                                                    {isRescheduleRequest
                                                        ? "RESCHEDULE REQUEST"
                                                        : "BOOKING REQUEST"}
                                                </span>

                                                <h2>
                                                    {
                                                        booking.serviceRequired ||
                                                        "Service Request"
                                                    }
                                                </h2>

                                                <span className="booking-reference">
                                                    Booking #
                                                    {booking.id}
                                                </span>

                                            </div>

                                            <span
                                                className={`booking-status ${getStatusClass(
                                                    booking.status
                                                )}`}
                                            >
                                                <span className="status-dot"></span>

                                                {formatStatus(
                                                    booking.status
                                                )}
                                            </span>

                                        </div>

                                        {/* RESCHEDULE NOTICE */}

                                        {isRescheduleRequest && (
                                            <div className="booking-status-message rescheduled-message">
                                                <span>📅</span>

                                                <div>
                                                    <strong>
                                                        Homeowner requested a new date and time
                                                    </strong>

                                                    <p>
                                                        Please review the updated
                                                        schedule below and accept
                                                        or decline the rescheduled booking.
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* BOOKING DETAILS */}

                                        <div className="booking-card-content">

                                            <div className="booking-detail">

                                                <span>
                                                    👤 Homeowner
                                                </span>

                                                <strong>
                                                    {getHomeownerName(
                                                        homeowner
                                                    )}
                                                </strong>

                                            </div>

                                            <div className="booking-detail">

                                                <span>
                                                    ✉️ Email
                                                </span>

                                                <strong>
                                                    {
                                                        homeowner?.email ||
                                                        "Not available"
                                                    }
                                                </strong>

                                            </div>

                                            <div className="booking-detail">

                                                <span>
                                                    📞 Phone
                                                </span>

                                                <strong>
                                                    {
                                                        homeowner?.phone ||
                                                        "Not available"
                                                    }
                                                </strong>

                                            </div>

                                            <div className="booking-detail">

                                                <span>
                                                    📅 Date
                                                </span>

                                                <strong>
                                                    {formatDate(
                                                        booking.scheduledDate
                                                    )}
                                                </strong>

                                            </div>

                                            <div className="booking-detail">

                                                <span>
                                                    🕐 Time
                                                </span>

                                                <strong>
                                                    {formatTime(
                                                        booking.scheduledTime
                                                    )}
                                                </strong>

                                            </div>

                                            <div className="booking-detail">

                                                <span>
                                                    📍 Location
                                                </span>

                                                <strong>
                                                    {
                                                        booking.jobLocation ||
                                                        "Not specified"
                                                    }
                                                </strong>

                                            </div>

                                            <div className="booking-detail">

                                                <span>
                                                    💰 Budget
                                                </span>

                                                <strong>
                                                    {formatCurrency(
                                                        booking.estimatedBudget
                                                    )}
                                                </strong>

                                            </div>

                                            <div className="booking-detail">

                                                <span>
                                                    💵 Callout Fee
                                                </span>

                                                <strong>
                                                    {formatCurrency(
                                                        booking.calloutFee
                                                    )}
                                                </strong>

                                            </div>

                                        </div>

                                        {/* DESCRIPTION */}

                                        <div className="booking-description">

                                            <span>
                                                JOB DESCRIPTION
                                            </span>

                                            <p>
                                                {
                                                    booking.jobDescription ||
                                                    "No description provided."
                                                }
                                            </p>

                                        </div>

                                        {/* ACTIONS */}

                                        {isPendingFundiDecision(
                                            booking.status
                                        ) && (
                                            <div className="booking-actions">

                                                <button
                                                    type="button"
                                                    className="accept-booking-button"
                                                    disabled={
                                                        isUpdating
                                                    }
                                                    onClick={() =>
                                                        updateBookingStatus(
                                                            booking.id,
                                                            "ACCEPTED"
                                                        )
                                                    }
                                                >
                                                    {isUpdating
                                                        ? "Updating..."
                                                        : isRescheduleRequest
                                                            ? "✓ Accept Rescheduled Booking"
                                                            : "✓ Accept Booking"}
                                                </button>

                                                <button
                                                    type="button"
                                                    className="decline-booking-button"
                                                    disabled={
                                                        isUpdating
                                                    }
                                                    onClick={() =>
                                                        updateBookingStatus(
                                                            booking.id,
                                                            "DECLINED"
                                                        )
                                                    }
                                                >
                                                    {isUpdating
                                                        ? "Updating..."
                                                        : "✕ Decline"}
                                                </button>

                                            </div>
                                        )}

                                        {/* ACCEPTED */}

                                        {booking.status ===
                                            "ACCEPTED" && (
                                                <div className="booking-status-message accepted-message">
                                                    <span>✓</span>

                                                    <div>
                                                        <strong>
                                                            Booking accepted
                                                        </strong>

                                                        <p>
                                                            You can now prepare
                                                            for the job.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                        {/* DECLINED */}

                                        {booking.status ===
                                            "DECLINED" && (
                                                <div className="booking-status-message declined-message">
                                                    <span>✕</span>

                                                    <div>
                                                        <strong>
                                                            Booking declined
                                                        </strong>

                                                        <p>
                                                            This booking request
                                                            has been declined.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                        {/* COMPLETED */}

                                        {booking.status ===
                                            "COMPLETED" && (
                                                <div className="booking-status-message completed-message">
                                                    <span>✓</span>

                                                    <div>
                                                        <strong>
                                                            Job completed
                                                        </strong>

                                                        <p>
                                                            This booking has
                                                            been completed.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                        {/* CANCELLED */}

                                        {booking.status ===
                                            "CANCELLED" && (
                                                <div className="booking-status-message cancelled-message">
                                                    <span>×</span>

                                                    <div>
                                                        <strong>
                                                            Booking cancelled
                                                        </strong>

                                                        <p>
                                                            This booking has
                                                            been cancelled by
                                                            the homeowner.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                    </article>
                                );
                            }
                        )}

                    </section>
                )}

            </div>
        </main>
    );
}

export default FundiBookings;