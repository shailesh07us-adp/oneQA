"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";

interface NavigationContextType {
  navigatingTo: string | null;
  setNavigatingTo: (href: string | null) => void;
  isNavigating: boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Reset navigating state when pathname changes (navigation complete)
    setNavigatingTo(null);
  }, [pathname]);

  return (
    <NavigationContext.Provider 
      value={{ 
        navigatingTo, 
        setNavigatingTo,
        isNavigating: !!navigatingTo
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}
