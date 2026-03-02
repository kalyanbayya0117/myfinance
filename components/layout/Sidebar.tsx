"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HiOutlineHome,
  HiOutlineDocumentText,
  HiOutlineUsers,
  // HiOutlineCash,
  // HiOutlineChartBar,
  HiOutlineCog,
} from "react-icons/hi";

const links = [
  { name: "Dashboard", href: "/", icon: HiOutlineHome },
  { name: "Loans", href: "/loans", icon: HiOutlineDocumentText },
  { name: "Clients", href: "/clients", icon: HiOutlineUsers },
  // { name: "Payments", href: "/payments", icon: HiOutlineCash },
  // { name: "Reports", href: "/reports", icon: HiOutlineChartBar },
  { name: "Settings", href: "/settings", icon: HiOutlineCog },
];

interface Props {
  onClose: () => void;
}

const Sidebar = ({ onClose }: Props) => {
  const pathname = usePathname();

  return (
    <>
      <aside
        className={`
          hidden md:block fixed inset-y-0 left-0 z-40
          w-64 h-screen bg-white border-r border-black/10 overflow-hidden
        `}
      >
        <div className="px-5 py-5 border-black/10">
          <div className="inline-flex items-center gap-3 rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 px-3 py-2">
            <div className="h-9 w-9 rounded-lg bg-[var(--primary)] text-white inline-flex items-center justify-center text-sm font-extrabold tracking-wide">
              KP
            </div>

            <div className="leading-tight">
              <p className="text-[0.95rem] font-extrabold text-[var(--primary)]">Kalyan</p>
              <p className="text-[0.75rem] font-semibold uppercase tracking-wide text-black/70">Pawn Brokers</p>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 px-3">
          {links.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-4 py-2 rounded-lg
                  font-semibold text-sm transition
                  ${
                    active
                      ? "bg-[var(--primary)] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }
                `}
              >
                <Icon className="text-lg" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-black/10 bg-white px-2 py-1">
        <div className="grid grid-cols-4 gap-1">
          {links.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center justify-center gap-1 rounded-lg py-2 text-[11px] font-semibold"
              >
                <Icon
                  className={`text-lg ${
                    active ? "text-[var(--primary)]" : "text-gray-500"
                  }`}
                />
                <span
                  className={`${
                    active ? "text-[var(--primary)]" : "text-gray-600"
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
