
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./Booking.css";
import { API_URL } from "../api";

function Booking() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [fundi, setFundi] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [formData, setFormData] = useState({
        serviceRequired: "",
        scheduledDate: "",
        scheduledTime: "",
        jobLocation: "",
        estimatedBudget: "",
        jobDescription: "",
    });

    const fetchFundi = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/api/fundiprofiles/${id}`
            );

            if (!response.ok) {
                throw new Error("Unable to load this fundi's profile.");
            }

            const data = await response.json();
            setFundi(data);
        } catch (err) {
            setError(err.message || "Unable to load the fundi profile.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchFundi();
        }, 0);

        return () => clearTimeout(timer);
    }, [fetchFundi]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // Read authentication details from the existing browser session.
    const getAuthDetails = () => {
        const rawUser =
            sessionStorage.getItem("fundiShopUser") ||
            localStorage.getItem("fundiShopUser");

        let storedUser;

        try {
            storedUser = rawUser ? JSON.parse(rawUser) : null;
        } catch {
            storedUser = null;
        }

        const token =
            storedUser?.token ||
            storedUser?.accessToken ||
            storedUser?.jwtToken ||
            sessionStorage.getItem("fundiShopToken") ||
            localStorage.getItem("fundiShopToken") ||
            sessionStorage.getItem("token") ||
            localStorage.getItem("token") ||
            sessionStorage.getItem("jwtToken") ||
            localStorage.getItem("jwtToken");

        const customerId =
            storedUser?.id ??
            storedUser?.user?.id;

        return {
            user: storedUser,
            token,
            customerId,
        };
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        const { user, token, customerId } = getAuthDetails();

        if (!user || !customerId || !token) {
            setError(
                "Your login session could not be read. Please log in again."
            );
            return;
        }

        if (user.role !== "HOMEOWNER") {
            setError("Only homeowners can create bookings.");
            return;
        }

        if (!fundi?.id) {
            setError("The selected fundi could not be found.");
            return;
        }

        if (fundi.verificationStatus !== "APPROVED") {
            setError(
                "You can only book a fundi whose profile has been approved."
            );
            return;
        }

        if (
            !formData.serviceRequired.trim() ||
            !formData.scheduledDate ||
            !formData.scheduledTime ||
            !formData.jobLocation.trim() ||
            !formData.jobDescription.trim()
        ) {
            setError("Please complete all required fields.");
            return;
        }

        const selectedDate = new Date(
            `${formData.scheduledDate}T${formData.scheduledTime}`
        );

        if (
            Number.isNaN(selectedDate.getTime()) ||
            selectedDate.getTime() <= Date.now()
        ) {
            setError("Please select a future date and time.");
            return;
        }

        if (
            formData.estimatedBudget !== "" &&
            (
                !Number.isFinite(Number(formData.estimatedBudget)) ||
                Number(formData.estimatedBudget) < 0
            )
        ) {
            setError("Please enter a valid estimated budget.");
            return;
        }

        try {
            setSubmitting(true);

            const response = await fetch(
                `${API_URL}/api/bookings/create`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        customerId: Number(customerId),
                        fundiProfileId: Number(fundi.id),
                        scheduledDate: formData.scheduledDate,
                        scheduledTime: formData.scheduledTime,
                        serviceRequired:
                            formData.serviceRequired.trim(),
                        jobLocation: formData.jobLocation.trim(),
                        estimatedBudget:
                            formData.estimatedBudget !== ""
                                ? Number(formData.estimatedBudget)
                                : null,
                        jobDescription:
                            formData.jobDescription.trim(),
                    }),
                }
            );

            const responseData = await response
                .json()
                .catch(() => ({}));

            if (response.status === 401 || response.status === 403) {
                throw new Error(
                    "Your session was rejected by the server, or your account is not authorised to make this booking. Please sign in again."
                );
            }

            if (!response.ok) {
                throw new Error(
                    responseData.message ||
                    responseData.error ||
                    "We couldn't complete your booking. Please try again."
                );
            }

            setSuccess(
                "Your booking request has been submitted successfully!"
            );

            setFormData({
                serviceRequired: "",
                scheduledDate: "",
                scheduledTime: "",
                jobLocation: "",
                estimatedBudget: "",
                jobDescription: "",
            });

            setTimeout(() => {
                navigate("/homeowner-dashboard");
            }, 1500);
        } catch (err) {
            setError(
                err.message || "Something went wrong. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const fullName =
        fundi?.user?.fullName ||
        fundi?.fullName ||
        "Fundi";

    const tradeCategory =
        fundi?.tradeCategory ||
        "Professional services";

    const initials = fullName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined || amount === "") {
            return "Not specified";
        }

        const numericAmount = Number(amount);

        if (!Number.isFinite(numericAmount)) {
            return String(amount);
        }

        return new Intl.NumberFormat("en-ZA", {
            style: "currency",
            currency: "ZAR",
            maximumFractionDigits: 2,
        }).format(numericAmount);
    };

    if (loading) {
        return (
            <main className="booking-page">
                <div className="booking-container">
                    <div className="booking-state-container">
                        <div className="booking-state-card">
                            <div
                                className="booking-loader"
                                role="status"
                                aria-label="Loading fundi details"
                            />
                            <h2>Loading fundi details</h2>
                            <p className="booking-state-message">
                                Please wait while we prepare your booking.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    if (!fundi) {
        return (
            <main className="booking-page">
                <div className="booking-container">
                    <div className="booking-state-container">
                        <div className="booking-state-card booking-state-error">
                            <div className="booking-state-icon">!</div>
                            <h1>Fundi unavailable</h1>
                            <p className="booking-state-message">
                                {error ||
                                    "We couldn't find the selected fundi."}
                            </p>

                            <div className="booking-state-actions">
                                <button
                                    type="button"
                                    className="booking-secondary-button"
                                    onClick={() => navigate(-1)}
                                >
                                    Go back
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="booking-page">
            <div className="booking-container">
                <button
                    type="button"
                    className="back-link"
                    onClick={() => navigate(-1)}
                >
                    <span aria-hidden="true">←</span> Back
                </button>

                <header className="booking-header">
                    <span className="booking-eyebrow">
                        BOOK A PROFESSIONAL
                    </span>

                    <h1>Make a booking</h1>

                    <p>
                        Tell us what you need, choose a convenient time,
                        and send your booking request to your selected fundi.
                    </p>
                </header>

                {error && (
                    <div className="booking-alert booking-error" role="alert">
                        <span className="booking-alert-icon">!</span>
                        <span>{error}</span>

                        <button
                            type="button"
                            className="booking-alert-dismiss"
                            aria-label="Dismiss error"
                            onClick={() => setError("")}
                        >
                            ×
                        </button>
                    </div>
                )}

                {success && (
                    <div
                        className="booking-alert booking-success"
                        role="status"
                    >
                        <span className="booking-alert-icon">✓</span>
                        <span>{success}</span>
                    </div>
                )}

                <div className="booking-layout">
                    <section className="booking-form-card">
                        <div className="booking-card-heading">
                            <div className="booking-step-number">01</div>
                            <div>
                                <h2>Booking details</h2>
                                <p>
                                    Provide the information needed to plan
                                    your service.
                                </p>
                            </div>
                        </div>

                        <form
                            className="booking-form"
                            onSubmit={handleSubmit}
                        >
                            <div className="form-group">
                                <label htmlFor="serviceRequired">
                                    Service required
                                    <span className="required-mark">*</span>
                                </label>
                                <input
                                    id="serviceRequired"
                                    type="text"
                                    name="serviceRequired"
                                    value={formData.serviceRequired}
                                    onChange={handleChange}
                                    placeholder="e.g. Plumbing repair"
                                    required
                                />
                                <span className="field-hint">
                                    Briefly name the service you need.
                                </span>
                            </div>

                            <div className="booking-section-label">
                                <span
                                    className="booking-section-icon"
                                    aria-hidden="true"
                                >
                                    ◷
                                </span>
                                When do you need the service?
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="scheduledDate">
                                        Preferred date
                                        <span className="required-mark">*</span>
                                    </label>
                                    <input
                                        id="scheduledDate"
                                        type="date"
                                        name="scheduledDate"
                                        value={formData.scheduledDate}
                                        onChange={handleChange}
                                        min={new Date().toLocaleDateString("en-CA")}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="scheduledTime">
                                        Preferred time
                                        <span className="required-mark">*</span>
                                    </label>
                                    <input
                                        id="scheduledTime"
                                        type="time"
                                        name="scheduledTime"
                                        value={formData.scheduledTime}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="booking-form-divider" />

                            <div className="booking-section-label">
                                <span
                                    className="booking-section-icon"
                                    aria-hidden="true"
                                >
                                    ⌖
                                </span>
                                Where is the job?
                            </div>

                            <div className="form-group">
                                <label htmlFor="jobLocation">
                                    Service address
                                    <span className="required-mark">*</span>
                                </label>
                                <input
                                    id="jobLocation"
                                    type="text"
                                    name="jobLocation"
                                    value={formData.jobLocation}
                                    onChange={handleChange}
                                    placeholder="Enter the full service address"
                                    autoComplete="street-address"
                                    required
                                />
                                <span className="field-hint">
                                    Include the suburb and any useful directions.
                                </span>
                            </div>

                            <div className="form-group">
                                <label htmlFor="estimatedBudget">
                                    Estimated budget
                                    <span className="optional-label">
                                        Optional
                                    </span>
                                </label>
                                <div className="booking-budget-field">
                                    <span className="booking-currency">R</span>
                                    <input
                                        id="estimatedBudget"
                                        type="number"
                                        name="estimatedBudget"
                                        value={formData.estimatedBudget}
                                        onChange={handleChange}
                                        placeholder="e.g. 1500"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <span className="field-hint">
                                    Your estimated budget in South African rand.
                                </span>
                            </div>

                            <div className="booking-form-divider" />

                            <div className="booking-section-label">
                                <span
                                    className="booking-section-icon"
                                    aria-hidden="true"
                                >
                                    ☰
                                </span>
                                Tell us about the job
                            </div>

                            <div className="form-group">
                                <label htmlFor="jobDescription">
                                    Job description
                                    <span className="required-mark">*</span>
                                </label>
                                <textarea
                                    id="jobDescription"
                                    name="jobDescription"
                                    value={formData.jobDescription}
                                    onChange={handleChange}
                                    placeholder="Describe the problem, the work required, and any important details..."
                                    rows="5"
                                    required
                                />
                                <span className="field-hint">
                                    Include details that will help the fundi
                                    understand your requirements.
                                </span>
                            </div>

                            <div className="booking-form-footer">
                                <button
                                    type="submit"
                                    className="booking-submit"
                                    disabled={submitting || Boolean(success)}
                                >
                                    {submitting ? (
                                        <>
                                            <span
                                                className="booking-button-spinner"
                                                aria-hidden="true"
                                            />
                                            Submitting booking...
                                        </>
                                    ) : success ? (
                                        "Booking submitted"
                                    ) : (
                                        "Confirm booking request"
                                    )}
                                </button>

                                <p className="booking-submit-note">
                                    Your request will be sent to the selected
                                    fundi for the next steps.
                                </p>
                            </div>
                        </form>
                    </section>

                    <aside className="booking-sidebar">
                        <section className="booking-fundi-card">
                            <div className="booking-sidebar-heading">
                                <span className="booking-sidebar-eyebrow">
                                    YOUR SELECTED PROFESSIONAL
                                </span>
                                <h2>Booking with</h2>
                            </div>

                            <div className="booking-fundi-identity">
                                <div className="booking-fundi-avatar">
                                    {initials || "F"}
                                </div>

                                <div className="booking-fundi-details">
                                    <h3>{fullName}</h3>
                                    <p>{tradeCategory}</p>

                                    <span
                                        className={`booking-verification ${
                                            fundi.verificationStatus === "APPROVED"
                                                ? "is-approved"
                                                : "is-pending"
                                        }`}
                                    >
                                        {fundi.verificationStatus === "APPROVED"
                                            ? "✓ Verified professional"
                                            : "Verification pending"}
                                    </span>
                                </div>
                            </div>

                            <div className="booking-fundi-rates">
                                <div className="booking-rate-row">
                                    <span>Hourly rate</span>
                                    <strong>
                                        {formatCurrency(fundi.hourlyRate)}
                                    </strong>
                                </div>

                                <div className="booking-rate-row">
                                    <span>Callout fee</span>
                                    <strong>
                                        {formatCurrency(fundi.calloutFee)}
                                    </strong>
                                </div>
                            </div>

                            <p className="booking-rates-note">
                                Final costs may depend on the scope of work
                                and any additional materials required.
                            </p>
                        </section>

                        <section className="booking-help-card">
                            <div
                                className="booking-help-icon"
                                aria-hidden="true"
                            >
                                ?
                            </div>

                            <div>
                                <h3>Need help with your booking?</h3>
                                <p>
                                    Double-check your job address and
                                    description before submitting.
                                </p>
                                <button
                                    type="button"
                                    className="booking-help-link"
                                    onClick={() => navigate(-1)}
                                >
                                    Return to fundi profile
                                </button>
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </main>
    );
}

export default Booking;
