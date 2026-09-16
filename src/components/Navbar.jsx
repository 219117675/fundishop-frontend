import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
    return (
        <nav className="navbar">
            <div className="navbar-container">

                {/* Logo */}
                <Link to="/" className="navbar-logo">
                    <div className="logo-icon">🔧</div>
                    <span>FundiShop</span>
                </Link>



                {/* Navigation links */}
                <div className="navbar-links">
                    <a href="/">Home</a>
                    <a href="/fundis">Find a Fundi</a>
                    <a href="/services">Services</a>
                    <a href="/about">About Us</a>
                </div>

                {/* Authentication buttons */}
                <div className="navbar-actions">
                    <Link to="/login" className="login-button">
                        Login
                    </Link>

                    <Link to="/register" className="register-button">
                        Register
                    </Link>
                </div>

            </div>
        </nav>
    );
}

export default Navbar;