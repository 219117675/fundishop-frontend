import { useCallback, useEffect, useState } from "react";
import API_URL from "../api";
import "./AdminDashboard.css";

function AdminDashboard() {
    const [fundis, setFundis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    /* =====================================================
       LOAD FUNDI PROFILES
       ===================================================== */

    const loadFundis = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/api/fundiprofiles`
            );

            if (!response.ok) {
                throw new Error(
                    `Server returned HTTP ${response.status}`
                );
            }

            const data = await response.json();

            if (!Array.isArray(data)) {
                throw new Error(
                    "Unexpected Fundi data received from server."
                );
            }

            setFundis(data);
        } catch (err) {
            console.error(
                "Error loading Fundis:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load Fundis."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    /* =====================================================
       INITIAL LOAD
       ===================================================== */

    useEffect(() => {
        const timer = setTimeout(() => {
            loadFundis();
        }, 0);

        return () => clearTimeout(timer);
    }, [loadFundis]);

    /* =====================================================
       APPROVE FUNDI
       ===================================================== */

    const handleApprove = async (fundiId) => {
        try {
            setActionLoading(fundiId);
            setError("");
            setMessage("");

            const response = await fetch(
                `${API_URL}/api/fundiprofiles/${fundiId}/approve`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Unable to approve Fundi. HTTP ${response.status}`
                );
            }

            setMessage(
                "Fundi approved successfully. They are now verified."
            );

            await loadFundis();
        } catch (err) {
            console.error(
                "Error approving Fundi:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to approve Fundi."
            );
        } finally {
            setActionLoading(null);
        }
    };

    /* =====================================================
       REJECT FUNDI
       ===================================================== */

    const handleReject = async (fundiId) => {
        try {
            setActionLoading(fundiId);
            setError("");
            setMessage("");

            const response = await fetch(
                `${API_URL}/api/fundiprofiles/${fundiId}/reject`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Unable to reject Fundi. HTTP ${response.status}`
                );
            }

            setMessage(
                "Fundi has been rejected."
            );

            await loadFundis();
        } catch (err) {
            console.error(
                "Error rejecting Fundi:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to reject Fundi."
            );
        } finally {
            setActionLoading(null);
        }
    };

    /* =====================================================
       FORMAT TRADE
       ===================================================== */

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

    /* =====================================================
       STATUS DISPLAY
       ===================================================== */

    const getStatusLabel = (status) => {
        switch (status) {
            case "APPROVED":
                return "✓ Verified";

            case "REJECTED":
                return "Rejected";

            case "PENDING":
            default:
                return "Pending Verification";
        }
    };

    /* =====================================================
       PAGE
       ===================================================== */

    return (
        <main className="admin-page">

            <section className="admin-header">
                <div>
                    <span>
                        FUNDISHOP ADMINISTRATION
                    </span>

                    <h1>
                        Admin Dashboard
                    </h1>

                    <p>
                        Review and verify Fundi
                        registrations before they
                        become available to
                        homeowners.
                    </p>
                </div>
            </section>

            {/* =================================================
                MESSAGES
                ================================================= */}

            {message && (
                <div className="admin-success">
                    {message}
                </div>
            )}

            {error && (
                <div className="admin-error">
                    {error}
                </div>
            )}

            {/* =================================================
                SUMMARY
                ================================================= */}

            <section className="admin-summary">

                <div className="admin-stat">
                    <span>Total Fundis</span>

                    <strong>
                        {fundis.length}
                    </strong>
                </div>

                <div className="admin-stat">
                    <span>Pending</span>

                    <strong>
                        {
                            fundis.filter(
                                (fundi) =>
                                    fundi.verificationStatus ===
                                    "PENDING"
                            ).length
                        }
                    </strong>
                </div>

                <div className="admin-stat">
                    <span>Verified</span>

                    <strong>
                        {
                            fundis.filter(
                                (fundi) =>
                                    fundi.verificationStatus ===
                                    "APPROVED"
                            ).length
                        }
                    </strong>
                </div>

                <div className="admin-stat">
                    <span>Rejected</span>

                    <strong>
                        {
                            fundis.filter(
                                (fundi) =>
                                    fundi.verificationStatus ===
                                    "REJECTED"
                            ).length
                        }
                    </strong>
                </div>

            </section>

            {/* =================================================
                FUNDI LIST
                ================================================= */}

            <section className="admin-section">

                <div className="admin-section-header">

                    <div>
                        <h2>
                            Fundi Verification
                        </h2>

                        <p>
                            Review registered Fundis
                            and approve or reject
                            their profiles.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="admin-refresh-button"
                        onClick={loadFundis}
                        disabled={loading}
                    >
                        {loading ? "Refreshing..." : "Refresh"}
                    </button>

                </div>

                {/* =================================================
                    LOADING
                    ================================================= */}

                {loading && (
                    <div className="admin-message">
                        Loading Fundi registrations...
                    </div>
                )}

                {/* =================================================
                    EMPTY
                    ================================================= */}

                {!loading &&
                    fundis.length === 0 && (
                        <div className="admin-message">
                            No Fundi registrations found.
                        </div>
                    )}

                {/* =================================================
                    TABLE
                    ================================================= */}

                {!loading &&
                    fundis.length > 0 && (

                        <div className="admin-table-wrapper">

                            <table className="admin-table">

                                <thead>
                                <tr>
                                    <th>
                                        Fundi
                                    </th>

                                    <th>
                                        Trade
                                    </th>

                                    <th>
                                        Email
                                    </th>

                                    <th>
                                        Phone
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Actions
                                    </th>
                                </tr>
                                </thead>

                                <tbody>

                                {fundis.map(
                                    (fundi) => {

                                        const user =
                                            fundi.user;

                                        const name =
                                            user?.fullName ||
                                            "Unnamed Fundi";

                                        const status =
                                            fundi.verificationStatus ||
                                            "PENDING";

                                        const isPending =
                                            status ===
                                            "PENDING";

                                        const isLoading =
                                            actionLoading ===
                                            fundi.id;

                                        return (
                                            <tr
                                                key={fundi.id}
                                            >

                                                <td>
                                                    <strong>
                                                        {name}
                                                    </strong>
                                                </td>

                                                <td>
                                                    {
                                                        getTradeName(
                                                            fundi.tradeCategory
                                                        )
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        user?.email ||
                                                        "Not provided"
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        user?.phone ||
                                                        "Not provided"
                                                    }
                                                </td>

                                                <td>
                                                        <span
                                                            className={`admin-status admin-status-${status.toLowerCase()}`}
                                                        >
                                                            {
                                                                getStatusLabel(
                                                                    status
                                                                )
                                                            }
                                                        </span>
                                                </td>

                                                <td>

                                                    {isPending ? (
                                                        <div className="admin-actions">

                                                            <button
                                                                type="button"
                                                                className="approve-button"
                                                                onClick={() =>
                                                                    handleApprove(
                                                                        fundi.id
                                                                    )
                                                                }
                                                                disabled={
                                                                    isLoading
                                                                }
                                                            >
                                                                {isLoading
                                                                    ? "Processing..."
                                                                    : "Approve"}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="reject-button"
                                                                onClick={() =>
                                                                    handleReject(
                                                                        fundi.id
                                                                    )
                                                                }
                                                                disabled={
                                                                    isLoading
                                                                }
                                                            >
                                                                {isLoading
                                                                    ? "Processing..."
                                                                    : "Reject"}
                                                            </button>

                                                        </div>
                                                    ) : (
                                                        <span className="admin-no-action">
                                                                No action
                                                                required
                                                            </span>
                                                    )}

                                                </td>

                                            </tr>
                                        );
                                    }
                                )}

                                </tbody>

                            </table>

                        </div>
                    )}

            </section>

        </main>
    );
}

export default AdminDashboard;