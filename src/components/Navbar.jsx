
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import NotificationBell from "./NotificationBell";
import {
    getLoggedInUser,
    getDashboardPath,
    clearLoggedInUser,
} from "../utils/auth";
import "./Navbar.css";

function Navbar() {
    const navigate = useNavigate();

    const [user, setUser] = useState(() => getLoggedInUser());

    useEffect(() => {
        const handleAuthChange = () => {
            setUser(getLoggedInUser());
        };

        window.addEventListener(
            "fundiShopAuthChange",
            handleAuthChange
        );

        window.addEventListener("storage", handleAuthChange);

        return () => {
            window.removeEventListener(
                "fundiShopAuthChange",
                handleAuthChange
            );

            window.removeEventListener(
                "storage",
                handleAuthChange
            );
        };
    }, []);

    const handleLogout = () => {
        clearLoggedInUser();
        setUser(null);
        navigate("/", { replace: true });
    };

    const isHomeowner = user?.role === "HOMEOWNER";
    const isFundi = user?.role === "FUNDI";
    const isAdmin = user?.role === "ADMIN";

    const isLoggedIn = Boolean(user);

    const dashboardPath = isLoggedIn
        ? getDashboardPath(user.role)
        : "/login";

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link
                    to="/"
                    className="navbar-logo"
                    aria-label="FundiShop home"
                >
                    <div className="logo-icon">🔧</div>
                    <span>FundiShop</span>
                </Link>

                <div className="navbar-links">
                    <Link to="/">Home</Link>
                    <Link to="/fundis">Find a Fundi</Link>
                    <Link to="/services">Services</Link>
                    <Link to="/about">About Us</Link>

                    {isHomeowner && (
                        <Link to="/my-bookings">
                            My Bookings
                        </Link>
                    )}

                    {isFundi && (
                        <>
                            <Link to="/fundi-bookings">
                                Bookings
                            </Link>

                            <Link to="/fundi-profile">
                                My Profile
                            </Link>
                        </>
                    )}

                    {isAdmin && (
                        <Link to="/admin">Admin</Link>
                    )}
                </div>

                <div className="navbar-actions">
                    {!isLoggedIn ? (
                        <>
                            <Link
                                to="/login"
                                className="login-button"
                            >
                                Login
                            </Link>

                            <Link
                                to="/register"
                                className="register-button"
                            >
                                Register
                            </Link>
                        </>
                    ) : (
                        <>
                            <NotificationBell />

                            <Link
                                to={dashboardPath}
                                className="dashboard-button"
                            >
                                Dashboard
                            </Link>

                            <span className="navbar-user">
                                {user.fullName || "Account"}
                            </span>

                            <button
                                type="button"
                                className="logout-button"
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
