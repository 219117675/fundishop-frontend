
import { Routes, Route, Link, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Fundis from "./pages/Fundis";
import FundiProfile from "./pages/FundiProfile";
import Booking from "./pages/Booking";
import Register from "./pages/Register";
import Login from "./pages/Login";

import HomeownerDashboard from "./pages/HomeownerDashboard";
import FundiDashboard from "./pages/FundiDashboard";
import FundiProfileManagement from "./pages/FundiProfileManagement";
import FundiBookings from "./pages/FundiBookings";
import MyBookings from "./pages/MyBookings";
import Notifications from "./pages/Notifications";
import AdminDashboard from "./pages/AdminDashboard";

import "./App.css";

function Home() {
    return (
        <main className="landing-page">
            <section className="landing-hero">
                <div className="landing-hero-inner">
                    <div className="landing-copy">
                        <span className="landing-eyebrow">
                            <span className="eyebrow-icon">✦</span>
                            YOUR TRUSTED HOME SERVICE MARKETPLACE
                        </span>

                        <h1>
                            Your home.
                            <br />
                            Your project.
                            <br />
                            <span>Your Fundi.</span>
                        </h1>

                        <p className="landing-description">
                            Find skilled local professionals for repairs,
                            maintenance and home improvements. Browse profiles
                            and request a booking in just a few steps.
                        </p>

                        <div className="landing-actions">
                            <Link to="/fundis" className="landing-primary">
                                Find a Fundi <span>↗</span>
                            </Link>

                            <Link
                                to="/register?role=FUNDI"
                                className="landing-secondary"
                            >
                                Become a Fundi
                            </Link>
                        </div>

                        <div className="landing-trust">
                            <span className="trust-icon">✓</span>
                            <div>
                                <strong>Home services made simple</strong>
                                <span>
                                    Explore professionals and manage your bookings.
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="landing-visual">
                        <div className="visual-label">
                            <span className="live-dot" />
                            Your next project starts here
                        </div>

                        <img
                            className="hero-image"
                            src="/images/fundishop-home-hero.png"
                            alt="Home service professional with tools in front of a modern house"
                        />

                        <div className="floating-service service-top">
                            <span className="floating-service-icon">🔧</span>
                            <div>
                                <strong>Skilled professionals</strong>
                                <span>Help for your next project</span>
                            </div>
                            <span className="floating-check">✓</span>
                        </div>

                        <div className="floating-service service-bottom">
                            <span className="floating-service-icon">🏠</span>
                            <div>
                                <strong>Your home, taken care of</strong>
                                <span>Repairs, maintenance and more</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-content">
                <div className="landing-services">
                    <div className="section-heading">
                        <div>
                            <span className="section-kicker">
                                FIND THE RIGHT HELP
                            </span>
                            <h2>Popular services</h2>
                        </div>

                        <Link to="/fundis" className="view-all-link">
                            View all Fundis →
                        </Link>
                    </div>

                    <div className="landing-service-grid">
                        <Link
                            to="/fundis?trade=ELECTRICAL"
                            className="landing-service-card"
                        >
                            <span className="service-icon electrical">ϟ</span>
                            <span className="service-title">Electrical</span>
                            <span className="service-description">
                                Wiring and repairs
                            </span>
                        </Link>

                        <Link
                            to="/fundis?trade=PLUMBING"
                            className="landing-service-card"
                        >
                            <span className="service-icon plumbing">♧</span>
                            <span className="service-title">Plumbing</span>
                            <span className="service-description">
                                Pipes, taps and leaks
                            </span>
                        </Link>

                        <Link
                            to="/fundis?trade=HANDYMAN"
                            className="landing-service-card"
                        >
                            <span className="service-icon handyman">⚒</span>
                            <span className="service-title">Handyman</span>
                            <span className="service-description">
                                Everyday home repairs
                            </span>
                        </Link>

                        <Link
                            to="/fundis?trade=PAINTING"
                            className="landing-service-card"
                        >
                            <span className="service-icon painting">▰</span>
                            <span className="service-title">Painting</span>
                            <span className="service-description">
                                Refresh your space
                            </span>
                        </Link>
                    </div>
                </div>

                <div className="landing-how">
                    <div className="section-heading">
                        <div>
                            <span className="section-kicker">
                                THREE SIMPLE STEPS
                            </span>
                            <h2>How it works</h2>
                        </div>
                    </div>

                    <div className="landing-steps">
                        <article className="landing-step">
                            <span className="step-icon">⌕</span>
                            <div>
                                <strong>1. Find a Fundi</strong>
                                <span>Explore services and profiles.</span>
                            </div>
                        </article>

                        <span className="step-arrow">→</span>

                        <article className="landing-step">
                            <span className="step-icon">▦</span>
                            <div>
                                <strong>2. Request a booking</strong>
                                <span>Choose a date and describe the job.</span>
                            </div>
                        </article>

                        <span className="step-arrow">→</span>

                        <article className="landing-step">
                            <span className="step-icon">✓</span>
                            <div>
                                <strong>3. Manage your booking</strong>
                                <span>Keep track through your account.</span>
                            </div>
                        </article>
                    </div>
                </div>
            </section>
        </main>
    );
}

function Services() {
    return (
        <main className="simple-page">
            <section className="simple-page-content">
                <span className="hero-label">OUR SERVICES</span>
                <h1>Find help for your next home project.</h1>
                <p>
                    Explore available professionals and choose the service
                    that suits your needs.
                </p>

                <div className="simple-page-actions">
                    <Link to="/fundis?trade=ELECTRICAL" className="primary-button">
                        Electrical
                    </Link>
                    <Link to="/fundis?trade=PLUMBING" className="primary-button">
                        Plumbing
                    </Link>
                    <Link to="/fundis?trade=HANDYMAN" className="primary-button">
                        Handyman
                    </Link>
                    <Link to="/fundis?trade=PAINTING" className="primary-button">
                        Painting
                    </Link>
                    <Link to="/fundis" className="secondary-button">
                        View all Fundis
                    </Link>
                </div>
            </section>
        </main>
    );
}

function About() {
    return (
        <main className="simple-page">
            <section className="simple-page-content">
                <span className="hero-label">ABOUT FUNDISHOP</span>
                <h1>Connecting homeowners with local professionals.</h1>
                <p>
                    FundiShop helps homeowners discover local professionals,
                    explore their services, request bookings and manage their
                    home projects in one place.
                </p>

                <div className="simple-page-actions">
                    <Link to="/fundis" className="primary-button">
                        Find a Fundi
                    </Link>
                    <Link
                        to="/register?role=FUNDI"
                        className="secondary-button"
                    >
                        Become a Fundi
                    </Link>
                </div>
            </section>
        </main>
    );
}

function DashboardRedirect() {
    const storedUser = sessionStorage.getItem("fundiShopUser");

    if (!storedUser) {
        return <Navigate to="/login" replace />;
    }

    let user;

    try {
        user = JSON.parse(storedUser);
    } catch {
        sessionStorage.removeItem("fundiShopUser");
        return <Navigate to="/login" replace />;
    }

    if (user?.role === "HOMEOWNER") {
        return <Navigate to="/homeowner-dashboard" replace />;
    }

    if (user?.role === "FUNDI") {
        return <Navigate to="/fundi-dashboard" replace />;
    }

    if (user?.role === "ADMIN") {
        return <Navigate to="/admin" replace />;
    }

    sessionStorage.removeItem("fundiShopUser");
    return <Navigate to="/login" replace />;
}

function App() {
    return (
        <>
            <Navbar />

            <Routes>
                <Route path="/" element={<Home />} />

                <Route path="/fundis" element={<Fundis />} />
                <Route path="/fundis/:id" element={<FundiProfile />} />
                <Route path="/services" element={<Services />} />
                <Route path="/about" element={<About />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />

                <Route path="/dashboard" element={<DashboardRedirect />} />

                <Route
                    path="/booking/:id"
                    element={
                        <ProtectedRoute role="HOMEOWNER">
                            <Booking />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/homeowner-dashboard"
                    element={
                        <ProtectedRoute role="HOMEOWNER">
                            <HomeownerDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/homeowner"
                    element={
                        <ProtectedRoute role="HOMEOWNER">
                            <HomeownerDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/my-bookings"
                    element={
                        <ProtectedRoute role="HOMEOWNER">
                            <MyBookings />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/notifications"
                    element={
                        <ProtectedRoute>
                            <Notifications />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/fundi-dashboard"
                    element={
                        <ProtectedRoute role="FUNDI">
                            <FundiDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/fundi-profile"
                    element={
                        <ProtectedRoute role="FUNDI">
                            <FundiProfileManagement />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/fundi-bookings"
                    element={
                        <ProtectedRoute role="FUNDI">
                            <FundiBookings />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute role="ADMIN">
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="*"
                    element={
                        <main className="simple-page">
                            <section className="simple-page-content">
                                <span className="hero-label">404</span>
                                <h1>Page not found</h1>
                                <p>
                                    The page you're looking for doesn't exist
                                    or may have been moved.
                                </p>
                                <Link to="/" className="primary-button">
                                    Return home
                                </Link>
                            </section>
                        </main>
                    }
                />
            </Routes>
        </>
    );
}

export default App;
