import type { ReactNode } from "react";
import SiteNav from "./SiteNav";

type PageLayoutProps = {
  children: ReactNode;
  brand?: string;
  action?: ReactNode;
};

export default function PageLayout({
  children,
  brand = "Cahier",
  action,
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-surface-container-lowest">
      <SiteNav brand={brand} action={action} />
      {/* Account for fixed navbar: 64px on desktop + padding, 80px on mobile */}
      <main className="pt-20 pb-24 md:pt-20 md:pb-0">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
