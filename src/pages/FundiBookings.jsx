import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./FundiBookings.css";

function FundiBookings() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [bookings, setBookings] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingBookingId, setUpdatingBookingId] = useState(null);

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        try {
            setLoading(true);
            setError("");

            const storedUser =
                localStorage.getItem("fundiShopUser");

            if (!storedUser) {
                navigate("/login");
                return;
            }

            const parsedUser = JSON.parse(storedUser);

            if (parsedUser.role !== "FUNDI") {
                navigate("/");
                return;
            }

            setUser(parsedUser);

            /*
             * Find the Fundi profile belonging
             * to the logged-in Fundi.
             */
            const profileResponse = await fetch(
                "http://localhost:8080/api/fundiprofiles"
            );

            if (!profileResponse.ok) {
                throw new Error(
                    "Unable to load Fundi profile."
                );
            }

            const profiles = await profileResponse.json();

            const myProfile = profiles.find(
                (item) =>
                    item.user &&
                    item.user.id === parsedUser.id
            );

            if (!myProfile) {
                setProfile(null);
                setBookings([]);
                return;
            }

            setProfile(myProfile);

            /*
             * Get bookings belonging to this Fundi.
             */
            const bookingsResponse = await fetch(
                `http://localhost:8080/api/bookings/fundi/${myProfile.id}`
            );

            if (!bookingsResponse.ok) {
                throw new Error(
                    "Unable to load bookings."
                );
            }

            const bookingsData =
                await bookingsResponse.json();

            setBookings(bookingsData);

        } catch (err) {
            console.error(
                "Error loading bookings:",
                err
            );

            setError(
                err.message ||
                "Unable to load bookings."
            );

        } finally {
            setLoading(false);
        }
    };

    /*
     * Accept or decline a booking
     */
    const updateBookingStatus = async (
        bookingId,
        status
    ) => {
        try {
            setUpdatingBookingId(bookingId);
            setError("");

            const response = await fetch(
                `http://localhost:8080/api/bookings/${bookingId}/status?status=${status}`,
                {
                    method: "PUT",
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Unable to update booking status."
                );
            }

            const updatedBooking =
                await response.json();

            /*
             * Update the booking immediately
             * without refreshing the page.
             */
            setBookings((currentBookings) =>
                currentBookings.map((booking) =>
                    booking.id === updatedBooking.id
                        ? updatedBooking
                        : booking
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

    /*
     * Convert status into a CSS class
     */
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
                return "";
        }
    };

    /*
     * Make status easier to read
     */
    const formatStatus = (status) => {
        if (!status) {
            return "Unknown";
        }

        return status
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(/\b\w/g, (letter) =>
                letter.toUpperCase()
            );
    };

    /*
     * Format booking date
     */
    const formatDate = (date) => {
        if (!date) {
            return "Not specified";
        }

        return new Date(
            `${date}T00:00:00`
        ).toLocaleDateString(
            "en-ZA",
            {
                day: "numeric",
                month: "long",
                year: "numeric",
            }
        );
    };

    /*
     * Format booking time
     */
    const formatTime = (time) => {
        if (!time) {
            return "Not specified";
        }

        return time.substring(0, 5);
    };

    /*
     * Loading screen
     */
    if (loading) {
        return (
            <main className="fundi-bookings-page">

                <div className="bookings-loading">

                    <div className="bookings-spinner"></div>

                    <h1>
                        Loading Bookings...
                    </h1>

                    <p>
                        Please wait while we load
                        your booking requests.
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

                {/* Back to Dashboard */}

                <Link
                    to="/fundi-dashboard"
                    className="bookings-back-link"
                >
                    ← Back to Dashboard
                </Link>


                {/* Page Header */}

                <header className="bookings-header">

                    <span className="bookings-label">
                        FUNDISHOP FUNDI PORTAL
                    </span>

                    <h1>
                        My Bookings
                    </h1>

                    <p>
                        View and manage booking requests
                        from homeowners.
                    </p>

                </header>


                {/* Error Message */}

                {error && (
                    <div className="bookings-error">
                        {error}
                    </div>
                )}


                {/* No Fundi Profile */}

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
                            be found. Please complete
                            your Fundi profile first.
                        </p>

                    </div>

                )}


                {/* No Bookings */}

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


                {/* Bookings */}

                {bookings.length > 0 && (

                    <section className="bookings-list">

                        {/* Booking Summary */}

                        <div className="bookings-summary">

                            <div>

                                <span>
                                    TOTAL BOOKINGS
                                </span>

                                <strong>
                                    {bookings.length}
                                </strong>

                            </div>

                        </div>


                        {/* Booking Cards */}

                        {bookings.map((booking) => {

                            const homeowner =
                                booking.customer;

                            const isUpdating =
                                updatingBookingId ===
                                booking.id;

                            return (
                                <article
                                    className="booking-card"
                                    key={booking.id}
                                >

                                    {/* =========================
                                        BOOKING HEADER
                                    ========================== */}

                                    <div className="booking-card-header">

                                        <div>

                                            <span className="booking-card-label">
                                                BOOKING REQUEST
                                            </span>

                                            <h2>
                                                {booking.serviceRequired ||
                                                    "Service Request"}
                                            </h2>

                                        </div>


                                        {/* Status */}

                                        <span
                                            className={`booking-status ${getStatusClass(
                                                booking.status
                                            )}`}
                                        >
                                            {formatStatus(
                                                booking.status
                                            )}
                                        </span>

                                    </div>


                                    {/* =========================
                                        BOOKING DETAILS
                                    ========================== */}

                                    <div className="booking-card-content">


                                        {/* Homeowner */}

                                        <div className="booking-detail">

                                            <span>
                                                👤 Homeowner
                                            </span>

                                            <strong>
                                                {homeowner?.fullName ||
                                                    "Homeowner"}
                                            </strong>

                                        </div>


                                        {/* Homeowner Email */}

                                        <div className="booking-detail">

                                            <span>
                                                ✉️ Email
                                            </span>

                                            <strong>
                                                {homeowner?.email ||
                                                    "Not available"}
                                            </strong>

                                        </div>


                                        {/* Homeowner Phone */}

                                        <div className="booking-detail">

                                            <span>
                                                📞 Phone
                                            </span>

                                            <strong>
                                                {homeowner?.phone ||
                                                    "Not available"}
                                            </strong>

                                        </div>


                                        {/* Date */}

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


                                        {/* Time */}

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


                                        {/* Location */}

                                        <div className="booking-detail">

                                            <span>
                                                📍 Location
                                            </span>

                                            <strong>
                                                {booking.jobLocation ||
                                                    "Not specified"}
                                            </strong>

                                        </div>


                                        {/* Budget */}

                                        <div className="booking-detail">

                                            <span>
                                                💰 Budget
                                            </span>

                                            <strong>
                                                {booking.estimatedBudget
                                                    ? `R${booking.estimatedBudget}`
                                                    : "Not specified"}
                                            </strong>

                                        </div>


                                        {/* Callout Fee */}

                                        <div className="booking-detail">

                                            <span>
                                                💵 Callout Fee
                                            </span>

                                            <strong>
                                                {booking.calloutFee
                                                    ? `R${booking.calloutFee}`
                                                    : "Not specified"}
                                            </strong>

                                        </div>

                                    </div>


                                    {/* =========================
                                        JOB DESCRIPTION
                                    ========================== */}

                                    <div className="booking-description">

                                        <span>
                                            JOB DESCRIPTION
                                        </span>

                                        <p>
                                            {booking.jobDescription ||
                                                "No description provided."}
                                        </p>

                                    </div>


                                    {/* =========================
                                        ACTION BUTTONS
                                    ========================== */}

                                    {booking.status ===
                                        "REQUESTED" && (

                                            <div className="booking-actions">

                                                <button
                                                    type="button"
                                                    className="accept-booking-button"
                                                    disabled={isUpdating}
                                                    onClick={() =>
                                                        updateBookingStatus(
                                                            booking.id,
                                                            "ACCEPTED"
                                                        )
                                                    }
                                                >

                                                    {isUpdating
                                                        ? "Updating..."
                                                        : "✓ Accept Booking"}

                                                </button>


                                                <button
                                                    type="button"
                                                    className="decline-booking-button"
                                                    disabled={isUpdating}
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


                                    {/* =========================
                                        ACCEPTED MESSAGE
                                    ========================== */}

                                    {booking.status ===
                                        "ACCEPTED" && (

                                            <div className="booking-status-message accepted-message">

                                                ✓ This booking has been
                                                accepted.

                                            </div>

                                        )}


                                    {/* =========================
                                        DECLINED MESSAGE
                                    ========================== */}

                                    {booking.status ===
                                        "DECLINED" && (

                                            <div className="booking-status-message declined-message">

                                                ✕ This booking has been
                                                declined.

                                            </div>

                                        )}


                                    {/* =========================
                                        COMPLETED MESSAGE
                                    ========================== */}

                                    {booking.status ===
                                        "COMPLETED" && (

                                            <div className="booking-status-message completed-message">

                                                ✓ This booking has been
                                                completed.

                                            </div>

                                        )}


                                    {/* =========================
                                        CANCELLED MESSAGE
                                    ========================== */}

                                    {booking.status ===
                                        "CANCELLED" && (

                                            <div className="booking-status-message cancelled-message">

                                                This booking has been
                                                cancelled.

                                            </div>

                                        )}

                                </article>
                            );
                        })}

                    </section>
                )}

            </div>

        </main>
    );
}

export default FundiBookings;