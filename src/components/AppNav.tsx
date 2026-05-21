"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { SignOutButton } from "./SignOutButton";

type Item = { href: string; key: string };

export function AppNav({ isTherapist }: { isTherapist: boolean }) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const items: Item[] = [
    { href: "/today", key: "today" },
    { href: "/checkin", key: "checkin" },
    { href: "/journal", key: "journal" },
    { href: "/journey", key: "journey" },
    ...(isTherapist ? [{ href: "/therapist", key: "therapist" }] : []),
    { href: "/settings", key: "settings" },
  ];

  return (
    <header className="border-b border-line bg-surface/80 backdrop-blur">
      <nav
        aria-label="Principal"
        className="mx-auto flex w-full max-w-2xl flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3"
      >
        <Link
          href="/today"
          className="font-serif text-lg font-medium text-accent-strong"
        >
          Páginas
        </Link>
        <ul className="flex flex-1 flex-wrap items-center gap-x-3.5 gap-y-1 text-sm">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "font-medium text-ink underline decoration-accent decoration-2 underline-offset-8"
                      : "text-muted transition hover:text-ink"
                  }
                >
                  {t(item.key)}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-3 text-sm">
          <LocaleSwitcher />
          <SignOutButton className="text-muted underline-offset-4 hover:text-ink hover:underline" />
        </div>
      </nav>
    </header>
  );
}
