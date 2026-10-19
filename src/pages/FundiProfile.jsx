
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./FundiProfile.css";
import { API_URL } from "../api";

function getAuthHeaders() {
    const storedUser = localStorage.getItem("fundiShopUser");
    let token = "";

    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            token = user?.token || "";
        } catch (err) {
            console.error("Unable to read stored user:", err);
        }
    }

    token =
        token ||
        localStorage.getItem("fundiShopToken") ||
        localStorage.getItem("token") ||
        localStorage.getItem("jwtToken") ||
        "";

    return token
        ? { Authorization: `Bearer ${token}` }
        : {};
}

function FundiProfile() {
    const { id } = useParams();

    const [fundi, setFundi] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [error, setError] = useState("");
    const [reviewsError, setReviewsError] = useState("");

    // Load the existing Fundi profile.
    useEffect(() => {
        let cancelled = false;

        const loadFundi = async () => {
            try {
                setLoading(true);
                setError("");
                setFundi(null);

                const response = await fetch(
                    `${API_URL}/api/fundiprofiles/${id}`
                );

                if (response.status === 404) {
                    if (!cancelled) setFundi(null);
                    return;
                }

                if (!response.ok) {
                    throw new Error("Failed to load Fundi profile.");
                }

                const data = await response.json();

                if (!cancelled) {
                    setFundi(data);
                }
            } catch (err) {
                console.error("Error loading Fundi profile:", err);

                if (!cancelled) {
                    setError(
                        "Unable to load this Fundi profile at the moment."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadFundi();

        return () => {
            cancelled = true;
        };
    }, [id]);

    // Load reviews from the existing reviews endpoint.
    useEffect(() => {
        let cancelled = false;

        const loadReviews = async () => {
            if (!id) return;

            try {
                setReviewsLoading(true);
                setReviewsError("");

                const response = await fetch(
                    `${API_URL}/api/reviews/fundi/${id}`,
                    { headers: getAuthHeaders() }
                );

                if (!response.ok) {
                    throw new Error(
                        `Failed to load reviews. Status: ${response.status}`
                    );
                }

                const data = await response.json();

                if (!cancelled) {
                    setReviews(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error("Error loading Fundi reviews:", err);

                if (!cancelled) {
                    setReviewsError(
                        "Unable to load reviews at the moment."
                    );
                }
            } finally {
                if (!cancelled) {
                    setReviewsLoading(false);
                }
            }
        };

        loadReviews();

        return () => {
            cancelled = true;
        };
    }, [id]);

    // Helpers.
    const getTradeName = (tradeCategory) => {
        const tradeNames = {
            ELECTRICAL: "Electrician",
            PLUMBING: "Plumber",
            HANDYMAN: "Handyman",
            PAINTING: "Painter",
            GENERAL: "General",
            CARPENTRY: "Carpenter",
            TILING: "Tiler",
        };

        return tradeNames[tradeCategory] || tradeCategory || "General";
    };

    const getFullName = (user) => {
        if (!user) return "Unnamed Fundi";
        if (user.fullName) return user.fullName;

        if (user.firstName && user.lastName) {
            return `${user.firstName} ${user.lastName}`;
        }

        return user.firstName || user.name || "Unnamed Fundi";
    };

    const getInitials = (name) => {
        if (!name) return "F";

        return name
            .split(" ")
            .filter(Boolean)
            .map((part) => part[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const formatMoney = (amount) => {
        if (amount === null || amount === undefined || amount === "") {
            return null;
        }

        const value = Number(amount);

        if (!Number.isFinite(value)) return null;

        return value.toLocaleString("en-ZA", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const formatVerificationStatus = (status) => {
        if (!status) return "Pending";

        return status
            .toLowerCase()
            .replace(/_/g, " ")
            .replace(/\b\w/g, (letter) => letter.toUpperCase());
    };

    const getServiceArea = (radius) => {
        if (radius === null || radius === undefined || radius === "") {
            return "Not specified";
        }

        return `${radius} km`;
    };

    const getCustomerName = (review) => {
        const customer = review?.customer;

        if (!customer) return "Homeowner";
        if (customer.fullName) return customer.fullName;

        if (customer.firstName && customer.lastName) {
            return `${customer.firstName} ${customer.lastName}`;
        }

        return customer.firstName || customer.name || "Homeowner";
    };

    const formatReviewDate = (date) => {
        if (!date) return "Date unavailable";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "Date unavailable";
        }

        return parsedDate.toLocaleDateString("en-ZA", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const getRatingStars = (rating) => {
        const numericRating = Math.round(
            Math.max(0, Math.min(5, Number(rating) || 0))
        );

        return (
            "★".repeat(numericRating) +
            "☆".repeat(5 - numericRating)
        );
    };

    const averageRating = useMemo(() => {
        if (!reviews.length) return 0;

        const total = reviews.reduce(
            (sum, review) =>
                sum + (Number(review.rating) || 0),
            0
        );

        return total / reviews.length;
    }, [reviews]);

    const refreshReviews = async () => {
        if (!id) return;

        try {
            setReviewsLoading(true);
            setReviewsError("");

            const response = await fetch(
                `${API_URL}/api/reviews/fundi/${id}`,
                { headers: getAuthHeaders() }
            );

            if (!response.ok) {
                throw new Error(
                    `Failed to load reviews. Status: ${response.status}`
                );
            }

            const data = await response.json();
            setReviews(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error refreshing reviews:", err);

            setReviewsError(
                "Unable to refresh reviews at the moment."
            );
        } finally {
            setReviewsLoading(false);
        }
    };

    // Loading state.
    if (loading) {
        return (
            <main className="profile-page">
                <div className="profile-container">
                    <div className="profile-not-found">
                        <div
                            className="profile-loading-spinner"
                            role="status"
                            aria-label="Loading"
                        />

                        <h1>Loading Fundi profile...</h1>
                        <p>
                            Please wait while we load this
                            service provider's information.
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    // Error state.
    if (error) {
        return (
            <main className="profile-page">
                <div className="profile-container">
                    <div className="profile-not-found">
                        <span className="profile-state-icon">!</span>
                        <h1>Something went wrong</h1>
                        <p>{error}</p>

                        <button
                            type="button"
                            className="back-button"
                            onClick={() => window.location.reload()}
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    // Not-found state.
    if (!fundi) {
        return (
            <main className="profile-page">
                <div className="profile-container">
                    <div className="profile-not-found">
                        <span className="profile-state-icon">?</span>
                        <h1>Fundi not found</h1>
                        <p>
                            This profile may no longer be available.
                            Explore our other service providers instead.
                        </p>

                        <Link to="/fundis" className="back-button">
                            Browse Fundis
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    // Profile data.
    const fullName = getFullName(fundi.user);
    const email = fundi.user?.email || "";
    const phone = fundi.user?.phone || "";
    const trade = getTradeName(fundi.tradeCategory);

    const verificationStatus = fundi.verificationStatus || "PENDING";
    const verificationLabel =
        formatVerificationStatus(verificationStatus);

    const verified = verificationStatus === "APPROVED";
    const calloutFee = formatMoney(fundi.calloutFee);
    const hourlyRate = formatMoney(fundi.hourlyRate);

    return (
        <main className="profile-page">
            <div className="profile-container">
                <nav className="profile-breadcrumb" aria-label="Breadcrumb">
                    <Link to="/">Home</Link>
                    <span aria-hidden="true">/</span>
                    <Link to="/fundis">Find a Fundi</Link>
                    <span aria-hidden="true">/</span>
                    <span className="profile-breadcrumb-current">
                        {fullName}
                    </span>
                </nav>

                {/* Main profile header */}
                <section className="profile-header">
                    <div className="profile-avatar" aria-hidden="true">
                        {getInitials(fullName)}
                    </div>

                    <div className="profile-main-info">
                        <div className="profile-eyebrow">
                            YOUR LOCAL HOME-SERVICE PROFESSIONAL
                        </div>

                        <div className="profile-name-row">
                            <h1>{fullName}</h1>

                            {verified && (
                                <span
                                    className="profile-verified"
                                    title="This Fundi has been approved"
                                >
                                    <span aria-hidden="true">✓</span>
                                    Verified
                                </span>
                            )}
                        </div>

                        <p className="profile-trade">{trade}</p>

                        <p className="profile-location">
                            <span aria-hidden="true">⌖</span>
                            <span>
                                Service area:{" "}
                                {getServiceArea(
                                    fundi.serviceAreaRadiusKm
                                )}
                            </span>
                        </p>

                        <div className="profile-rating-summary">
                            <span
                                className="profile-rating-stars"
                                aria-label={`${averageRating.toFixed(1)} out of 5 stars`}
                            >
                                {getRatingStars(averageRating)}
                            </span>

                            <strong>
                                {reviews.length
                                    ? averageRating.toFixed(1)
                                    : "New profile"}
                            </strong>

                            <span className="profile-review-count">
                                {reviews.length === 1
                                    ? "1 homeowner review"
                                    : `${reviews.length} homeowner reviews`}
                            </span>
                        </div>
                    </div>

                    <div className="profile-action">
                        <div className="profile-price-card">
                            <span className="profile-price-label">
                                Hourly rate
                            </span>

                            <strong className="profile-price-value">
                                {hourlyRate !== null
                                    ? `R${hourlyRate}`
                                    : "Not specified"}
                            </strong>

                            {calloutFee !== null && (
                                <span className="profile-callout-note">
                                    Callout fee: R{calloutFee}
                                </span>
                            )}
                        </div>

                        {verified ? (
                            <Link
                                to={`/booking/${fundi.id}`}
                                className="book-button"
                            >
                                Book This Fundi
                                <span aria-hidden="true"> →</span>
                            </Link>
                        ) : (
                            <div className="profile-booking-unavailable">
                                <strong>Booking unavailable</strong>
                                <span>
                                    This Fundi is awaiting verification.
                                </span>
                            </div>
                        )}

                        <p className="profile-booking-note">
                            Review the details before confirming a booking.
                        </p>
                    </div>
                </section>

                {/* Profile information */}
                <div className="profile-content">
                    <section className="profile-section">
                        <div className="profile-section-heading">
                            <span className="profile-section-icon">
                                <span aria-hidden="true">✦</span>
                            </span>
                            <div>
                                <h2>About this Fundi</h2>
                                <p>
                                    Get to know your service provider.
                                </p>
                            </div>
                        </div>

                        <p className="profile-about-text">
                            {fundi.bio ||
                                "This Fundi has not added a profile description yet."}
                        </p>
                    </section>

                    <section className="profile-section">
                        <div className="profile-section-heading">
                            <span className="profile-section-icon">
                                <span aria-hidden="true">✓</span>
                            </span>
                            <div>
                                <h2>Professional information</h2>
                                <p>
                                    Key details about this service provider.
                                </p>
                            </div>
                        </div>

                        <div className="profile-services">
                            <div className="profile-service">
                                <span className="profile-service-check">
                                    ✓
                                </span>
                                <div>
                                    <span className="profile-detail-label">
                                        Trade
                                    </span>
                                    <strong>{trade}</strong>
                                </div>
                            </div>

                            <div className="profile-service">
                                <span className="profile-service-check">
                                    ✓
                                </span>
                                <div>
                                    <span className="profile-detail-label">
                                        Callout fee
                                    </span>
                                    <strong>
                                        {calloutFee !== null
                                            ? `R${calloutFee}`
                                            : "Not specified"}
                                    </strong>
                                </div>
                            </div>

                            <div className="profile-service">
                                <span className="profile-service-check">
                                    ✓
                                </span>
                                <div>
                                    <span className="profile-detail-label">
                                        Hourly rate
                                    </span>
                                    <strong>
                                        {hourlyRate !== null
                                            ? `R${hourlyRate}`
                                            : "Not specified"}
                                    </strong>
                                </div>
                            </div>

                            <div className="profile-service">
                                <span className="profile-service-check">
                                    ✓
                                </span>
                                <div>
                                    <span className="profile-detail-label">
                                        Service radius
                                    </span>
                                    <strong>
                                        {getServiceArea(
                                            fundi.serviceAreaRadiusKm
                                        )}
                                    </strong>
                                </div>
                            </div>

                            <div className="profile-service">
                                <span className="profile-service-check">
                                    ✓
                                </span>
                                <div>
                                    <span className="profile-detail-label">
                                        Verification status
                                    </span>
                                    <strong>{verificationLabel}</strong>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="profile-section profile-contact-section">
                        <div className="profile-section-heading">
                            <span className="profile-section-icon">
                                <span aria-hidden="true">↗</span>
                            </span>
                            <div>
                                <h2>Contact information</h2>
                                <p>
                                    Contact details available on this profile.
                                </p>
                            </div>
                        </div>

                        <div className="profile-contact-list">
                            <div className="profile-contact-item">
                                <span
                                    className="profile-contact-symbol"
                                    aria-hidden="true"
                                >
                                    ☎
                                </span>
                                <div>
                                    <span className="profile-detail-label">
                                        Phone
                                    </span>
                                    <strong>
                                        {phone || "Not available"}
                                    </strong>
                                </div>
                            </div>

                            <div className="profile-contact-item">
                                <span
                                    className="profile-contact-symbol"
                                    aria-hidden="true"
                                >
                                    ✉
                                </span>
                                <div>
                                    <span className="profile-detail-label">
                                        Email
                                    </span>
                                    <strong>
                                        {email || "Not available"}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Homeowner reviews */}
                <section className="profile-reviews">
                    <div className="reviews-heading">
                        <div>
                            <span className="profile-eyebrow">
                                CUSTOMER FEEDBACK
                            </span>
                            <h2>Homeowner reviews</h2>
                            <p>
                                See feedback shared by homeowners about
                                their experience with this Fundi.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="refresh-reviews-button"
                            onClick={refreshReviews}
                            disabled={reviewsLoading}
                        >
                            <span aria-hidden="true">↻</span>
                            {reviewsLoading
                                ? "Refreshing..."
                                : "Refresh reviews"}
                        </button>
                    </div>

                    {reviews.length > 0 && (
                        <div className="reviews-summary">
                            <div className="reviews-average">
                                <strong>
                                    {averageRating.toFixed(1)}
                                </strong>
                                <div className="reviews-average-details">
                                    <span
                                        className="reviews-average-stars"
                                        aria-label={`${averageRating.toFixed(1)} out of 5 stars`}
                                    >
                                        {getRatingStars(averageRating)}
                                    </span>
                                    <span>
                                        Based on {reviews.length}{" "}
                                        {reviews.length === 1
                                            ? "review"
                                            : "reviews"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {reviewsError && (
                        <div
                            className="reviews-message reviews-error"
                            role="alert"
                        >
                            <p>{reviewsError}</p>
                            <button
                                type="button"
                                className="reviews-retry-button"
                                onClick={refreshReviews}
                                disabled={reviewsLoading}
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {reviewsLoading && reviews.length === 0 && (
                        <div className="reviews-message" role="status">
                            Loading homeowner reviews...
                        </div>
                    )}

                    {!reviewsLoading &&
                        !reviewsError &&
                        reviews.length === 0 && (
                            <div className="reviews-empty">
                                <div
                                    className="reviews-empty-icon"
                                    aria-hidden="true"
                                >
                                    ☆
                                </div>
                                <h3>No reviews yet</h3>
                                <p>
                                    This Fundi has not received any
                                    homeowner reviews yet. Reviews can
                                    help customers make informed choices.
                                </p>
                            </div>
                        )}

                    {reviews.length > 0 && (
                        <div className="reviews-list">
                            {reviews.map((review) => (
                                <article
                                    key={review.id}
                                    className="review-card"
                                >
                                    <div className="review-card-header">
                                        <div className="review-customer">
                                            <div
                                                className="review-avatar"
                                                aria-hidden="true"
                                            >
                                                {getInitials(
                                                    getCustomerName(review)
                                                )}
                                            </div>

                                            <div>
                                                <h3>
                                                    {getCustomerName(review)}
                                                </h3>
                                                <p>
                                                    {formatReviewDate(
                                                        review.createdAt
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="review-rating">
                                            <span
                                                className="review-stars"
                                                aria-label={`${Number(review.rating) || 0} out of 5 stars`}
                                            >
                                                {getRatingStars(
                                                    review.rating
                                                )}
                                            </span>
                                            <span className="review-rating-number">
                                                {Number(review.rating) || 0}/5
                                            </span>
                                        </div>
                                    </div>

                                    {review.comment && (
                                        <p className="review-comment">
                                            “{review.comment}”
                                        </p>
                                    )}

                                    {review.fundiReply && (
                                        <div className="fundi-reply">
                                            <strong>
                                                Response from the Fundi
                                            </strong>
                                            <p>{review.fundiReply}</p>
                                        </div>
                                    )}
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                {/* Closing booking prompt */}
                {verified && (
                    <section className="profile-bottom-cta">
                        <div>
                            <span className="profile-eyebrow">
                                READY TO GET STARTED?
                            </span>
                            <h2>Need help with your home?</h2>
                            <p>
                                Continue to booking to take the next step
                                with this Fundi.
                            </p>
                        </div>

                        <Link
                            to={`/booking/${fundi.id}`}
                            className="book-button profile-bottom-book-button"
                        >
                            Book This Fundi
                            <span aria-hidden="true"> →</span>
                        </Link>
                    </section>
                )}
            </div>
        </main>
    );
}

export default FundiProfile;
