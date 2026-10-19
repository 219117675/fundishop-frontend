import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../api";
import "./NotificationBell.css";

function getStoredUser() {
    const storedUser = localStorage.getItem("fundiShopUser");

    if (!storedUser) {
        return null;
    }

    try {
        return JSON.parse(storedUser);
    } catch (error) {
        console.error("Unable to read stored user:", error);
        return null;
    }
}

function NotificationBell() {
    const [user, setUser] = useState(getStoredUser);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    /*
     * =========================================================
     * AUTH HEADERS
     * =========================================================
     */

    const getAuthHeaders = () => {
        const storedUser = localStorage.getItem("fundiShopUser");

        if (!storedUser) {
            return {
                "Content-Type": "application/json",
            };
        }

        try {
            const currentUser = JSON.parse(storedUser);

            return {
                "Content-Type": "application/json",
                Authorization: currentUser?.token
                    ? `Bearer ${currentUser.token}`
                    : "",
            };
        } catch (error) {
            console.error(
                "Unable to read authentication information:",
                error
            );

            return {
                "Content-Type": "application/json",
            };
        }
    };

    /*
     * =========================================================
     * KEEP USER IN SYNC
     * =========================================================
     */

    useEffect(() => {
        const handleAuthChange = () => {
            setUser(getStoredUser());
        };

        window.addEventListener(
            "fundiShopAuthChange",
            handleAuthChange
        );

        window.addEventListener(
            "storage",
            handleAuthChange
        );

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

    /*
     * =========================================================
     * LOAD UNREAD COUNT
     * =========================================================
     */

    useEffect(() => {
        if (!user?.id || !user?.token) {
            return undefined;
        }

        let cancelled = false;

        const loadUnreadCount = async () => {
            try {
                const response = await fetch(
                    `${API_URL}/api/notifications/user/${user.id}/unread/count`,
                    {
                        method: "GET",
                        headers: getAuthHeaders(),
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        `Failed to load unread notification count: ${response.status}`
                    );
                }

                const count = await response.json();

                if (!cancelled) {
                    setUnreadCount(
                        typeof count === "number"
                            ? count
                            : 0
                    );
                }
            } catch (error) {
                if (!cancelled) {
                    console.error(
                        "Failed to load notification count:",
                        error
                    );
                }
            }
        };

        const initialLoad = setTimeout(() => {
            loadUnreadCount();
        }, 0);

        const interval = setInterval(
            loadUnreadCount,
            30000
        );

        return () => {
            cancelled = true;
            clearTimeout(initialLoad);
            clearInterval(interval);
        };
    }, [user]);

    /*
     * =========================================================
     * LOAD NOTIFICATIONS
     * =========================================================
     */

    useEffect(() => {
        if (!open || !user?.id || !user?.token) {
            return undefined;
        }

        let cancelled = false;

        const loadNotifications = async () => {
            try {
                setLoading(true);

                const response = await fetch(
                    `${API_URL}/api/notifications/user/${user.id}`,
                    {
                        method: "GET",
                        headers: getAuthHeaders(),
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        `Failed to load notifications: ${response.status}`
                    );
                }

                const data = await response.json();

                if (!cancelled) {
                    setNotifications(
                        Array.isArray(data)
                            ? data
                            : []
                    );
                }
            } catch (error) {
                if (!cancelled) {
                    console.error(
                        "Failed to load notifications:",
                        error
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        const initialLoad = setTimeout(() => {
            loadNotifications();
        }, 0);

        return () => {
            cancelled = true;
            clearTimeout(initialLoad);
        };
    }, [open, user]);

    /*
     * =========================================================
     * MARK ONE AS READ
     * =========================================================
     */

    const markAsRead = async (notificationId) => {
        try {
            const response = await fetch(
                `${API_URL}/api/notifications/${notificationId}/read`,
{
    method: "PUT",
        headers: getAuthHeaders(),
}
);

if (!response.ok) {
    throw new Error(
        `Failed to mark notification as read: ${response.status}`
    );
}

setNotifications((current) =>
    current.map((notification) =>
        notification.id === notificationId
            ? {
                ...notification,
                read: true,
            }
            : notification
    )
);

setUnreadCount((current) =>
    Math.max(0, current - 1)
);
} catch (error) {
    console.error(
        "Failed to mark notification as read:",
        error
    );
}
};

/*
 * =========================================================
 * MARK ALL AS READ
 * =========================================================
 */

const markAllAsRead = async () => {
    if (!user?.id || unreadCount === 0) {
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/api/notifications/user/${user.id}/read-all`,
            {
                method: "PUT",
                headers: getAuthHeaders(),
            }
        );

        if (!response.ok) {
            throw new Error(
                `Failed to mark notifications as read: ${response.status}`
            );
        }

        setNotifications((current) =>
            current.map((notification) => ({
                ...notification,
                read: true,
            }))
        );

        setUnreadCount(0);
    } catch (error) {
        console.error(
            "Failed to mark all notifications as read:",
            error
        );
    }
};

/*
 * =========================================================
 * DATE FORMAT
 * =========================================================
 */

const formatDate = (dateTime) => {
    if (!dateTime) {
        return "";
    }

    const date = new Date(dateTime);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleString("en-ZA", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
};

/*
 * =========================================================
 * NOTIFICATION ICON
 * =========================================================
 */

const getNotificationIcon = (type) => {
    switch (type) {
        case "BOOKING_ACCEPTED":
            return "✓";

        case "BOOKING_DECLINED":
            return "✕";

        case "BOOKING_RESCHEDULED":
            return "↻";

        case "RESCHEDULE_ACCEPTED":
            return "✓";

        case "RESCHEDULE_DECLINED":
            return "✕";

        case "BOOKING_COMPLETED":
            return "★";

        case "BOOKING_CREATED":
            return "📋";

        default:
            return "🔔";
    }
};

/*
 * =========================================================
 * CLICK NOTIFICATION
 * =========================================================
 */

const handleNotificationClick = async (
    notification
) => {
    if (!notification.read) {
        await markAsRead(notification.id);
    }
};

/*
 * =========================================================
 * NO LOGGED-IN USER
 * =========================================================
 */

if (!user?.id || !user?.token) {
    return null;
}

/*
 * =========================================================
 * UI
 * =========================================================
 */

return (
    <div className="notification-wrapper">

        <button
            type="button"
            className="notification-button"
            onClick={() =>
                setOpen((current) => !current)
            }
            aria-label="Notifications"
            aria-expanded={open}
        >
                <span className="notification-icon">
                    🔔
                </span>

            {unreadCount > 0 && (
                <span className="notification-badge">
                        {unreadCount > 99
                            ? "99+"
                            : unreadCount}
                    </span>
            )}
        </button>

        {open && (
            <>
                <div
                    className="notification-overlay"
                    onClick={() => setOpen(false)}
                />

                <div className="notification-dropdown">

                    <div className="notification-header">

                        <div>
                            <h3>
                                Notifications
                            </h3>

                            {unreadCount > 0 && (
                                <span>
                                        {unreadCount} unread
                                    </span>
                            )}
                        </div>

                        {unreadCount > 0 && (
                            <button
                                type="button"
                                className="mark-all-button"
                                onClick={
                                    markAllAsRead
                                }
                            >
                                Mark all as read
                            </button>
                        )}

                    </div>

                    <div className="notification-list">

                        {loading ? (
                            <div className="notification-empty">
                                Loading notifications...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="notification-empty">

                                <div className="empty-icon">
                                    🔔
                                </div>

                                <strong>
                                    No notifications
                                </strong>

                                <span>
                                        You're all caught up.
                                    </span>

                            </div>
                        ) : (
                            notifications.map(
                                (notification) => (
                                    <div
                                        key={
                                            notification.id
                                        }
                                        className={`notification-item ${
                                            notification.read
                                                ? "read"
                                                : "unread"
                                        }`}
                                        onClick={() =>
                                            handleNotificationClick(
                                                notification
                                            )
                                        }
                                    >

                                        <div className="notification-item-icon">
                                            {getNotificationIcon(
                                                notification.type
                                            )}
                                        </div>

                                        <div className="notification-item-content">

                                            <p>
                                                {
                                                    notification.message
                                                }
                                            </p>

                                            <span>
                                                    {formatDate(
                                                        notification.createdAt
                                                    )}
                                                </span>

                                        </div>

                                        {!notification.read && (
                                            <span className="unread-dot" />
                                        )}

                                    </div>
                                )
                            )
                        )}

                    </div>

                    {notifications.length > 0 && (
                        <Link
                            to="/notifications"
                            className="view-all-notifications"
                            onClick={() =>
                                setOpen(false)
                            }
                        >
                            View all notifications
                        </Link>
                    )}

                </div>
            </>
        )}

    </div>
);
}

export default NotificationBell;

