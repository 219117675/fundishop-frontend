import { Routes, Route, Link } from "react-router-dom";

import Navbar from "./components/Navbar";
import Fundis from "./pages/Fundis";
import FundiProfile from "./pages/FundiProfile";
import Booking from "./pages/Booking";
import Register from "./pages/Register";
import Login from "./pages/Login";
import HomeownerDashboard from "./pages/HomeownerDashboard";
import FundiDashboard from "./pages/FundiDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import FundiProfileManagement from "./pages/FundiProfileManagement";
import FundiBookings from "./pages/FundiBookings";
import MyBookings   from "./pages/MyBookings.jsx";



import "./App.css";

function Home() {
    return (
        <main>
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
          <span className="hero-label">
            TRUSTED LOCAL PROFESSIONALS
          </span>

                    <h1>
                        Find the right <span>Fundi</span> for the job.
                    </h1>

                    <p>
                        Connect with skilled and verified local professionals
                        for electrical, plumbing, handyman, painting and other
                        services.
                    </p>

                    <div className="hero-buttons">
                        <Link
                            to="/fundis"
                            className="primary-button"
                        >
                            Find a Fundi
                        </Link>

                        <Link
                            to="/register"
                            className="secondary-button"
                        >
                            Become a Fundi
                        </Link>
                    </div>
                </div>

                <div className="hero-card">
                    <div className="hero-card-icon">
                        🔧
                    </div>

                    <h3>Need a professional?</h3>

                    <p>
                        Tell us what you need and find a trusted Fundi near you.
                    </p>

                    <Link
                        to="/services"
                        className="card-button"
                    >
                        Find Services
                    </Link>
                </div>
            </section>

            {/* Services Preview */}
            <section className="services-section">

                <div className="section-heading">
                    <span>WHAT DO YOU NEED?</span>

                    <h2>
                        Browse popular services
                    </h2>

                    <p>
                        Find skilled professionals for your next project.
                    </p>
                </div>

                <div className="service-grid">

                    <div className="service-card">
                        <div className="service-icon electrical">
                            ⚡
                        </div>

                        <h3>Electrical</h3>

                        <p>
                            Electricians for installations and repairs.
                        </p>
                    </div>

                    <div className="service-card">
                        <div className="service-icon plumbing">
                            🚰
                        </div>

                        <h3>Plumbing</h3>

                        <p>
                            Professional plumbing services for your home.
                        </p>
                    </div>

                    <div className="service-card">
                        <div className="service-icon handyman">
                            🔨
                        </div>

                        <h3>Handyman</h3>

                        <p>
                            Reliable help for everyday repairs and projects.
                        </p>
                    </div>

                    <div className="service-card">
                        <div className="service-icon painting">
                            🎨
                        </div>

                        <h3>Painting</h3>

                        <p>
                            Skilled painters for interior and exterior work.
                        </p>
                    </div>

                </div>

            </section>
        </main>
    );
}

function App() {
    return (
        <>
            <Navbar />

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/fundis" element={<Fundis />} />
                <Route path="/fundis/:id" element={<FundiProfile />}/>
                <Route path="/booking/:id" element={<Booking />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/homeowner" element={<ProtectedRoute><HomeownerDashboard /> </ProtectedRoute>} />
                <Route path="/fundi-dashboard" element={<FundiDashboard />} />
                <Route path="/fundi-profile" element={<FundiProfileManagement />} />
                <Route path="/fundi-bookings" element={<FundiBookings />} />
                <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />




                <Route
                    path="/services"
                    element={<h1 style={{ padding: "40px" }}>Services</h1>}
                />

                <Route
                    path="/about"
                    element={<h1 style={{ padding: "40px" }}>About Us</h1>}
                />
            </Routes>
        </>
    );
}

export default App;