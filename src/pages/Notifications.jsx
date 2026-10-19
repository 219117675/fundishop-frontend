import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../api";
import "./Notifications.css";

function getStoredUser() {
    const storedUser =
        localStorage.getItem("fundiShopUser");

    if (!storedUser) {
        return null;
    }

    try {
        return JSON.parse(storedUser);
    } catch (error) {
        console.error(
            "Unable to read stored user:",
            error
        );

        return null;
    }
}

function Notifications() {
    const navigate = useNavigate();

    const [user] = useState(getStoredUser);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const loadNotifications = async () => {
            if (!user?.id || !user?.token) {
                if (!cancelled) {
                    setError(
                        "Please log in to view your notifications."
                    );

                    setLoading(false);
                }

                return;
            }

            try {
                if (!cancelled) {
                    setLoading(true);
                    setError("");
                }

                const response = await fetch(
                    `${API_URL}/api/notifications/user/${user.id}`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${user.token}`,
                        },
                    }
                );

                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error(
                            "Your login session has expired. Please log in again."
                        );
                    }

                    if (response.status === 403) {
                        throw new Error(
                            "You are not authorised to view these notifications."
                        );
                    }

                    throw new Error(
                        `Failed to load notifications. Status: ${response.status}`
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

                    setError(
                        error instanceof Error
                            ? error.message
                            : "Failed to load notifications."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        const timer = setTimeout(() => {
            loadNotifications();
        }, 0);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [user]);

    const getAuthHeaders = () => {
        if (!user?.token) {
            return {
                "Content-Type": "application/json",
            };
        }

        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
        };
    };

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
                    "Failed to mark notification as read."
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

        } catch (error) {
            console.error(
                "Failed to mark notification as read:",
                error
            );
        }
    };

    const markAllAsRead = async () => {
        if (!user?.id) {
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
                    "Failed to mark notifications as read."
                );
            }

            setNotifications((current) =>
                current.map((notification) => ({
                    ...notification,
                    read: true,
                }))
            );

        } catch (error) {
            console.error(
                "Failed to mark all notifications as read:",
                error
            );
        }
    };

    const deleteNotification = async (
        notificationId
    ) => {
        try {
            const response = await fetch(
                `${API_URL}/api/notifications/${notificationId}`,
                {
                    method: "DELETE",
                    headers: getAuthHeaders(),
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Failed to delete notification."
                );
            }

            setNotifications((current) =>
                current.filter(
                    (notification) =>
                        notification.id !== notificationId
                )
            );

        } catch (error) {
            console.error(
                "Failed to delete notification:",
                error
            );
        }
    };

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
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case "BOOKING_CREATED":
                return "📋";

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

            default:
                return "🔔";
        }
    };

    if (!user?.id || !user?.token) {
        return (
            <div className="notifications-page">
                <div className="notifications-container">

                    <div className="notifications-error">
                        Please log in to view your notifications.
                    </div>

                    <button
                        type="button"
                        className="notifications-back-button"
                        onClick={() => navigate("/login")}
                    >
                        Go to Login
                    </button>

                </div>
            </div>
        );
    }

    return (
        <div className="notifications-page">

            <div className="notifications-container">

                <div className="notifications-topbar">

                    <button
                        type="button"
                        className="notifications-back-button"
                        onClick={() => navigate(-1)}
                    >
                        ← Back
                    </button>

                    <div>
                        <h1>Notifications</h1>

                        <p>
                            Stay up to date with your FundiShop activity.
                        </p>
                    </div>

                </div>

                {error && (
                    <div className="notifications-error">
                        {error}
                    </div>
                )}

                {!error &&
                    notifications.length > 0 && (
                        <div className="notifications-actions">

                            <button
                                type="button"
                                onClick={markAllAsRead}
                                className="mark-all-page-button"
                            >
                                Mark all as read
                            </button>

                        </div>
                    )}

                {loading ? (
                    <div className="notifications-empty">

                        <div className="notifications-loading-icon">
                            🔔
                        </div>

                        <h2>
                            Loading notifications...
                        </h2>

                    </div>

                ) : !error &&
                notifications.length === 0 ? (

                    <div className="notifications-empty">

                        <div className="notifications-empty-icon">
                            🔔
                        </div>

                        <h2>
                            No notifications
                        </h2>

                        <p>
                            You're all caught up.
                        </p>

                    </div>

                ) : (
                    !error && (
                        <div className="notifications-list">

                            {notifications.map(
                                (notification) => (
                                    <div
                                        key={notification.id}
                                        className={`notification-card ${
                                            notification.read
                                                ? "notification-card-read"
                                                : "notification-card-unread"
                                        }`}
                                    >

                                        <div className="notification-card-icon">
                                            {getNotificationIcon(
                                                notification.type
                                            )}
                                        </div>

                                        <div className="notification-card-content">

                                            <div className="notification-card-heading">

                                                <h3>
                                                    {
                                                        notification.message
                                                    }
                                                </h3>

                                                {!notification.read && (
                                                    <span className="notification-new-badge">
                                                        NEW
                                                    </span>
                                                )}

                                            </div>

                                            <p className="notification-card-type">
                                                {notification.type
                                                    ?.replaceAll(
                                                        "_",
                                                        " "
                                                    )
                                                    .toLowerCase()
                                                    .replace(
                                                        /\b\w/g,
                                                        (letter) =>
                                                            letter.toUpperCase()
                                                    )}
                                            </p>

                                            <span className="notification-card-date">
                                                {formatDate(
                                                    notification.createdAt
                                                )}
                                            </span>

                                        </div>

                                        <div className="notification-card-actions">

                                            {!notification.read && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        markAsRead(
                                                            notification.id
                                                        )
                                                    }
                                                >
                                                    Mark as read
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                className="delete-notification-button"
                                                onClick={() =>
                                                    deleteNotification(
                                                        notification.id
                                                    )
                                                }
                                            >
                                                Delete
                                            </button>

                                        </div>

                                    </div>
                                )
                            )}

                        </div>
                    )
                )}

            </div>

        </div>
    );
}

export default Notifications;