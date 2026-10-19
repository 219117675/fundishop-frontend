
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../api";
import "./FundiDashboard.css";

/* =========================================================
   STORED USER
   Login may save the user in sessionStorage or localStorage.
========================================================= */

function getStoredUser() {
    const storedUser =
        sessionStorage.getItem("fundiShopUser") ||
        localStorage.getItem("fundiShopUser");

    if (!storedUser) {
        return null;
    }

    try {
        const parsedUser = JSON.parse(storedUser);

        if (!parsedUser || typeof parsedUser !== "object") {
            return null;
        }

        return {
            ...parsedUser,
            role:
                typeof parsedUser.role === "string"
                    ? parsedUser.role.trim().toUpperCase()
                    : "",
        };
    } catch (error) {
        console.error("Invalid stored FundiShop user:", error);
        return null;
    }
}

/* =========================================================
   FUNDI DASHBOARD
========================================================= */

function FundiDashboard() {
    const navigate = useNavigate();

    const [user] = useState(() => getStoredUser());
    const [profile, setProfile] = useState(null);
    const [bookings, setBookings] = useState([]);

    /* REVIEWS */

    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewsError, setReviewsError] = useState("");
    const [showReviews, setShowReviews] = useState(false);

    const [loading, setLoading] = useState(true);
    const [bookingsLoading, setBookingsLoading] = useState(false);

    const [error, setError] = useState("");
    const [bookingError, setBookingError] = useState("");

    const [actionLoading, setActionLoading] = useState(null);

    const [rescheduleTarget, setRescheduleTarget] = useState(null);
    const [rescheduleDate, setRescheduleDate] = useState("");
    const [rescheduleTime, setRescheduleTime] = useState("");
    const [rescheduleError, setRescheduleError] = useState("");

    /* =====================================================
       AUTH HEADERS
    ===================================================== */

    const getAuthHeaders = useCallback((includeJson = false) => {
        const storedUser = getStoredUser();

        const headers = {
            Accept: "application/json",
        };

        if (includeJson) {
            headers["Content-Type"] = "application/json";
        }

        const token =
            storedUser?.token ||
            sessionStorage.getItem("fundiShopToken") ||
            localStorage.getItem("fundiShopToken") ||
            sessionStorage.getItem("token") ||
            localStorage.getItem("token") ||
            sessionStorage.getItem("jwtToken") ||
            localStorage.getItem("jwtToken");

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        return headers;
    }, []);

    /* =====================================================
       GET BOOKING STATUS
    ===================================================== */

    const getBookingStatus = useCallback((booking) => {
        if (!booking) {
            return "";
        }

        const status =
            booking.bookingStatus ??
            booking.status ??
            booking.booking_status ??
            "";

        return String(status).toUpperCase();
    }, []);

    /* =====================================================
       LOAD REVIEWS
    ===================================================== */

    const loadReviews = useCallback(
        async (fundiProfileId) => {
            if (!fundiProfileId) {
                setReviews([]);
                return;
            }

            try {
                setReviewsLoading(true);
                setReviewsError("");

                const response = await fetch(
                    `${API_URL}/api/reviews/fundi/${fundiProfileId}`,
                    {
                        method: "GET",
                        headers: getAuthHeaders(),
                    }
                );

                if (response.status === 404) {
                    setReviews([]);
                    return;
                }

                if (!response.ok) {
                    throw new Error(
                        `Failed to load reviews. Status: ${response.status}`
                    );
                }

                const data = await response.json();

                console.log("FUNDI REVIEWS RESPONSE:", data);

                setReviews(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Reviews error:", err);

                setReviewsError(
                    err.message || "Unable to load your reviews."
                );

                setReviews([]);
            } finally {
                setReviewsLoading(false);
            }
        },
        [getAuthHeaders]
    );

    /* =====================================================
       LOAD BOOKINGS
    ===================================================== */

    const loadBookings = useCallback(
        async (fundiProfileId) => {
            if (!fundiProfileId) {
                setBookings([]);
                return;
            }

            try {
                setBookingsLoading(true);
                setBookingError("");

                const response = await fetch(
                    `${API_URL}/api/bookings/fundi/${fundiProfileId}`,
                    {
                        method: "GET",
                        headers: getAuthHeaders(),
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        `Failed to load bookings. Status: ${response.status}`
                    );
                }

                const data = await response.json();

                console.log("FUNDI BOOKINGS RESPONSE:", data);

                setBookings(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Bookings error:", err);

                setBookingError(
                    err.message || "Unable to load your bookings."
                );
            } finally {
                setBookingsLoading(false);
            }
        },
        [getAuthHeaders]
    );

    /* =====================================================
       LOAD FUNDI PROFILE
    ===================================================== */

    const loadProfile = useCallback(
        async (storedUser) => {
            if (!storedUser?.id) {
                setError("Your account ID is missing. Please log in again.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `${API_URL}/api/fundiprofiles/user/${storedUser.id}`,
                    {
                        method: "GET",
                        headers: getAuthHeaders(),
                    }
                );

                if (response.status === 404) {
                    setProfile(null);
                    setBookings([]);
                    setReviews([]);
                    return;
                }

                if (!response.ok) {
                    throw new Error(
                        `Failed to load profile. Status: ${response.status}`
                    );
                }

                const data = await response.json();

                console.log("FUNDI PROFILE:", data);

                setProfile(data);

                if (data?.id) {
                    await Promise.all([
                        loadBookings(data.id),
                        loadReviews(data.id),
                    ]);
                } else {
                    setBookings([]);
                    setReviews([]);
                }
            } catch (err) {
                console.error("Profile error:", err);

                setError(err.message || "Failed to load profile.");
            } finally {
                setLoading(false);
            }
        },
        [getAuthHeaders, loadBookings, loadReviews]
    );

    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    useEffect(() => {
        if (!user) {
            navigate("/login", { replace: true });
            return;
        }

        if (user.role !== "FUNDI") {
            navigate("/", { replace: true });
            return;
        }

        const timer = setTimeout(() => {
            loadProfile(user);
        }, 0);

        return () => clearTimeout(timer);
    }, [user, navigate, loadProfile]);

    /* =====================================================
       REFRESH BOOKINGS AND REVIEWS
    ===================================================== */

    const refreshBookings = async () => {
        if (!profile?.id) {
            return;
        }

        await Promise.all([
            loadBookings(profile.id),
            loadReviews(profile.id),
        ]);
    };

    /* =====================================================
       UPDATE BOOKING STATUS
    ===================================================== */

    const updateBookingStatus = async (bookingId, status) => {
        try {
            setActionLoading(`${bookingId}-${status}`);
            setBookingError("");

            console.log(`Updating booking ${bookingId} to ${status}`);

            const response = await fetch(
                `${API_URL}/api/bookings/${bookingId}/status?status=${status}`,
                {
                    method: "PUT",
                    headers: getAuthHeaders(true),
                }
            );

            if (!response.ok) {
                const text = await response.text();

                throw new Error(
                    text ||
                    `Unable to update booking. Status: ${response.status}`
                );
            }

            const updatedBooking = await response.json();

            console.log("UPDATED BOOKING:", updatedBooking);

            await refreshBookings();
        } catch (err) {
            console.error("Booking status update error:", err);

            setBookingError(
                err.message || "Unable to update booking status."
            );
        } finally {
            setActionLoading(null);
        }
    };

    /* =====================================================
       OPEN RESCHEDULE
    ===================================================== */

    const openRescheduleModal = (booking) => {
        setRescheduleTarget(booking);

        setRescheduleDate(
            booking.scheduledDate
                ? String(booking.scheduledDate)
                : ""
        );

        setRescheduleTime(
            booking.scheduledTime
                ? String(booking.scheduledTime).substring(0, 5)
                : ""
        );

        setRescheduleError("");
    };

    /* =====================================================
       CLOSE RESCHEDULE
    ===================================================== */

    const closeRescheduleModal = () => {
        setRescheduleTarget(null);
        setRescheduleDate("");
        setRescheduleTime("");
        setRescheduleError("");
    };

    /* =====================================================
       RESCHEDULE BOOKING
    ===================================================== */

    const rescheduleBooking = async (event) => {
        event.preventDefault();

        if (!rescheduleTarget) {
            return;
        }

        if (!rescheduleDate || !rescheduleTime) {
            setRescheduleError("Please select both a date and a time.");
            return;
        }

        try {
            setActionLoading(`${rescheduleTarget.id}-RESCHEDULE`);
            setRescheduleError("");

            const response = await fetch(
                `${API_URL}/api/bookings/${rescheduleTarget.id}/reschedule`,
                {
                    method: "PUT",
                    headers: getAuthHeaders(true),
                    body: JSON.stringify({
                        scheduledDate: rescheduleDate,
                        scheduledTime: rescheduleTime,
                    }),
                }
            );

            if (!response.ok) {
                const text = await response.text();

                throw new Error(
                    text ||
                    `Unable to reschedule booking. Status: ${response.status}`
                );
            }

            const updatedBooking = await response.json();

            console.log("RESCHEDULED BOOKING:", updatedBooking);

            await refreshBookings();
            closeRescheduleModal();
        } catch (err) {
            console.error("Reschedule error:", err);

            setRescheduleError(
                err.message || "Unable to reschedule booking."
            );
        } finally {
            setActionLoading(null);
        }
    };

    /* =====================================================
       LOGOUT
    ===================================================== */

    const handleLogout = () => {
        sessionStorage.removeItem("fundiShopUser");
        sessionStorage.removeItem("fundiShopToken");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("jwtToken");

        localStorage.removeItem("fundiShopUser");
        localStorage.removeItem("fundiShopToken");
        localStorage.removeItem("token");
        localStorage.removeItem("jwtToken");

        navigate("/login", { replace: true });
    };

    /* =====================================================
       FORMAT HELPERS
    ===================================================== */

    const formatStatus = (status) => {
        if (!status) {
            return "Unknown";
        }

        return String(status)
            .toLowerCase()
            .replace(/_/g, " ")
            .replace(/\b\w/g, (letter) => letter.toUpperCase());
    };

    const getStatusClass = (status) => {
        if (!status) {
            return "status-default";
        }

        return `status-${String(status).toLowerCase()}`;
    };

    const formatDate = (date) => {
        if (!date) {
            return "Not specified";
        }

        const parsedDate = new Date(`${date}T00:00:00`);

        if (Number.isNaN(parsedDate.getTime())) {
            return String(date);
        }

        return parsedDate.toLocaleDateString("en-ZA", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const formatTime = (time) => {
        if (!time) {
            return "Not specified";
        }

        return String(time).substring(0, 5);
    };

    const getCustomerName = (booking) => {
        if (booking?.customer?.name) {
            return booking.customer.name;
        }

        if (booking?.customer?.fullName) {
            return booking.customer.fullName;
        }

        if (booking?.customer?.firstName || booking?.customer?.lastName) {
            return `${booking.customer.firstName || ""} ${
                booking.customer.lastName || ""
            }`.trim();
        }

        return "Homeowner";
    };

    const getCustomerEmail = (booking) => {
        return booking?.customer?.email || "Email not available";
    };

    /* =====================================================
       REVIEW HELPERS
    ===================================================== */

    const reviewCount = reviews.length;

    const averageRating = useMemo(() => {
        if (reviews.length === 0) {
            return 0;
        }

        const total = reviews.reduce(
            (sum, review) => sum + Number(review.rating || 0),
            0
        );

        return total / reviews.length;
    }, [reviews]);

    const formatRating = (rating) => {
        return Number(rating || 0).toFixed(1);
    };

    const renderStars = (rating) => {
        const numericRating = Number(rating || 0);

        return (
            <span
                className="review-stars"
                aria-label={`${numericRating} out of 5 stars`}
            >
                {[1, 2, 3, 4, 5].map((star) => (
                    <span
                        key={star}
                        className={
                            star <= numericRating
                                ? "review-star filled"
                                : "review-star"
                        }
                    >
                        ★
                    </span>
                ))}
            </span>
        );
    };

    const getReviewCustomerName = (review) => {
        if (review?.customer?.fullName) {
            return review.customer.fullName;
        }

        if (review?.customer?.name) {
            return review.customer.name;
        }

        if (review?.customer?.firstName || review?.customer?.lastName) {
            return `${review.customer.firstName || ""} ${
                review.customer.lastName || ""
            }`.trim();
        }

        return "Homeowner";
    };

    const formatReviewDate = (date) => {
        if (!date) {
            return "";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "";
        }

        return parsedDate.toLocaleDateString("en-ZA", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    /* =====================================================
       BOOKING COUNTS
    ===================================================== */

    const {
        requestedCount,
        rescheduledCount,
        completedCount,
        activeCount,
    } = useMemo(() => {
        const requested = bookings.filter(
            (booking) => getBookingStatus(booking) === "REQUESTED"
        ).length;

        const rescheduled = bookings.filter(
            (booking) => getBookingStatus(booking) === "RESCHEDULED"
        ).length;

        const completed = bookings.filter(
            (booking) => getBookingStatus(booking) === "COMPLETED"
        ).length;

        const active = bookings.filter(
            (booking) => getBookingStatus(booking) === "ACCEPTED"
        ).length;

        return {
            requestedCount: requested,
            rescheduledCount: rescheduled,
            completedCount: completed,
            activeCount: active,
        };
    }, [bookings, getBookingStatus]);

    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner"></div>
                <p>Loading your dashboard...</p>
            </div>
        );
    }

    /* =====================================================
       DASHBOARD
    ===================================================== */

    return (
        <div className="fundi-dashboard">
            <header className="dashboard-header">
                <div>
                    <h1>Fundi Dashboard</h1>
                    <p>
                        Welcome back{user?.email ? `, ${user.email}` : ""}
                    </p>
                </div>

                <button
                    type="button"
                    className="dashboard-logout"
                    onClick={handleLogout}
                >
                    Logout
                </button>
            </header>

            {error && <div className="dashboard-error">{error}</div>}

            {/* PROFILE */}

            <section className="dashboard-profile-section">
                <div className="section-heading">
                    <div>
                        <h2>Your Fundi Profile</h2>
                        <p>Manage your professional information.</p>
                    </div>

                    <button
                        type="button"
                        className="primary-dashboard-btn"
                        onClick={() => navigate("/fundi-profile")}
                    >
                        {profile ? "Edit Profile" : "Create Profile"}
                    </button>
                </div>

                {profile ? (
                    <div className="profile-card">
                        <div className="profile-card-header">
                            <div className="profile-avatar">
                                {user?.email?.charAt(0).toUpperCase() || "F"}
                            </div>

                            <div>
                                <h3>{profile.tradeCategory || "Fundi"}</h3>
                                <span className="verification-badge">
                                    {formatStatus(profile.verificationStatus)}
                                </span>
                            </div>
                        </div>

                        <div className="profile-details-grid">
                            <div>
                                <span className="detail-label">Trade</span>
                                <strong>
                                    {profile.tradeCategory || "Not specified"}
                                </strong>
                            </div>

                            <div>
                                <span className="detail-label">Callout Fee</span>
                                <strong>R {profile.calloutFee ?? "0.00"}</strong>
                            </div>

                            <div>
                                <span className="detail-label">Hourly Rate</span>
                                <strong>
                                    R {profile.hourlyRate ?? "0.00"}/hr
                                </strong>
                            </div>

                            <div>
                                <span className="detail-label">Service Radius</span>
                                <strong>
                                    {profile.serviceAreaRadiusKm ?? "0"} km
                                </strong>
                            </div>
                        </div>

                        <div className="profile-bio">
                            <span className="detail-label">About Your Services</span>
                            <p>
                                {profile.bio ||
                                    "No profile description added yet."}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="empty-profile">
                        <h3>Create your Fundi profile</h3>
                        <p>
                            Add your trade, rates, service area and description
                            so homeowners can find you.
                        </p>

                        <button
                            type="button"
                            className="primary-dashboard-btn"
                            onClick={() => navigate("/fundi-profile")}
                        >
                            Create Profile
                        </button>
                    </div>
                )}
            </section>

            {/* BOOKING SUMMARY */}

            <section className="dashboard-summary-section">
                <div className="section-heading">
                    <div>
                        <h2>Booking Overview</h2>
                        <p>Keep track of your homeowner requests.</p>
                    </div>
                </div>

                <div className="booking-summary-grid">
                    <div className="booking-summary-card">
                        <span>Active</span>
                        <strong>{activeCount}</strong>
                    </div>

                    <div className="booking-summary-card">
                        <span>New Requests</span>
                        <strong>{requestedCount}</strong>
                    </div>

                    <div className="booking-summary-card">
                        <span>Reschedule Requests</span>
                        <strong>{rescheduledCount}</strong>
                    </div>

                    <div className="booking-summary-card">
                        <span>Completed</span>
                        <strong>{completedCount}</strong>
                    </div>
                </div>
            </section>

            {/* QUICK ACTIONS */}

            <section className="dashboard-actions-section">
                <div className="section-heading">
                    <div>
                        <h2>Quick Actions</h2>
                        <p>Manage your FundiShop account.</p>
                    </div>
                </div>

                <div className="dashboard-grid">
                    <div className="dashboard-card">
                        <div className="dashboard-card-icon">👤</div>
                        <h3>My Profile</h3>
                        <p>
                            Update your professional profile, rates and service
                            information.
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate("/fundi-profile")}
                        >
                            View Profile
                        </button>
                    </div>

                    <div className="dashboard-card">
                        <div className="dashboard-card-icon">📋</div>
                        <h3>Bookings</h3>
                        <p>
                            View homeowner requests and manage your current jobs.
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                document
                                    .getElementById("fundi-bookings-section")
                                    ?.scrollIntoView({
                                        behavior: "smooth",
                                        block: "start",
                                    });
                            }}
                        >
                            View My Bookings
                        </button>
                    </div>

                    <div className="dashboard-card reviews-dashboard-card">
                        <div className="dashboard-card-icon">⭐</div>
                        <h3>Reviews</h3>
                        <p>
                            See what homeowners think about your completed work.
                        </p>

                        <div className="review-summary-mini">
                            <div>
                                <strong>{formatRating(averageRating)}</strong>
                                {renderStars(averageRating)}
                            </div>
                            <span>
                                {reviewCount}{" "}
                                {reviewCount === 1 ? "review" : "reviews"}
                            </span>
                        </div>

                        <button
                            type="button"
                            className={
                                reviewCount > 0
                                    ? "reviews-button-active"
                                    : "reviews-button-empty"
                            }
                            onClick={() =>
                                setShowReviews((current) => !current)
                            }
                        >
                            {showReviews
                                ? "Hide Reviews"
                                : reviewCount > 0
                                    ? "View Reviews"
                                    : "No Reviews Yet"}
                        </button>
                    </div>

                    <div className="dashboard-card">
                        <div className="dashboard-card-icon">💰</div>
                        <h3>Earnings</h3>
                        <p>Track your completed jobs and earnings.</p>
                        <button type="button" disabled>
                            Coming Soon
                        </button>
                    </div>
                </div>
            </section>

            {/* REVIEWS */}

            {showReviews && (
                <section className="dashboard-section reviews-section">
                    <div className="section-heading">
                        <div>
                            <span className="reviews-section-label">
                                HOMEOWNER FEEDBACK
                            </span>
                            <h2>Your Reviews</h2>
                            <p>
                                Feedback from homeowners who have booked your
                                services.
                            </p>
                        </div>

                        <div className="reviews-overview">
                            <strong>{formatRating(averageRating)}</strong>
                            {renderStars(averageRating)}
                            <span>
                                Based on {reviewCount}{" "}
                                {reviewCount === 1 ? "review" : "reviews"}
                            </span>
                        </div>
                    </div>

                    {reviewsLoading ? (
                        <div className="reviews-loading">
                            <div className="loading-spinner"></div>
                            <p>Loading your reviews...</p>
                        </div>
                    ) : reviewsError ? (
                        <div className="reviews-error">{reviewsError}</div>
                    ) : reviews.length === 0 ? (
                        <div className="reviews-empty">
                            <div className="reviews-empty-icon">⭐</div>
                            <h3>No reviews yet</h3>
                            <p>
                                Once homeowners complete and review your work,
                                their feedback will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="reviews-list">
                            {reviews.map((review) => (
                                <article
                                    className="review-card"
                                    key={review.id}
                                >
                                    <div className="review-card-header">
                                        <div className="review-customer">
                                            <div className="review-avatar">
                                                {getReviewCustomerName(review)
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>

                                            <div>
                                                <strong>
                                                    {getReviewCustomerName(review)}
                                                </strong>
                                                <span>
                                                    {formatReviewDate(
                                                        review.createdAt
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="review-rating">
                                            {renderStars(review.rating)}
                                            <strong>{review.rating}/5</strong>
                                        </div>
                                    </div>

                                    <div className="review-comment">
                                        <span>HOMEOWNER COMMENT</span>
                                        <p>
                                            {review.comment ||
                                                "No written comment was provided."}
                                        </p>
                                    </div>

                                    {review.fundiReply && (
                                        <div className="fundi-reply">
                                            <span>YOUR RESPONSE</span>
                                            <p>{review.fundiReply}</p>
                                        </div>
                                    )}
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* BOOKINGS */}

            <section
                id="fundi-bookings-section"
                className="dashboard-section fundi-bookings-section"
            >
                <div className="section-heading booking-heading">
                    <div>
                        <h2>My Bookings</h2>
                        <p>Manage booking requests from homeowners.</p>
                    </div>

                    <button
                        type="button"
                        className="refresh-bookings-btn"
                        onClick={refreshBookings}
                        disabled={bookingsLoading || reviewsLoading}
                    >
                        {bookingsLoading || reviewsLoading
                            ? "Refreshing..."
                            : "↻ Refresh"}
                    </button>
                </div>

                {bookingError && (
                    <div className="booking-error">{bookingError}</div>
                )}

                {bookingsLoading ? (
                    <div className="bookings-loading">
                        <div className="loading-spinner"></div>
                        <p>Loading bookings...</p>
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="no-bookings">
                        <div className="no-bookings-icon">📋</div>
                        <h3>No bookings yet</h3>
                        <p>
                            When homeowners book your services, their requests
                            will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="fundi-bookings-list">
                        {bookings.map((booking) => {
                            const status = getBookingStatus(booking);

                            const isPendingDecision =
                                status === "REQUESTED" ||
                                status === "RESCHEDULED";

                            const canAccept = isPendingDecision;
                            const canDecline = isPendingDecision;
                            const canReschedule = status === "ACCEPTED";
                            const canComplete = status === "ACCEPTED";

                            const canCancel =
                                status === "REQUESTED" ||
                                status === "ACCEPTED" ||
                                status === "RESCHEDULED";

                            return (
                                <article
                                    className="fundi-booking-card"
                                    key={booking.id}
                                >
                                    <div className="booking-card-top">
                                        <div>
                                            <span className="booking-id">
                                                Booking #{booking.id}
                                            </span>
                                            <h3>
                                                {booking.serviceRequired ||
                                                    "Service Request"}
                                            </h3>
                                        </div>

                                        <span
                                            className={`booking-status ${getStatusClass(
                                                status
                                            )}`}
                                        >
                                            {formatStatus(status)}
                                        </span>
                                    </div>

                                    {status === "RESCHEDULED" && (
                                        <div className="booking-reschedule-notice">
                                            <strong>Reschedule Request</strong>
                                            <p>
                                                The homeowner has requested a new
                                                date and/or time. Please review
                                                the updated schedule and accept
                                                or decline this request.
                                            </p>
                                        </div>
                                    )}

                                    <div className="booking-customer">
                                        <div className="customer-avatar">
                                            {getCustomerName(booking)
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>

                                        <div>
                                            <strong>
                                                {getCustomerName(booking)}
                                            </strong>
                                            <span>
                                                {getCustomerEmail(booking)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="booking-details-grid">
                                        <div className="booking-detail">
                                            <span>📅 Date</span>
                                            <strong>
                                                {formatDate(
                                                    booking.scheduledDate
                                                )}
                                            </strong>
                                        </div>

                                        <div className="booking-detail">
                                            <span>🕐 Time</span>
                                            <strong>
                                                {formatTime(
                                                    booking.scheduledTime
                                                )}
                                            </strong>
                                        </div>

                                        <div className="booking-detail">
                                            <span>📍 Location</span>
                                            <strong>
                                                {booking.jobLocation ||
                                                    "Not specified"}
                                            </strong>
                                        </div>

                                        <div className="booking-detail">
                                            <span>💰 Budget</span>
                                            <strong>
                                                {booking.estimatedBudget
                                                    ? `R ${booking.estimatedBudget}`
                                                    : "Not specified"}
                                            </strong>
                                        </div>
                                    </div>

                                    {booking.jobDescription && (
                                        <div className="booking-description">
                                            <span>Job Description</span>
                                            <p>{booking.jobDescription}</p>
                                        </div>
                                    )}

                                    <div className="booking-actions">
                                        {canAccept && (
                                            <button
                                                type="button"
                                                className="booking-btn accept-btn"
                                                disabled={
                                                    actionLoading ===
                                                    `${booking.id}-ACCEPTED`
                                                }
                                                onClick={() =>
                                                    updateBookingStatus(
                                                        booking.id,
                                                        "ACCEPTED"
                                                    )
                                                }
                                            >
                                                {actionLoading ===
                                                `${booking.id}-ACCEPTED`
                                                    ? "Accepting..."
                                                    : status === "RESCHEDULED"
                                                        ? "✓ Accept Reschedule"
                                                        : "✓ Accept"}
                                            </button>
                                        )}

                                        {canDecline && (
                                            <button
                                                type="button"
                                                className="booking-btn decline-btn"
                                                disabled={
                                                    actionLoading ===
                                                    `${booking.id}-DECLINED`
                                                }
                                                onClick={() =>
                                                    updateBookingStatus(
                                                        booking.id,
                                                        "DECLINED"
                                                    )
                                                }
                                            >
                                                {actionLoading ===
                                                `${booking.id}-DECLINED`
                                                    ? "Declining..."
                                                    : status === "RESCHEDULED"
                                                        ? "✕ Decline Reschedule"
                                                        : "✕ Decline"}
                                            </button>
                                        )}

                                        {canReschedule && (
                                            <button
                                                type="button"
                                                className="booking-btn reschedule-btn"
                                                onClick={() =>
                                                    openRescheduleModal(booking)
                                                }
                                            >
                                                🕐 Reschedule
                                            </button>
                                        )}

                                        {canComplete && (
                                            <button
                                                type="button"
                                                className="booking-btn complete-btn"
                                                disabled={
                                                    actionLoading ===
                                                    `${booking.id}-COMPLETED`
                                                }
                                                onClick={() =>
                                                    updateBookingStatus(
                                                        booking.id,
                                                        "COMPLETED"
                                                    )
                                                }
                                            >
                                                {actionLoading ===
                                                `${booking.id}-COMPLETED`
                                                    ? "Completing..."
                                                    : "✓ Complete"}
                                            </button>
                                        )}

                                        {canCancel && (
                                            <button
                                                type="button"
                                                className="booking-btn cancel-btn"
                                                disabled={
                                                    actionLoading ===
                                                    `${booking.id}-CANCELLED`
                                                }
                                                onClick={() =>
                                                    updateBookingStatus(
                                                        booking.id,
                                                        "CANCELLED"
                                                    )
                                                }
                                            >
                                                {actionLoading ===
                                                `${booking.id}-CANCELLED`
                                                    ? "Cancelling..."
                                                    : "Cancel"}
                                            </button>
                                        )}

                                        {!canAccept &&
                                            !canDecline &&
                                            !canReschedule &&
                                            !canComplete &&
                                            !canCancel && (
                                                <div className="booking-no-actions">
                                                    No actions available for
                                                    status:
                                                    <strong>
                                                        {status || "UNKNOWN"}
                                                    </strong>
                                                </div>
                                            )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* ACCOUNT */}

            <section className="account-section">
                <h2>Account Information</h2>

                <div className="account-card">
                    <div>
                        <span>Email</span>
                        <strong>{user?.email || "Not available"}</strong>
                    </div>

                    <div>
                        <span>Role</span>
                        <strong>FUNDI</strong>
                    </div>

                    <div>
                        <span>Active Bookings</span>
                        <strong>{activeCount}</strong>
                    </div>
                </div>
            </section>

            {/* RESCHEDULE MODAL */}

            {rescheduleTarget && (
                <div
                    className="reschedule-overlay"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeRescheduleModal();
                        }
                    }}
                >
                    <div className="reschedule-modal">
                        <div className="reschedule-modal-header">
                            <div>
                                <span>
                                    Booking #{rescheduleTarget.id}
                                </span>
                                <h2>Reschedule Booking</h2>
                            </div>

                            <button
                                type="button"
                                className="close-modal-btn"
                                onClick={closeRescheduleModal}
                                aria-label="Close reschedule dialog"
                            >
                                ×
                            </button>
                        </div>

                        <div className="reschedule-customer">
                            <strong>
                                {getCustomerName(rescheduleTarget)}
                            </strong>
                            <span>
                                {rescheduleTarget.serviceRequired ||
                                    "Service Request"}
                            </span>
                        </div>

                        <form
                            className="reschedule-form"
                            onSubmit={rescheduleBooking}
                        >
                            <div className="form-group">
                                <label htmlFor="reschedule-date">
                                    New Date
                                </label>
                                <input
                                    id="reschedule-date"
                                    type="date"
                                    value={rescheduleDate}
                                    onChange={(event) =>
                                        setRescheduleDate(
                                            event.target.value
                                        )
                                    }
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="reschedule-time">
                                    New Time
                                </label>
                                <input
                                    id="reschedule-time"
                                    type="time"
                                    value={rescheduleTime}
                                    onChange={(event) =>
                                        setRescheduleTime(
                                            event.target.value
                                        )
                                    }
                                    required
                                />
                            </div>

                            {rescheduleError && (
                                <div className="reschedule-error">
                                    {rescheduleError}
                                </div>
                            )}

                            <div className="reschedule-modal-actions">
                                <button
                                    type="button"
                                    className="modal-cancel-btn"
                                    onClick={closeRescheduleModal}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="modal-save-btn"
                                    disabled={
                                        actionLoading ===
                                        `${rescheduleTarget.id}-RESCHEDULE`
                                    }
                                >
                                    {actionLoading ===
                                    `${rescheduleTarget.id}-RESCHEDULE`
                                        ? "Saving..."
                                        : "Save New Schedule"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FundiDashboard;
