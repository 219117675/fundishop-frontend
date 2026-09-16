
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Fundis.css";

function Fundis() {
    const [fundis, setFundis] = useState([]);
    const [filteredFundis, setFilteredFundis] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTrade, setSelectedTrade] = useState("");

    useEffect(() => {
        fetchFundis();
    }, []);

    const fetchFundis = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                "http://localhost:8080/api/fundiprofiles"
            );

            if (!response.ok) {
                throw new Error("Failed to load Fundis");
            }

            const data = await response.json();

            setFundis(data);
            setFilteredFundis(data);

        } catch (err) {
            console.error("Error loading Fundis:", err);

            setError(
                "Unable to load Fundis at the moment. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const getTradeName = (tradeCategory) => {
        const tradeNames = {
            ELECTRICAL: "Electrician",
            PLUMBING: "Plumber",
            HANDYMAN: "Handyman",
            PAINTING: "Painter",
            GENERAL: "General",
        };

        return tradeNames[tradeCategory] || tradeCategory || "General";
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

    const handleSearch = () => {
        const search = searchTerm.trim().toLowerCase();

        const results = fundis.filter((fundi) => {
            const fullName = fundi.user?.fullName || "";
            const email = fundi.user?.email || "";
            const trade = getTradeName(fundi.tradeCategory);
            const bio = fundi.bio || "";

            const matchesSearch =
                search === "" ||
                fullName.toLowerCase().includes(search) ||
                email.toLowerCase().includes(search) ||
                trade.toLowerCase().includes(search) ||
                bio.toLowerCase().includes(search);

            const matchesTrade =
                selectedTrade === "" ||
                fundi.tradeCategory === selectedTrade;

            return matchesSearch && matchesTrade;
        });

        setFilteredFundis(results);
    };

    const handleReset = () => {
        setSearchTerm("");
        setSelectedTrade("");
        setFilteredFundis(fundis);
    };

    return (
        <main className="fundis-page">

            {/* Page Header */}
            <section className="fundis-header">
                <div>
                    <span>FUNDISHOP PROFESSIONALS</span>

                    <h1>Find a Fundi</h1>

                    <p>
                        Find trusted and verified professionals
                        for your next job.
                    </p>
                </div>
            </section>

            {/* Search */}
            <section className="fundis-search">

                <input
                    type="text"
                    placeholder="Search for a Fundi or service..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            handleSearch();
                        }
                    }}
                />

                <select
                    value={selectedTrade}
                    onChange={(e) => {
                        setSelectedTrade(e.target.value);
                    }}
                >
                    <option value="">
                        All trades
                    </option>

                    <option value="ELECTRICAL">
                        Electrician
                    </option>

                    <option value="PLUMBING">
                        Plumber
                    </option>

                    <option value="HANDYMAN">
                        Handyman
                    </option>

                    <option value="PAINTING">
                        Painter
                    </option>

                    <option value="GENERAL">
                        General
                    </option>
                </select>

                <select defaultValue="">
                    <option value="">
                        All locations
                    </option>
                </select>

                <button
                    type="button"
                    onClick={handleSearch}
                >
                    Search
                </button>

            </section>

            {/* Results */}
            <section className="fundis-results">

                <div className="results-heading">

                    <h2>Available Fundis</h2>

                    <span>
                        {filteredFundis.length} professionals
                    </span>

                </div>

                {/* Loading */}
                {loading && (
                    <div className="fundis-message">
                        <div className="loading-spinner"></div>

                        <h2>Loading Fundis...</h2>

                        <p>
                            Please wait while we find registered
                            professionals.
                        </p>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="fundis-message">

                        <h2>Something went wrong</h2>

                        <p>{error}</p>

                        <button
                            type="button"
                            className="retry-button"
                            onClick={fetchFundis}
                        >
                            Try Again
                        </button>

                    </div>
                )}

                {/* No Fundis */}
                {!loading &&
                    !error &&
                    filteredFundis.length === 0 && (
                        <div className="fundis-message">

                            <h2>No Fundis found</h2>

                            <p>
                                There are currently no registered Fundis
                                matching your search.
                            </p>

                            {(searchTerm || selectedTrade) && (
                                <button
                                    type="button"
                                    className="retry-button"
                                    onClick={handleReset}
                                >
                                    Clear Search
                                </button>
                            )}

                        </div>
                    )}

                {/* Fundi Cards */}
                {!loading &&
                    !error &&
                    filteredFundis.length > 0 && (

                        <div className="fundis-grid">

                            {filteredFundis.map((fundi) => {

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
                                    <article
                                        className="fundi-card"
                                        key={fundi.id}
                                    >

                                        {/* Avatar */}
                                        <div className="fundi-avatar">
                                            {getInitials(fullName)}
                                        </div>

                                        {/* Information */}
                                        <div className="fundi-info">

                                            <div className="fundi-name">

                                                <h3>
                                                    {fullName}
                                                </h3>

                                                {verified && (
                                                    <span className="verified">
                                                        ✓ Verified
                                                    </span>
                                                )}

                                            </div>

                                            <p className="fundi-trade">
                                                {trade}
                                            </p>

                                            <p className="fundi-location">
                                                📍 Service area:{" "}
                                                {fundi.serviceAreaRadiusKm}
                                                km
                                            </p>

                                            <div className="fundi-stats">

                                                <span>
                                                    💰 Callout: R
                                                    {fundi.calloutFee}
                                                </span>

                                                <span>
                                                    R
                                                    {fundi.hourlyRate}
                                                    /hour
                                                </span>

                                            </div>

                                            <Link
                                                to={`/fundis/${fundi.id}`}
                                                className="view-button"
                                            >
                                                View Profile
                                            </Link>

                                        </div>

                                    </article>
                                );
                            })}

                        </div>
                    )}

            </section>

        </main>
    );
}

export default Fundis;

