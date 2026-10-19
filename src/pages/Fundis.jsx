import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import API_URL from "../api";
import "./Fundis.css";

const TRADE_OPTIONS = [
    { value: "ELECTRICAL", label: "Electrician" },
    { value: "PLUMBING", label: "Plumber" },
    { value: "HANDYMAN", label: "Handyman" },
    { value: "PAINTING", label: "Painter" },
    { value: "GENERAL", label: "General services" },
    { value: "CARPENTRY", label: "Carpenter" },
    { value: "TILING", label: "Tiler" },
    { value: "BRICKLAYING", label: "Bricklayer" },
    { value: "ROOFING", label: "Roofer" },
    { value: "WELDING", label: "Welder" },
    { value: "GARDENING", label: "Gardener" },
    { value: "CLEANING", label: "Cleaner" },
];

function getTradeName(category) {
    const trade = TRADE_OPTIONS.find(
        (item) => item.value === category
    );

    return trade?.label || category || "General services";
}

function getFullName(user) {
    if (!user) return "Fundi professional";

    if (user.fullName) return user.fullName;

    if (user.firstName && user.lastName) {
        return `${user.firstName} ${user.lastName}`;
    }

    return user.firstName || user.name || "Fundi professional";
}

function getInitials(name) {
    if (!name) return "F";

    return name
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function formatCurrency(amount) {
    if (
        amount === null ||
        amount === undefined ||
        amount === ""
    ) {
        return null;
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount)) {
        return null;
    }

    return numericAmount.toLocaleString("en-ZA", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function Fundis() {
    const [searchParams, setSearchParams] = useSearchParams();

    const [fundis, setFundis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const selectedTrade = searchParams.get("trade") || "";

    useEffect(() => {
        let cancelled = false;

        async function loadFundis() {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `${API_URL}/api/fundiprofiles`,
                    {
                        method: "GET",
                        headers: {
                            Accept: "application/json",
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        `Unable to load professionals (HTTP ${response.status}).`
                    );
                }

                const responseText = await response.text();

                if (!responseText.trim()) {
                    throw new Error(
                        "The server returned an empty response."
                    );
                }

                let data;

                try {
                    data = JSON.parse(responseText);
                } catch {
                    throw new Error(
                        "The server returned data that could not be read."
                    );
                }

                if (cancelled) return;

                let fundiList = [];

                if (Array.isArray(data)) {
                    fundiList = data;
                } else if (Array.isArray(data.content)) {
                    fundiList = data.content;
                } else if (Array.isArray(data.data)) {
                    fundiList = data.data;
                } else {
                    throw new Error(
                        "The professionals list has an unexpected format."
                    );
                }

                const approvedFundis = fundiList.filter(
                    (fundi) =>
                        fundi.verificationStatus === "APPROVED"
                );

                if (cancelled) return;

                setFundis(approvedFundis);
            } catch (err) {
                if (cancelled) return;

                console.error("Error loading Fundis:", err);

                setFundis([]);
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load professionals."
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadFundis();

        return () => {
            cancelled = true;
        };
    }, []);

    const filteredFundis = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        return fundis.filter((fundi) => {
            const fullName = getFullName(fundi.user).toLowerCase();
            const email = fundi.user?.email?.toLowerCase() || "";
            const trade = getTradeName(fundi.tradeCategory).toLowerCase();
            const bio = fundi.bio?.toLowerCase() || "";

            const matchesSearch =
                !search ||
                fullName.includes(search) ||
                email.includes(search) ||
                trade.includes(search) ||
                bio.includes(search);

            const matchesTrade =
                !selectedTrade ||
                fundi.tradeCategory === selectedTrade;

            return matchesSearch && matchesTrade;
        });
    }, [fundis, searchTerm, selectedTrade]);

    function handleTradeChange(event) {
        const trade = event.target.value;

        if (trade) {
            setSearchParams({ trade });
        } else {
            setSearchParams({});
        }
    }

    function handleReset() {
        setSearchTerm("");
        setSearchParams({});
    }

    function handleSearch(event) {
        event?.preventDefault();
    }

    function handleRetry() {
        window.location.reload();
    }

    return (
        <main className="fundis-page">
            {/* Page introduction */}
            <section className="fundis-header">
                <div className="fundis-header-inner">
                    <div className="fundis-header-copy">
                        <span className="fundis-eyebrow">
                            <span className="fundis-eyebrow-dot" />
                            YOUR HOME, IN GOOD HANDS
                        </span>

                        <h1>
                            Find the right
                            <br />
                            <span>Fundi for the job.</span>
                        </h1>

                        <p>
                            Connect with verified home-service
                            professionals for repairs, upgrades,
                            maintenance and more.
                        </p>

                        <div className="fundis-header-points">
                            <span>
                                <span className="fundis-point-check">✓</span>
                                Verified professionals
                            </span>

                            <span>
                                <span className="fundis-point-check">✓</span>
                                Clear pricing
                            </span>

                            <span>
                                <span className="fundis-point-check">✓</span>
                                Easy booking
                            </span>
                        </div>
                    </div>

                    <div className="fundis-header-visual" aria-hidden="true">
                        <div className="fundis-visual-circle">
                            <span className="fundis-tool-icon">🔧</span>
                        </div>

                        <div className="fundis-visual-card fundis-visual-card-top">
                            <span className="fundis-visual-card-icon">✓</span>
                            <div>
                                <strong>Trusted professionals</strong>
                                <small>Ready to help</small>
                            </div>
                        </div>

                        <div className="fundis-visual-card fundis-visual-card-bottom">
                            <span className="fundis-visual-star">★</span>
                            <div>
                                <strong>Find your expert</strong>
                                <small>For your next project</small>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Search and filters */}
            <section className="fundis-search-section">
                <form
                    className="fundis-search"
                    onSubmit={handleSearch}
                >
                    <label className="fundis-search-field">
                        <span className="fundis-field-icon">⌕</span>

                        <span className="fundis-field-content">
                            <span className="fundis-field-label">
                                Search professionals
                            </span>

                            <input
                                type="search"
                                placeholder="Name, trade or service..."
                                value={searchTerm}
                                onChange={(event) =>
                                    setSearchTerm(event.target.value)
                                }
                                aria-label="Search professionals by name, trade or service"
                            />
                        </span>
                    </label>

                    <label className="fundis-search-field fundis-trade-field">
                        <span className="fundis-field-icon">⚒</span>

                        <span className="fundis-field-content">
                            <span className="fundis-field-label">
                                Type of service
                            </span>

                            <select
                                value={selectedTrade}
                                onChange={handleTradeChange}
                                aria-label="Filter by trade"
                            >
                                <option value="">All trades</option>

                                {TRADE_OPTIONS.map((trade) => (
                                    <option
                                        key={trade.value}
                                        value={trade.value}
                                    >
                                        {trade.label}
                                    </option>
                                ))}
                            </select>
                        </span>
                    </label>

                    <button
                        type="submit"
                        className="fundis-search-button"
                    >
                        Search professionals
                        <span aria-hidden="true">→</span>
                    </button>
                </form>
            </section>

            {/* Professional listings */}
            <section className="fundis-results">
                <div className="fundis-results-top">
                    <div>
                        <span className="fundis-section-kicker">
                            MEET YOUR LOCAL EXPERTS
                        </span>

                        <h2>Verified Fundis</h2>

                        <p className="fundis-results-description">
                            Find a professional who can help get the job done.
                        </p>
                    </div>

                    {!loading && !error && (
                        <div className="fundis-count">
                            <strong>{filteredFundis.length}</strong>
                            <span>
                                {filteredFundis.length === 1
                                    ? " professional"
                                    : " professionals"}
                            </span>
                        </div>
                    )}
                </div>

                {loading && (
                    <div className="fundis-message">
                        <div
                            className="loading-spinner"
                            role="status"
                            aria-label="Loading"
                        />

                        <h2>Finding your Fundis...</h2>

                        <p>
                            Please wait while we load verified
                            professionals.
                        </p>
                    </div>
                )}

                {!loading && error && (
                    <div className="fundis-message fundis-error-message">
                        <div className="fundis-message-icon">!</div>

                        <h2>We couldn't load the Fundis</h2>

                        <p>{error}</p>

                        <button
                            type="button"
                            className="retry-button"
                            onClick={handleRetry}
                        >
                            Try again
                        </button>
                    </div>
                )}

                {!loading &&
                    !error &&
                    filteredFundis.length === 0 && (
                        <div className="fundis-message">
                            <div className="fundis-message-icon">⌕</div>

                            <h2>No matching professionals yet</h2>

                            <p>
                                Try another search or select a different
                                trade to see available professionals.
                            </p>

                            {(searchTerm || selectedTrade) && (
                                <button
                                    type="button"
                                    className="retry-button"
                                    onClick={handleReset}
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    )}

                {!loading &&
                    !error &&
                    filteredFundis.length > 0 && (
                        <div className="fundis-grid">
                            {filteredFundis.map((fundi) => {
                                const fullName = getFullName(fundi.user);
                                const trade = getTradeName(
                                    fundi.tradeCategory
                                );
                                const calloutFee = formatCurrency(
                                    fundi.calloutFee
                                );
                                const hourlyRate = formatCurrency(
                                    fundi.hourlyRate
                                );

                                return (
                                    <article
                                        className="fundi-card"
                                        key={fundi.id}
                                    >
                                        <div className="fundi-card-top">
                                            <div className="fundi-avatar">
                                                {getInitials(fullName)}
                                            </div>

                                            <span className="verified">
                                                <span aria-hidden="true">✓</span>
                                                Verified
                                            </span>
                                        </div>

                                        <div className="fundi-info">
                                            <p className="fundi-card-kicker">
                                                {trade}
                                            </p>

                                            <h3 className="fundi-card-name">
                                                {fullName}
                                            </h3>

                                            <p className="fundi-trade">
                                                {trade} professional
                                            </p>

                                            <div className="fundi-location">
                                                <span aria-hidden="true">⌖</span>
                                                <span>
                                                    Service radius:{" "}
                                                    {fundi.serviceAreaRadiusKm ??
                                                        "Not specified"}
                                                    {fundi.serviceAreaRadiusKm !=
                                                        null && " km"}
                                                </span>
                                            </div>

                                            <div className="fundi-card-divider" />

                                            <div className="fundi-pricing">
                                                <div className="fundi-price-item">
                                                    <span>Callout fee</span>
                                                    <strong>
                                                        {calloutFee
                                                            ? `R${calloutFee}`
                                                            : "Ask for price"}
                                                    </strong>
                                                </div>

                                                <div className="fundi-price-item">
                                                    <span>Hourly rate</span>
                                                    <strong>
                                                        {hourlyRate
                                                            ? `R${hourlyRate}/hr`
                                                            : "Ask for price"}
                                                    </strong>
                                                </div>
                                            </div>

                                            <Link
                                                to={`/fundis/${fundi.id}`}
                                                className="view-button"
                                            >
                                                View profile
                                                <span aria-hidden="true">→</span>
                                            </Link>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}

                {!loading && !error && fundis.length > 0 && (
                    <p className="fundis-results-note">
                        Showing approved professionals available on FundiShop.
                    </p>
                )}
            </section>
        </main>
    );
}

export default Fundis;