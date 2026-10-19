
const AUTH_STORAGE_KEY = "fundiShopUser";

const VALID_ROLES = ["HOMEOWNER", "FUNDI", "ADMIN"];

/**
 * Read the current authenticated user.
 * sessionStorage is the primary store.
 * localStorage is supported as a fallback for older sessions.
 */
export function getLoggedInUser() {
    const sessionUser = sessionStorage.getItem(AUTH_STORAGE_KEY);
    const localUser = localStorage.getItem(AUTH_STORAGE_KEY);

    const storedUser = sessionUser || localUser;

    if (!storedUser) {
        return null;
    }

    try {
        const parsedUser = JSON.parse(storedUser);

        const user = {
            ...parsedUser,
            role:
                typeof parsedUser?.role === "string"
                    ? parsedUser.role.trim().toUpperCase()
                    : "",
        };

        const validUser =
            user &&
            user.id !== undefined &&
            user.id !== null &&
            String(user.id).trim() !== "" &&
            typeof user.token === "string" &&
            user.token.trim() !== "" &&
            VALID_ROLES.includes(user.role);

        if (!validUser) {
            console.error("AUTH DEBUG: User rejected", {
                hasId:
                    user?.id !== undefined &&
                    user?.id !== null &&
                    String(user.id).trim() !== "",
                role: user?.role,
                hasToken: Boolean(user?.token),
                tokenIsString: typeof user?.token === "string",
                validRole: VALID_ROLES.includes(user?.role),
            });

            // Temporary diagnostic: do not delete the session yet.
            return null;
        }

        return user;
    } catch (error) {
        console.error("Unable to read saved user session:", error);
        return null;
    }
}

/**
 * Save a successfully authenticated user.
 */
export function saveLoggedInUser(user) {
    if (!user || typeof user !== "object") {
        throw new Error("A valid user object is required.");
    }

    const normalizedUser = {
        ...user,
        role:
            typeof user.role === "string"
                ? user.role.trim().toUpperCase()
                : "",
    };

    const validUser =
        normalizedUser.id !== undefined &&
        normalizedUser.id !== null &&
        String(normalizedUser.id).trim() !== "" &&
        typeof normalizedUser.token === "string" &&
        normalizedUser.token.trim() !== "" &&
        VALID_ROLES.includes(normalizedUser.role);

    if (!validUser) {
        throw new Error(
            "The login response is missing a valid user ID, role or token."
        );
    }

    localStorage.removeItem(AUTH_STORAGE_KEY);

    sessionStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify(normalizedUser)
    );

    window.dispatchEvent(new Event("fundiShopAuthChange"));

    return normalizedUser;
}

/**
 * Clear authentication data from both storage locations.
 */
export function clearLoggedInUser() {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);

    window.dispatchEvent(new Event("fundiShopAuthChange"));
}

/**
 * Return the correct dashboard for the user's role.
 */
export function getDashboardPath(role) {
    switch (role?.trim().toUpperCase()) {
        case "HOMEOWNER":
            return "/homeowner-dashboard";

        case "FUNDI":
            return "/fundi-dashboard";

        case "ADMIN":
            return "/admin";

        default:
            return "/login";
    }
}

/**
 * Build headers for authenticated API requests.
 */
export function getAuthHeaders() {
    const user = getLoggedInUser();

    if (!user) {
        return {};
    }

    return {
        Authorization: `Bearer ${user.token}`,
    };
}
