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
        <div className="p-6 font-extrabold text-[1.2rem] text-[var(--primary)] flex items-center justify-between">
          <span>
            My<span className="text-black"> Finance</span>
          </span>
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
