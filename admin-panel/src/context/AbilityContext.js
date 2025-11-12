"use client";

import { defineAbilityFor } from "@/lib/rbac";
import { createContext, useMemo } from "react";

export const AbilityContext = createContext(null);

export const AbilityProvider = ({ role, children }) => {
    const ability = useMemo(() => defineAbilityFor(role), [role]);
    return <AbilityContext.Provider value={ability}>{children}</AbilityContext.Provider>;
};