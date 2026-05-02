"use client";

import { MessageSquare } from "lucide-react";
import { useState } from "react";

export default function FloatingChat() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom,0px))] right-4 z-50 sm:bottom-6 sm:right-6">
      <button
        type="button"
        className={`group relative flex h-14 w-14 items-center justify-center rounded-full bg-[var(--dark-blue)] text-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl ${
          isHovered ? "scale-110 shadow-xl" : ""
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => {
          // Add chat functionality here
          console.log("Chat clicked");
        }}
      >
        <MessageSquare className="w-6 h-6" />

        {/* Tooltip */}
        <div className="absolute right-full mr-3 px-3 py-2 bg-[var(--navy-blue-light)] text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          Chat Support
          <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-[var(--navy-blue-light)] border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
        </div>
      </button>
    </div>
  );
}
