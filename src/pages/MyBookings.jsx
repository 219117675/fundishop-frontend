import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./MyBookings.css";
import API_URL from "../api";

/*
 * =========================================================
 * AUTHENTICATION HELPERS
 * =========================================================
 */

function getLoggedInUser() {
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

function getAuthHeaders(includeJson = false) {
    const user = getLoggedInUser();

    const headers = {};

    if (includeJson) {
        headers["Content-Type"] = "application/json";
    }

    if (user?.token) {
        headers["Authorization"] = `Bearer ${user.token}`;
    }

    return headers;
}

/*
 * =========================================================
 * BOOKING STATUS HELPER
 * Declared outside the component so hooks can safely use it.
 * =========================================================
 */

function getBookingStatus(booking) {
    return (
        booking?.status ||
        booking?.bookingStatus ||
        "REQUESTED"
    );
}

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

function MyBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    /*
     * CANCEL
     */

    const [cancelTarget, setCancelTarget] = useState(null);
    const [cancelling, setCancelling] = useState(false);
    const [cancelError, setCancelError] = useState("");

    /*
     * RESCHEDULE
     */

    const [rescheduleTarget, setRescheduleTarget] = useState(null);
    const [rescheduleDate, setRescheduleDate] = useState("");
    const [rescheduleTime, setRescheduleTime] = useState("");
    const [rescheduling, setRescheduling] = useState(false);
    const [rescheduleError, setRescheduleError] = useState("");

    /*
     * REVIEW
     */

    const [reviewTarget, setReviewTarget] = useState(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewError, setReviewError] = useState("");
    const [reviewSuccess, setReviewSuccess] = useState("");
    const [reviewedBookings, setReviewedBookings] = useState(new Set());

    /*
     * =========================================================
     * LOAD BOOKINGS
     * =========================================================
     */

    useEffect(() => {
        let cancelled = false;

        const loadBookings = async () => {
            try {
                setLoading(true);
                setError("");

                const user = getLoggedInUser();

                if (!user) {
                    if (!cancelled) {
                        setError(
                            "Please log in to view your bookings."
                        );
                    }

                    return;
                }

                if (!user.id || user.role !== "HOMEOWNER") {
                    if (!cancelled) {
                        setError(
                            "Please log in as a homeowner to view your bookings."
                        );
                    }

                    return;
                }

                if (!user.token) {
                    if (!cancelled) {
                        setError(
                            "Your login session has expired. Please log in again."
                        );
                    }

                    return;
                }

                const response = await fetch(
                    `${API_URL}/api/bookings/customer/${user.id}`,
                    {
                        method: "GET",
                        headers: getAuthHeaders(),
                    }
                );

                if (!response.ok) {
                    let message = "Failed to load bookings.";

                    try {
                        const errorData = await response.json();

                        message =
                            errorData?.message ||
                            errorData?.error ||
                            message;
                    } catch {
                        // Response did not contain JSON.
                    }

                    throw new Error(message);
                }

                const data = await response.json();

                if (!cancelled) {
                    setBookings(
                        Array.isArray(data) ? data : []
                    );
                }
            } catch (err) {
                console.error(
                    "Error loading bookings:",
                    err
                );

                if (!cancelled) {
                    setError(
                        err.message ||
                        "Unable to load your bookings. Please try again."
                    );
                }
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
    }, []);

    /*
     * =========================================================
     * CHECK EXISTING REVIEWS
     * =========================================================
     */

    useEffect(() => {
        let cancelled = false;

        const loadExistingReviews = async () => {
            const completedBookings = bookings.filter(
                (booking) =>
                    getBookingStatus(booking) === "COMPLETED"
            );

            if (completedBookings.length === 0) {
                setReviewedBookings(new Set());
                return;
            }

            const results = await Promise.all(
                completedBookings.map(async (booking) => {
                    try {
                        const response = await fetch(
                            `${API_URL}/api/reviews/booking/${booking.id}`,
                            {
                                method: "GET",
                                headers: getAuthHeaders(),
                            }
                        );

                        if (response.ok) {
                            return booking.id;
                        }

                        return null;
                    } catch (error) {
                        console.error(
                            "Error checking review:",
                            error
                        );

                        return null;
                    }
                })
            );

            if (!cancelled) {
                setReviewedBookings(
                    new Set(
                        results.filter(
                            (id) => id !== null
                        )
                    )
                );
            }
        };

        if (!loading && !error) {
            loadExistingReviews();
        }

        return () => {
            cancelled = true;
        };
    }, [bookings, loading, error]);

    /*
     * =========================================================
     * FUNDI INFORMATION
     * =========================================================
     */

    const getFundiName = (booking) => {
        const user = booking?.fundiProfile?.user;

        if (user?.fullName) {
            return user.fullName;
        }

        if (user?.firstName && user?.lastName) {
            return `${user.firstName} ${user.lastName}`;
        }

        if (user?.firstName) {
            return user.firstName;
        }

        if (user?.name) {
            return user.name;
        }

        if (booking?.fundiProfile?.name) {
            return booking.fundiProfile.name;
        }

        return "Fundi";
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

        if (tradeNames[tradeCategory]) {
            return tradeNames[tradeCategory];
        }

        return tradeCategory
            .toLowerCase()
            .replace(/_/g, " ")
            .replace(
                /\b\w/g,
                (letter) => letter.toUpperCase()
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

    /*
     * =========================================================
     * SERVICE
     * =========================================================
     */

    const formatService = (service) => {
        if (!service) {
            return "Not specified";
        }

        return service
            .toLowerCase()
            .replace(/_/g, " ")
            .replace(
                /\b\w/g,
                (letter) => letter.toUpperCase()
            );
    };

    /*
     * =========================================================
     * DATE / TIME
     * =========================================================
     */

    const getTodayDate = () => {
        const today = new Date();

        const year = today.getFullYear();

        const month = String(
            today.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            today.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const formatDate = (date) => {
        if (!date) {
            return "Not specified";
        }

        try {
            const parsedDate = new Date(
                `${date}T00:00:00`
            );

            if (
                Number.isNaN(
                    parsedDate.getTime()
                )
            ) {
                return date;
            }

            return parsedDate.toLocaleDateString(
                "en-ZA",
                {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                }
            );
        } catch {
            return date;
        }
    };

    const formatTime = (time) => {
        if (!time) {
            return "Not specified";
        }

        return String(time).substring(0, 5);
    };

    /*
     * =========================================================
     * STATUS
     * =========================================================
     */

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
            .replace(
                /\b\w/g,
                (letter) => letter.toUpperCase()
            );
    };

    /*
     * =========================================================
     * BUDGET
     * =========================================================
     */

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

        return `R ${number.toLocaleString(
            "en-ZA",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }
)}`;
    };

    /*
     * =========================================================
     * CANCEL BOOKING
     * =========================================================
     */

    const canCancel = (status) => {
        return (
            status === "REQUESTED" ||
            status === "ACCEPTED" ||
            status === "RESCHEDULED"
        );
    };

    const openCancel = (booking) => {
        setCancelTarget(booking);
        setCancelError("");
    };

    const closeCancel = () => {
        if (cancelling) {
            return;
        }

        setCancelTarget(null);
        setCancelError("");
    };

    const confirmCancel = async () => {
        if (!cancelTarget) {
            return;
        }

        setCancelling(true);
        setCancelError("");

        try {
            const user = getLoggedInUser();

            if (!user?.token) {
                throw new Error(
                    "Your login session has expired. Please log in again."
                );
            }

            const response = await fetch(
                `${API_URL}/api/bookings/${cancelTarget.id}/status?status=CANCELLED`,
{
    method: "PUT",
        headers: getAuthHeaders(true),
}
);

const contentType =
    response.headers.get("content-type");

let updatedBooking = null;

if (
    contentType &&
    contentType.includes(
        "application/json"
    )
) {
    updatedBooking =
        await response.json();
}

if (!response.ok) {
    throw new Error(
        updatedBooking?.message ||
        updatedBooking?.error ||
        "Unable to cancel booking."
    );
}

setBookings(
    (previousBookings) =>
        previousBookings.map(
            (booking) =>
                booking.id ===
                cancelTarget.id
                    ? updatedBooking ||
                    {
                        ...booking,
                        status:
                            "CANCELLED",
                    }
                    : booking
        )
);

closeCancel();
} catch (err) {
    console.error(
        "Error cancelling booking:",
        err
    );

    setCancelError(
        err.message ||
        "Something went wrong. Please try again."
    );
} finally {
    setCancelling(false);
}
};

/*
 * =========================================================
 * RESCHEDULE BOOKING
 * =========================================================
 */

const canReschedule = (status) => {
    return (
        status === "REQUESTED" ||
        status === "ACCEPTED" ||
        status === "RESCHEDULED"
    );
};

const openReschedule = (booking) => {
    setRescheduleTarget(booking);

    setRescheduleDate(
        booking.scheduledDate || ""
    );

    setRescheduleTime(
        booking.scheduledTime
            ? String(
                booking.scheduledTime
            ).substring(0, 5)
            : ""
    );

    setRescheduleError("");
};

const closeReschedule = () => {
    if (rescheduling) {
        return;
    }

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

    if (rescheduleDate < getTodayDate()) {
        setRescheduleError(
            "Please choose today or a future date."
        );

        return;
    }

    setRescheduling(true);
    setRescheduleError("");

    try {
        const user = getLoggedInUser();

        if (!user?.token) {
            throw new Error(
                "Your login session has expired. Please log in again."
            );
        }

        const response = await fetch(
            `${API_URL}/api/bookings/${rescheduleTarget.id}/reschedule`,
            {
                method: "PUT",
                headers: getAuthHeaders(true),
                body: JSON.stringify({
                    scheduledDate:
                    rescheduleDate,
                    scheduledTime:
                    rescheduleTime,
                }),
            }
        );

        const contentType =
            response.headers.get(
                "content-type"
            );

        let updatedBooking = null;

        if (
            contentType &&
            contentType.includes(
                "application/json"
            )
        ) {
            updatedBooking =
                await response.json();
        }

        if (!response.ok) {
            throw new Error(
                updatedBooking?.message ||
                updatedBooking?.error ||
                "Unable to reschedule booking."
            );
        }

        setBookings(
            (previousBookings) =>
                previousBookings.map(
                    (booking) => {
                        if (
                            booking.id !==
                            rescheduleTarget.id
                        ) {
                            return booking;
                        }

                        if (updatedBooking) {
                            return updatedBooking;
                        }

                        const currentStatus =
                            getBookingStatus(
                                booking
                            );

                        const nextStatus =
                            currentStatus ===
                            "REQUESTED"
                                ? "REQUESTED"
                                : "RESCHEDULED";

                        return {
                            ...booking,
                            scheduledDate:
                            rescheduleDate,
                            scheduledTime:
                            rescheduleTime,
                            status:
                            nextStatus,
                        };
                    }
                )
        );

        closeReschedule();
    } catch (err) {
        console.error(
            "Error rescheduling booking:",
            err
        );

        setRescheduleError(
            err.message ||
            "Something went wrong. Please try again."
        );
    } finally {
        setRescheduling(false);
    }
};

/*
 * =========================================================
 * REVIEW
 * =========================================================
 */

const openReview = (booking) => {
    setReviewTarget(booking);
    setReviewRating(5);
    setReviewComment("");
    setReviewError("");
    setReviewSuccess("");
};

const closeReview = () => {
    if (reviewSubmitting) {
        return;
    }

    setReviewTarget(null);
    setReviewRating(5);
    setReviewComment("");
    setReviewError("");
    setReviewSuccess("");
};

const submitReview = async () => {
    if (!reviewTarget) {
        return;
    }

    const user = getLoggedInUser();

    if (!user?.id || !user?.token) {
        setReviewError(
            "Your login session has expired. Please log in again."
        );

        return;
    }

    if (
        reviewRating < 1 ||
        reviewRating > 5
    ) {
        setReviewError(
            "Please select a rating between 1 and 5."
        );

        return;
    }

    setReviewSubmitting(true);
    setReviewError("");
    setReviewSuccess("");

    try {
        const params =
            new URLSearchParams();

        params.set(
            "customerId",
            user.id
        );

        params.set(
            "rating",
            reviewRating
        );

        if (reviewComment.trim()) {
            params.set(
                "comment",
                reviewComment.trim()
            );
        }

        const response = await fetch(
            `${API_URL}/api/reviews/booking/${reviewTarget.id}?${params.toString()}`,
            {
                method: "POST",
                headers: getAuthHeaders(),
            }
        );

        const contentType =
            response.headers.get(
                "content-type"
            );

        let responseData = null;

        if (
            contentType &&
            contentType.includes(
                "application/json"
            )
        ) {
            responseData =
                await response.json();
        }

        if (!response.ok) {
            throw new Error(
                responseData?.message ||
                responseData?.error ||
                `Unable to submit review. HTTP ${response.status}`
            );
        }

        setReviewedBookings(
            (previous) => {
                const updated =
                    new Set(previous);

                updated.add(
                    reviewTarget.id
                );

                return updated;
            }
        );

        setReviewSuccess(
            "Your review has been submitted successfully."
        );

        setTimeout(() => {
            closeReview();
        }, 1200);
    } catch (err) {
        console.error(
            "Error submitting review:",
            err
        );

        setReviewError(
            err.message ||
            "Unable to submit your review. Please try again."
        );
    } finally {
        setReviewSubmitting(false);
    }
};

/*
 * =========================================================
 * RETRY
 * =========================================================
 */

const handleRetry = () => {
    window.location.reload();
};

/*
 * =========================================================
 * PAGE
 * =========================================================
 */

return (
    <main className="my-bookings-page">

        <div className="my-bookings-container">

            <Link
                to="/homeowner"
                className="bookings-back-link"
            >
                ← Back to Dashboard
            </Link>

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
                        type="button"
                        className="retry-button"
                        onClick={handleRetry}
                    >
                        Try Again
                    </button>

                </div>
            )}

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
                                    getFundiName(
                                        booking
                                    );

                                const fundiTrade =
                                    getFundiTrade(
                                        booking
                                    );

                                const bookingStatus =
                                    getBookingStatus(
                                        booking
                                    );

                                const canReview =
                                    bookingStatus ===
                                    "COMPLETED";

                                const alreadyReviewed =
                                    reviewedBookings.has(
                                        booking.id
                                    );

                                return (
                                    <article
                                        className="booking-card"
                                        key={
                                            booking.id
                                        }
                                    >

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

                                        <div className="booking-status-column">

                                                <span
                                                    className={getStatusClass(
                                                        bookingStatus
                                                    )}
                                                >
                                                    {formatStatus(
                                                        bookingStatus
                                                    )}
                                                </span>

                                        </div>

                                        <div className="booking-details">

                                            <div className="booking-detail">
                                                    <span className="detail-label">
                                                        Service
                                                    </span>

                                                <strong>
                                                    {formatService(
                                                        booking.serviceRequired
                                                    )}
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

                                        {booking.jobDescription && (
                                            <div className="booking-description">

                                                    <span>
                                                        Job Description
                                                    </span>

                                                <p>
                                                    {
                                                        booking.jobDescription
                                                    }
                                                </p>

                                            </div>
                                        )}

                                        <div className="booking-actions">

                                            {booking.fundiProfile?.id && (
                                                <Link
                                                    to={`/fundis/${booking.fundiProfile.id}`}
                                                    className="view-fundi-button"
                                                >
                                                    View Fundi
                                                </Link>
                                            )}

                                            {canReview &&
                                                !alreadyReviewed && (
                                                    <button
                                                        type="button"
                                                        className="review-booking-button"
                                                        onClick={() =>
                                                            openReview(
                                                                booking
                                                            )
                                                        }
                                                    >
                                                        Leave a Review
                                                    </button>
                                                )}

                                            {canReview &&
                                                alreadyReviewed && (
                                                    <span className="review-submitted-label">
                                                            ✓ Review Submitted
                                                        </span>
                                                )}

                                            {canReschedule(
                                                bookingStatus
                                            ) && (
                                                <button
                                                    type="button"
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
                                                bookingStatus
                                            ) && (
                                                <button
                                                    type="button"
                                                    className="cancel-booking-button"
                                                    onClick={() =>
                                                        openCancel(
                                                            booking
                                                        )
                                                    }
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

        {/* CANCEL MODAL */}

        {cancelTarget && (
            <div className="cancel-modal-overlay">

                <div className="cancel-modal">

                    <h3>
                        Cancel this booking?
                    </h3>

                    <p>
                        You're about to cancel your
                        booking with{" "}
                        <strong>
                            {getFundiName(
                                cancelTarget
                            )}
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
                            type="button"
                            className="keep-booking-button"
                            onClick={closeCancel}
                            disabled={cancelling}
                        >
                            Keep Booking
                        </button>

                        <button
                            type="button"
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

        {/* RESCHEDULE MODAL */}

        {rescheduleTarget && (
            <div className="reschedule-modal-overlay">

                <div className="reschedule-modal">

                    <h3>
                        Reschedule this booking?
                    </h3>

                    <p>
                        Pick a new date and time
                        for your booking with{" "}
                        <strong>
                            {getFundiName(
                                rescheduleTarget
                            )}
                        </strong>
                        .
                    </p>

                    <div className="reschedule-modal-fields">

                        <label>
                                <span>
                                    New date
                                </span>

                            <input
                                type="date"
                                min={getTodayDate()}
                                value={
                                    rescheduleDate
                                }
                                onChange={(event) =>
                                    setRescheduleDate(
                                        event.target.value
                                    )
                                }
                                disabled={
                                    rescheduling
                                }
                            />
                        </label>

                        <label>
                                <span>
                                    New time
                                </span>

                            <input
                                type="time"
                                value={
                                    rescheduleTime
                                }
                                onChange={(event) =>
                                    setRescheduleTime(
                                        event.target.value
                                    )
                                }
                                disabled={
                                    rescheduling
                                }
                            />
                        </label>

                    </div>

                    {rescheduleError && (
                        <p className="reschedule-modal-error">
                            {
                                rescheduleError
                            }
                        </p>
                    )}

                    <div className="reschedule-modal-actions">

                        <button
                            type="button"
                            className="keep-booking-button"
                            onClick={
                                closeReschedule
                            }
                            disabled={
                                rescheduling
                            }
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            className="confirm-reschedule-button"
                            onClick={
                                confirmReschedule
                            }
                            disabled={
                                rescheduling
                            }
                        >
                            {rescheduling
                                ? "Saving..."
                                : "Confirm New Time"}
                        </button>

                    </div>

                </div>

            </div>
        )}

        {/* REVIEW MODAL */}

        {reviewTarget && (
            <div className="review-modal-overlay">

                <div className="review-modal">

                    <div className="review-modal-header">

                            <span className="review-modal-label">
                                COMPLETED BOOKING
                            </span>

                        <h3>
                            Review{" "}
                            {getFundiName(
                                reviewTarget
                            )}
                        </h3>

                        <p>
                            How was your experience
                            with this Fundi?
                        </p>

                    </div>

                    <div className="review-rating-section">

                            <span>
                                Your rating
                            </span>

                        <div className="review-stars">

                            {[1, 2, 3, 4, 5].map(
                                (star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        className={
                                            star <=
                                            reviewRating
                                                ? "review-star active"
                                                : "review-star"
                                        }
                                        onClick={() =>
                                            setReviewRating(
                                                star
                                            )
                                        }
                                        disabled={
                                            reviewSubmitting
                                        }
                                        aria-label={`${star} star rating`}
                                    >
                                        ★
                                    </button>
                                )
                            )}

                        </div>

                        <strong>
                            {reviewRating}{" "}
                            {reviewRating === 1
                                ? "Star"
                                : "Stars"}
                        </strong>

                    </div>

                    <label className="review-comment-field">

                            <span>
                                Comment
                            </span>

                        <textarea
                            value={
                                reviewComment
                            }
                            onChange={(event) =>
                                setReviewComment(
                                    event.target.value
                                )
                            }
                            placeholder="Tell other homeowners about your experience..."
                            maxLength={1000}
                            rows={5}
                            disabled={
                                reviewSubmitting
                            }
                        />

                        <small>
                            {reviewComment.length}/1000
                        </small>

                    </label>

                    {reviewError && (
                        <p className="review-modal-error">
                            {reviewError}
                        </p>
                    )}

                    {reviewSuccess && (
                        <p className="review-modal-success">
                            {reviewSuccess}
                        </p>
                    )}

                    <div className="review-modal-actions">

                        <button
                            type="button"
                            className="review-cancel-button"
                            onClick={closeReview}
                            disabled={
                                reviewSubmitting
                            }
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            className="review-submit-button"
                            onClick={
                                submitReview
                            }
                            disabled={
                                reviewSubmitting
                            }
                        >
                            {reviewSubmitting
                                ? "Submitting..."
                                : "Submit Review"}
                        </button>

                    </div>

                </div>

            </div>
        )}

    </main>
);
}

export default MyBookings;

