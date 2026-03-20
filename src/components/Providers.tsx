"use client";

import { SessionProvider } from "next-auth/react";
import { NavigationProvider } from "./NavigationProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NavigationProvider>{children}</NavigationProvider>
    </SessionProvider>
  );
}
