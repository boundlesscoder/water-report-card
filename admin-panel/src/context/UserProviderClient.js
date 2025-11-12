"use client";
import { useEffect } from "react";
import { UserProvider } from "./UserContext";

export function UserProviderClient({ user, children }) {
    useEffect(() => {
        if (user) {
            localStorage.setItem(
                "user",
                JSON.stringify({
                    ...user,
                    tokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                })
            );
            localStorage.setItem("authToken", user.token || "");
        }
    }, [user]);

    return <UserProvider>{children}</UserProvider>;
}