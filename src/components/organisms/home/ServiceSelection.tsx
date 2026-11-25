"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type ServiceSelection = { selected: number; select: (index: number) => void };

const Context = createContext<ServiceSelection>({ selected: 0, select: () => {} });

// Shared between the problems section ("Ver cómo funciona") and the services selector.
export function ServiceSelectionProvider({ children }: { children: ReactNode }) {
  const [selected, select] = useState(0);
  return <Context value={{ selected, select }}>{children}</Context>;
}

export const useServiceSelection = () => useContext(Context);
