"use client";

import { HiOutlineBell } from "react-icons/hi";

const Topbar = () => {
  return (
    <header
      className="
        h-14 px-6 flex items-center justify-between
        bg-white border-b border-black/10
        sticky top-0 z-30
      "
    >
      <div className="flex items-center gap-3">
        <h1 className="font-bold text-lg">Admin Panel</h1>
      </div>

      <div className="flex items-center gap-4">
        <button type="button" className="text-xl text-gray-600 hover:text-black">
          <HiOutlineBell />
        </button>

        {/* <a
          href="https://getmaterials.netlify.app"
          target="_blank"
          className="text-sm font-semibold text-[var(--primary)]"
        >
          View Site
        </a> */}

        <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold">
          A
        </div>
      </div>
    </header>
  );
};

export default Topbar;
