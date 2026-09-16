import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./MyBookings.css";

function MyBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [cancelTarget, setCancelTarget] = useState(null);
    const [cancelling, setCancelling] = useState(false);
    const [cancelError, setCancelError] = useState("");

    const [rescheduleTarget, setRescheduleTarget] = useState(null);
    const [rescheduleDate, setRescheduleDate] = useState("");
    const [rescheduleTime, setRescheduleTime] = useState("");
    const [rescheduling, setRescheduling] = useState(false);
    const [rescheduleError, setRescheduleError] = useState("");

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        try {
            const storedUser = JSON.parse(
                localStorage.getItem("fundiShopUser")
            );

            if (!storedUser?.id) {
                setError("Please log in to view your bookings.");
                setLoading(false);
                return;
            }

            const response = await fetch(
                `http://localhost:8080/api/bookings/customer/${storedUser.id}`
            );

            if (!response.ok) {
                throw new Error("Failed to load bookings.");
            }

            const data = await response.json();

            setBookings(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error loading bookings:", err);

            setError(
                "Unable to load your bookings. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    /* =========================
       FUNDİ INFORMATION
    ========================= */

    const getFundiName = (booking) => {
        return (
            booking?.fundiProfile?.user?.fullName ||
            booking?.fundiProfile?.user?.name ||
            booking?.fundiProfile?.name ||
            "Fundi"
        );
    };

    const getFundiTrade = (booking) => {
        const tradeCategory =
            booking?.fundiProfile?.tradeCategory;

        if (!tradeCategory) {
            return "Professional";
        }

        const tradeNames = {
            PLUMBING: "Plumber",
            ELECTRICAL: "Electrician",
            CARPENTRY: "Carpenter",
            PAINTING: "Painter",
            TILING: "Tiler",
            BRICKLAYING: "Bricklayer",
            ROOFING: "Roofer",
            WELDING: "Welder",
            GARDENING: "Gardener",
            HANDYMAN: "Handyman",
            CLEANING: "Cleaner",
            GENERAL: "General Handyman",
        };

        return (
            tradeNames[tradeCategory] ||
            tradeCategory
                .toLowerCase()
                .replace(/_/g, " ")
                .replace(/\b\w/g, (letter) =>
                    letter.toUpperCase()
                )
        );
    };

    const getInitials = (name) => {
        if (!name) {
            return "F";
        }

        return name
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .map((part) => part.charAt(0))
            .join("")
            .substring(0, 2)
            .toUpperCase();
    };

    /* =========================
       DATE / TIME
    ========================= */

    const formatDate = (date) => {
        if (!date) {
            return "Not specified";
        }

        try {
            const parsedDate = new Date(`${date}T00:00:00`);

            if (Number.isNaN(parsedDate.getTime())) {
                return date;
            }

            return parsedDate.toLocaleDateString("en-ZA", {
                day: "2-digit",
                month: "long",
                year: "numeric",
            });
        } catch {
            return date;
        }
    };

    const formatTime = (time) => {
        if (!time) {
            return "Not specified";
        }

        return time.substring(0, 5);
    };

    /* =========================
       STATUS
    ========================= */

    const getStatusClass = (status) => {
        switch (status) {
            case "ACCEPTED":
                return "booking-status accepted";

            case "DECLINED":
                return "booking-status declined";

            case "COMPLETED":
                return "booking-status completed";

            case "CANCELLED":
                return "booking-status cancelled";

            case "RESCHEDULED":
                return "booking-status rescheduled";

            case "REQUESTED":
            default:
                return "booking-status requested";
        }
    };

    const formatStatus = (status) => {
        if (!status) {
            return "Requested";
        }

        return status
            .toLowerCase()
            .replace(/_/g, " ")
            .replace(/\b\w/g, (letter) =>
                letter.toUpperCase()
            );
    };

    /* =========================
       BUDGET
    ========================= */

    const formatBudget = (budget) => {
        if (
            budget === null ||
            budget === undefined ||
            budget === ""
        ) {
            return "Not specified";
        }

        const number = Number(budget);

        if (Number.isNaN(number)) {
            return `R ${budget}`;
        }

        return `R ${number.toLocaleString("en-ZA", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    /* =========================
       CANCEL BOOKING
    ========================= */

    const canCancel = (status) => {
        return status === "REQUESTED" || status === "ACCEPTED";
    };

    const confirmCancel = async () => {
        if (!cancelTarget) {
            return;
        }

        setCancelling(true);
        setCancelError("");

        try {
            const response = await fetch(
                `http://localhost:8080/api/bookings/${cancelTarget.id}/status?status=CANCELLED`,
                { method: "PUT" }
            );

            if (!response.ok) {
                const message = await response.text();

                throw new Error(
                    message || "Unable to cancel booking."
                );
            }

            const updatedBooking = await response.json();

            setBookings((prev) =>
                prev.map((booking) =>
                    booking.id === cancelTarget.id
                        ? updatedBooking
                        : booking
                )
            );

            setCancelTarget(null);
        } catch (err) {
            console.error("Error cancelling booking:", err);

            setCancelError(
                err.message ||
                "Something went wrong. Please try again."
            );
        } finally {
            setCancelling(false);
        }
    };

    /* =========================
       RESCHEDULE BOOKING
    ========================= */

    const canReschedule = (status) => {
        return status === "REQUESTED" || status === "ACCEPTED";
    };

    const openReschedule = (booking) => {
        setRescheduleTarget(booking);
        setRescheduleDate(booking.scheduledDate || "");
        setRescheduleTime(
            booking.scheduledTime
                ? booking.scheduledTime.substring(0, 5)
                : ""
        );
        setRescheduleError("");
    };

    const closeReschedule = () => {
        setRescheduleTarget(null);
        setRescheduleDate("");
        setRescheduleTime("");
        setRescheduleError("");
    };

    const confirmReschedule = async () => {
        if (!rescheduleTarget) {
            return;
        }

        if (!rescheduleDate || !rescheduleTime) {
            setRescheduleError(
                "Please choose a date and time."
            );
            return;
        }

        setRescheduling(true);
        setRescheduleError("");

        try {
            const response = await fetch(
                `http://localhost:8080/api/bookings/${rescheduleTarget.id}/reschedule`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        scheduledDate: rescheduleDate,
                        scheduledTime: rescheduleTime,
                    }),
                }
            );

            if (!response.ok) {
                const message = await response.text();

                throw new Error(
                    message || "Unable to reschedule booking."
                );
            }

            const updatedBooking = await response.json();

            setBookings((prev) =>
                prev.map((booking) =>
                    booking.id === rescheduleTarget.id
                        ? updatedBooking
                        : booking
                )
            );

            closeReschedule();
        } catch (err) {
            console.error("Error rescheduling booking:", err);

            setRescheduleError(
                err.message ||
                "Something went wrong. Please try again."
            );
        } finally {
            setRescheduling(false);
        }
    };

    /* =========================
       RETRY
    ========================= */

    const handleRetry = () => {
        setError("");
        setLoading(true);
        loadBookings();
    };

    return (
        <main className="my-bookings-page">
            <div className="my-bookings-container">

                {/* =========================
                    BACK LINK
                ========================= */}

                <Link
                    to="/homeowner"
                    className="bookings-back-link"
                >
                    ← Back to Dashboard
                </Link>


                {/* =========================
                    HEADER
                ========================= */}

                <section className="my-bookings-header">

                    <div className="my-bookings-header-content">

                        <span className="bookings-label">
                            HOMEOWNER
                        </span>

                        <h1>
                            My Bookings
                        </h1>

                        <p>
                            View and manage all the Fundi
                            services you have requested.
                        </p>

                    </div>

                    <Link
                        to="/fundis"
                        className="find-fundi-button"
                    >
                        Find a Fundi
                    </Link>

                </section>


                {/* =========================
                    LOADING
                ========================= */}

                {loading && (
                    <div className="bookings-message">

                        <div className="loading-icon">
                            ⏳
                        </div>

                        <h2>
                            Loading your bookings...
                        </h2>

                        <p>
                            Please wait while we retrieve
                            your bookings.
                        </p>

                    </div>
                )}


                {/* =========================
                    ERROR
                ========================= */}

                {!loading && error && (
                    <div className="bookings-message error-message">

                        <div className="message-icon">
                            ⚠️
                        </div>

                        <h2>
                            Something went wrong
                        </h2>

                        <p>
                            {error}
                        </p>

                        <button
                            className="retry-button"
                            onClick={handleRetry}
                        >
                            Try Again
                        </button>

                    </div>
                )}


                {/* =========================
                    NO BOOKINGS
                ========================= */}

                {!loading &&
                    !error &&
                    bookings.length === 0 && (
                        <div className="bookings-message">

                            <div className="message-icon">
                                📅
                            </div>

                            <h2>
                                You don't have any bookings yet
                            </h2>

                            <p>
                                Find a trusted Fundi and book
                                a professional for your next job.
                            </p>

                            <Link
                                to="/fundis"
                                className="browse-fundis-button"
                            >
                                Find a Fundi
                            </Link>

                        </div>
                    )}


                {/* =========================
                    BOOKINGS
                ========================= */}

                {!loading &&
                    !error &&
                    bookings.length > 0 && (
                        <section className="bookings-section">

                            <div className="bookings-section-heading">

                                <div>
                                    <span>
                                        YOUR BOOKINGS
                                    </span>

                                    <h2>
                                        {bookings.length}{" "}
                                        {bookings.length === 1
                                            ? "Booking"
                                            : "Bookings"}
                                    </h2>
                                </div>

                            </div>


                            <div className="bookings-list">

                                {bookings.map((booking) => {

                                    const fundiName =
                                        getFundiName(booking);

                                    const fundiTrade =
                                        getFundiTrade(booking);

                                    return (
                                        <article
                                            className="booking-card"
                                            key={booking.id}
                                        >

                                            {/* =========================
                                                FUNDİ
                                            ========================= */}

                                            <div className="booking-fundi">

                                                <div className="booking-avatar">
                                                    {getInitials(
                                                        fundiName
                                                    )}
                                                </div>

                                                <div className="booking-fundi-info">

                                                    <h3>
                                                        {fundiName}
                                                    </h3>

                                                    <p>
                                                        {fundiTrade}
                                                    </p>

                                                </div>

                                            </div>


                                            {/* =========================
                                                STATUS
                                            ========================= */}

                                            <div className="booking-status-column">

                                                <span
                                                    className={getStatusClass(
                                                        booking.status
                                                    )}
                                                >
                                                    {formatStatus(
                                                        booking.status
                                                    )}
                                                </span>

                                            </div>


                                            {/* =========================
                                                DETAILS
                                            ========================= */}

                                            <div className="booking-details">

                                                <div className="booking-detail">

                                                    <span className="detail-label">
                                                        Service
                                                    </span>

                                                    <strong>
                                                        {booking.serviceRequired ||
                                                            "Not specified"}
                                                    </strong>

                                                </div>


                                                <div className="booking-detail">

                                                    <span className="detail-label">
                                                        Date
                                                    </span>

                                                    <strong>
                                                        {formatDate(
                                                            booking.scheduledDate
                                                        )}
                                                    </strong>

                                                </div>


                                                <div className="booking-detail">

                                                    <span className="detail-label">
                                                        Time
                                                    </span>

                                                    <strong>
                                                        {formatTime(
                                                            booking.scheduledTime
                                                        )}
                                                    </strong>

                                                </div>


                                                <div className="booking-detail">

                                                    <span className="detail-label">
                                                        Location
                                                    </span>

                                                    <strong>
                                                        {booking.jobLocation ||
                                                            "Not specified"}
                                                    </strong>

                                                </div>


                                                <div className="booking-detail">

                                                    <span className="detail-label">
                                                        Budget
                                                    </span>

                                                    <strong>
                                                        {formatBudget(
                                                            booking.estimatedBudget
                                                        )}
                                                    </strong>

                                                </div>

                                            </div>


                                            {/* =========================
                                                DESCRIPTION
                                            ========================= */}

                                            {booking.jobDescription && (
                                                <div className="booking-description">

                                                    <span>
                                                        Job Description
                                                    </span>

                                                    <p>
                                                        {booking.jobDescription}
                                                    </p>

                                                </div>
                                            )}


                                            {/* =========================
                                                ACTIONS
                                            ========================= */}

                                            <div className="booking-actions">

                                                {booking.fundiProfile?.id && (
                                                    <Link
                                                        to={`/fundis/${booking.fundiProfile.id}`}
                                                        className="view-fundi-button"
                                                    >
                                                        View Fundi
                                                    </Link>
                                                )}

                                                {canReschedule(
                                                    booking.status
                                                ) && (
                                                    <button
                                                        className="reschedule-booking-button"
                                                        onClick={() =>
                                                            openReschedule(
                                                                booking
                                                            )
                                                        }
                                                    >
                                                        Reschedule
                                                    </button>
                                                )}

                                                {canCancel(
                                                    booking.status
                                                ) && (
                                                    <button
                                                        className="cancel-booking-button"
                                                        onClick={() => {
                                                            setCancelTarget(
                                                                booking
                                                            );
                                                            setCancelError(
                                                                ""
                                                            );
                                                        }}
                                                    >
                                                        Cancel Booking
                                                    </button>
                                                )}

                                            </div>

                                        </article>
                                    );
                                })}

                            </div>

                        </section>
                    )}

            </div>


            {/* =========================
                CANCEL CONFIRMATION MODAL
            ========================= */}

            {cancelTarget && (
                <div className="cancel-modal-overlay">
                    <div className="cancel-modal">

                        <h3>
                            Cancel this booking?
                        </h3>

                        <p>
                            You're about to cancel your booking
                            with{" "}
                            <strong>
                                {getFundiName(cancelTarget)}
                            </strong>
                            . This can't be undone.
                        </p>

                        {cancelError && (
                            <p className="cancel-modal-error">
                                {cancelError}
                            </p>
                        )}

                        <div className="cancel-modal-actions">

                            <button
                                className="keep-booking-button"
                                onClick={() => {
                                    setCancelTarget(null);
                                    setCancelError("");
                                }}
                                disabled={cancelling}
                            >
                                Keep Booking
                            </button>

                            <button
                                className="confirm-cancel-button"
                                onClick={confirmCancel}
                                disabled={cancelling}
                            >
                                {cancelling
                                    ? "Cancelling..."
                                    : "Cancel Booking"}
                            </button>

                        </div>

                    </div>
                </div>
            )}


            {/* =========================
                RESCHEDULE MODAL
            ========================= */}

            {rescheduleTarget && (
                <div className="reschedule-modal-overlay">
                    <div className="reschedule-modal">

                        <h3>
                            Reschedule this booking?
                        </h3>

                        <p>
                            Pick a new date and time for your
                            booking with{" "}
                            <strong>
                                {getFundiName(rescheduleTarget)}
                            </strong>
                            .
                        </p>

                        <div className="reschedule-modal-fields">

                            <label>
                                <span>New date</span>
                                <input
                                    type="date"
                                    value={rescheduleDate}
                                    onChange={(e) =>
                                        setRescheduleDate(
                                            e.target.value
                                        )
                                    }
                                    disabled={rescheduling}
                                />
                            </label>

                            <label>
                                <span>New time</span>
                                <input
                                    type="time"
                                    value={rescheduleTime}
                                    onChange={(e) =>
                                        setRescheduleTime(
                                            e.target.value
                                        )
                                    }
                                    disabled={rescheduling}
                                />
                            </label>

                        </div>

                        {rescheduleError && (
                            <p className="reschedule-modal-error">
                                {rescheduleError}
                            </p>
                        )}

                        <div className="reschedule-modal-actions">

                            <button
                                className="keep-booking-button"
                                onClick={closeReschedule}
                                disabled={rescheduling}
                            >
                                Cancel
                            </button>

                            <button
                                className="confirm-reschedule-button"
                                onClick={confirmReschedule}
                                disabled={rescheduling}
                            >
                                {rescheduling
                                    ? "Saving..."
                                    : "Confirm New Time"}
                            </button>

                        </div>

                    </div>
                </div>
            )}

        </main>
    );
}

export default MyBookings;
