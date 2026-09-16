import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./Booking.css";

function Booking() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [fundi, setFundi] = useState(null);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [formData, setFormData] = useState({
        service: "",
        date: "",
        time: "",
        address: "",
        budget: "",
        description: "",
    });

    useEffect(() => {
        fetchFundi();
    }, [id]);

    const fetchFundi = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `http://localhost:8080/api/fundiprofiles/${id}`
            );

            if (response.status === 404) {
                setFundi(null);
                return;
            }

            if (!response.ok) {
                throw new Error(
                    "Failed to load Fundi profile."
                );
            }

            const data = await response.json();

            setFundi(data);

        } catch (err) {
            console.error(
                "Error loading Fundi:",
                err
            );

            setError(
                "Unable to load this Fundi at the moment."
            );

        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData({
            ...formData,
            [name]: value,
        });
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
            .toUpperCase();
    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");
        setSubmitting(true);

        try {

            /*
             * Get logged-in homeowner
             */
            const storedUser =
                localStorage.getItem(
                    "fundiShopUser"
                );

            if (!storedUser) {

                throw new Error(
                    "You must be logged in as a homeowner to make a booking."
                );
            }

            const user =
                JSON.parse(storedUser);

            /*
             * Make sure the logged-in user is a homeowner
             */
            if (user.role !== "HOMEOWNER") {

                throw new Error(
                    "Only homeowners can make bookings."
                );
            }

            /*
             * Create booking object
             */
            const bookingData = {

                customerId: user.id,

                fundiProfileId: fundi.id,

                scheduledDate:
                formData.date,

                scheduledTime:
                formData.time,

                serviceRequired:
                formData.service,

                jobLocation:
                formData.address,

                estimatedBudget:
                    formData.budget
                        ? Number(formData.budget)
                        : null,

                jobDescription:
                formData.description,
            };

            console.log(
                "BOOKING DATA:",
                bookingData
            );

            /*
             * Send booking to Spring Boot
             */
            const response = await fetch(
                "http://localhost:8080/api/bookings/create",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify(
                        bookingData
                    ),
                }
            );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to create booking."
                );
            }

            console.log(
                "BOOKING CREATED:",
                data
            );

            setSuccess(
                "Your booking has been submitted successfully!"
            );

            /*
             * Clear form
             */
            setFormData({
                service: "",
                date: "",
                time: "",
                address: "",
                budget: "",
                description: "",
            });

        } catch (err) {

            console.error(
                "BOOKING ERROR:",
                err
            );

            setError(
                err.message ||
                "Unable to create booking."
            );

        } finally {

            setSubmitting(false);
        }
    };

    /*
     * Loading
     */
    if (loading) {

        return (
            <main className="booking-page">

                <div className="booking-not-found">

                    <div className="booking-loading-spinner"></div>

                    <h1>
                        Loading Fundi...
                    </h1>

                    <p>
                        Please wait while we load
                        the Fundi information.
                    </p>

                </div>

            </main>
        );
    }

    /*
     * Error
     */
    if (error && !fundi) {

        return (
            <main className="booking-page">

                <div className="booking-not-found">

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
     * Fundi not found
     */
    if (!fundi) {

        return (
            <main className="booking-page">

                <div className="booking-not-found">

                    <h1>
                        Fundi not found
                    </h1>

                    <p>
                        We couldn't find the Fundi
                        you are trying to book.
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

    const fullName =
        fundi.user?.fullName ||
        "Unnamed Fundi";

    const trade =
        getTradeName(
            fundi.tradeCategory
        );

    const verified =
        fundi.verificationStatus ===
        "VERIFIED";

    return (
        <main className="booking-page">

            <div className="booking-container">

                <Link
                    to={`/fundis/${fundi.id}`}
                    className="back-link"
                >
                    ← Back to Profile
                </Link>

                <div className="booking-layout">

                    {/* Booking Information */}

                    <section className="booking-info">

                        <span className="booking-label">
                            BOOK A FUNDI
                        </span>

                        <h1>
                            Book {fullName}
                        </h1>

                        <p className="booking-description">
                            Send your job request to
                            this trusted professional
                            and provide the details
                            needed to get the job started.
                        </p>

                        <div className="selected-fundi">

                            <div className="booking-avatar">
                                {getInitials(
                                    fullName
                                )}
                            </div>

                            <div>

                                <h3>
                                    {fullName}
                                </h3>

                                <p>
                                    {trade}
                                </p>

                                <span>
                                    📍 Service area:{" "}
                                    {fundi.serviceAreaRadiusKm ||
                                        0}{" "}
                                    km
                                </span>

                            </div>

                            {verified && (
                                <span className="verified-badge">
                                    ✓ Verified
                                </span>
                            )}

                        </div>

                        <div className="booking-note">

                            <strong>
                                Why book through FundiShop?
                            </strong>

                            <p>
                                FundiShop helps you
                                connect with trusted
                                local professionals
                                and keeps your booking
                                information organised
                                in one place.
                            </p>

                        </div>

                    </section>

                    {/* Booking Form */}

                    <section className="booking-form-card">

                        <h2>
                            Job details
                        </h2>

                        <p className="form-intro">
                            Tell us what you need help with.
                        </p>

                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="success-message">
                                {success}
                            </div>
                        )}

                        <form
                            onSubmit={handleSubmit}
                        >

                            <div className="form-group">

                                <label htmlFor="service">
                                    Service required
                                </label>

                                <select
                                    id="service"
                                    name="service"
                                    value={formData.service}
                                    onChange={handleChange}
                                    required
                                >

                                    <option value="">
                                        Select a service
                                    </option>

                                    <option value="installation">
                                        Installation
                                    </option>

                                    <option value="repair">
                                        Repair
                                    </option>

                                    <option value="maintenance">
                                        Maintenance
                                    </option>

                                    <option value="inspection">
                                        Inspection
                                    </option>

                                    <option value="other">
                                        Other
                                    </option>

                                </select>

                            </div>

                            <div className="form-row">

                                <div className="form-group">

                                    <label htmlFor="date">
                                        Preferred date
                                    </label>

                                    <input
                                        type="date"
                                        id="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleChange}
                                        required
                                    />

                                </div>

                                <div className="form-group">

                                    <label htmlFor="time">
                                        Preferred time
                                    </label>

                                    <input
                                        type="time"
                                        id="time"
                                        name="time"
                                        value={formData.time}
                                        onChange={handleChange}
                                        required
                                    />

                                </div>

                            </div>

                            <div className="form-group">

                                <label htmlFor="address">
                                    Job location
                                </label>

                                <input
                                    type="text"
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="Enter the address where the work is needed"
                                    required
                                />

                            </div>

                            <div className="form-group">

                                <label htmlFor="budget">

                                    Estimated budget

                                    <span className="optional">
                                        Optional
                                    </span>

                                </label>

                                <input
                                    type="number"
                                    id="budget"
                                    name="budget"
                                    min="0"
                                    value={formData.budget}
                                    onChange={handleChange}
                                    placeholder="R 0.00"
                                />

                            </div>

                            <div className="form-group">

                                <label htmlFor="description">
                                    Describe the job
                                </label>

                                <textarea
                                    id="description"
                                    name="description"
                                    rows="5"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Tell the Fundi what needs to be done..."
                                    required
                                ></textarea>

                            </div>

                            <button
                                type="submit"
                                className="confirm-booking-button"
                                disabled={submitting}
                            >

                                {submitting
                                    ? "Submitting Booking..."
                                    : "Confirm Booking"}

                            </button>

                        </form>

                    </section>

                </div>

            </div>

        </main>
    );
}

export default Booking;