
// src/components/ProtectedRoute.jsx

import { Navigate, useLocation } from "react-router-dom";
import {
    getLoggedInUser,
    getDashboardPath,
} from "../utils/auth";

function ProtectedRoute({ children, role }) {
    const location = useLocation();
    const user = getLoggedInUser();

    // No valid session: send the user to login.
    if (!user) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location }}
            />
        );
    }

    // A valid session exists, but the user has the wrong role.
    if (role && user.role !== role.toUpperCase()) {
        return (
            <Navigate
                to={getDashboardPath(user.role)}
                replace
            />
        );
    }

    return children;
}

export default ProtectedRoute;
