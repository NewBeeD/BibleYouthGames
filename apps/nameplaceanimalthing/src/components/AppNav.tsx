"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Bible Timeline", href: "/bibletimeline" },
  { label: "Name Place Animal Thing", href: "/nameplaceanimalthing" },
];

export function AppNav() {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="app-nav app-nav-fixed">
        <div className="app-nav__bar">
          <a className="app-nav__brand" href="/nameplaceanimalthing">
            Name Place Animal Thing
          </a>

          <nav className="app-nav__links" aria-label="Primary">
            {navItems.map((item) => (
              <a
                key={item.href}
                className={`app-nav__link${item.href === "/nameplaceanimalthing" ? " app-nav__link--active" : ""}`}
                href={item.href}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <button
            type="button"
            className="app-nav__menu-button"
            aria-expanded={isDrawerOpen}
            aria-controls="mobile-navigation-drawer"
            aria-label="Open navigation menu"
            onClick={() => setIsDrawerOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <div
        className={`app-drawer-backdrop${isDrawerOpen ? " app-drawer-backdrop--open" : ""}`}
        onClick={() => setIsDrawerOpen(false)}
        aria-hidden={!isDrawerOpen}
      />

      <aside
        id="mobile-navigation-drawer"
        className={`app-drawer${isDrawerOpen ? " app-drawer--open" : ""}`}
        aria-hidden={!isDrawerOpen}
      >
        <div className="app-drawer__header">
          <span className="app-drawer__title">Navigate</span>
          <button
            type="button"
            className="app-drawer__close"
            aria-label="Close navigation menu"
            onClick={() => setIsDrawerOpen(false)}
          >
            ×
          </button>
        </div>

        <nav className="app-drawer__links" aria-label="Mobile primary">
          {navItems.map((item) => (
            <a
              key={item.href}
              className={`app-drawer__link${item.href === "/nameplaceanimalthing" ? " app-drawer__link--active" : ""}`}
              href={item.href}
              onClick={() => setIsDrawerOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>
    </>
  );
}