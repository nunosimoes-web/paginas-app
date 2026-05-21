import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Wrappers cientes do locale para Link / redirect / router.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
