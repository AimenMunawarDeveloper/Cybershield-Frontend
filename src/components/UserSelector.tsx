"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Check, Users, ChevronDown } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface User {
  _id: string;
  email: string;
  displayName: string;
}

interface UserSelectorProps {
  selectedUsers: User[];
  onUsersChange: (users: User[]) => void;
  allUsers: User[];
  isLoading?: boolean;
  disabled?: boolean;
}

export default function UserSelector({
  selectedUsers,
  onUsersChange,
  allUsers,
  isLoading = false,
  disabled = false,
}: UserSelectorProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter users based on search query
  const filteredUsers = allUsers.filter(
    (user) =>
      user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleUser = (user: User) => {
    const isSelected = selectedUsers.some((u) => u._id === user._id);
    if (isSelected) {
      onUsersChange(selectedUsers.filter((u) => u._id !== user._id));
    } else {
      onUsersChange([...selectedUsers, user]);
    }
  };

  const removeUser = (userId: string) => {
    onUsersChange(selectedUsers.filter((u) => u._id !== userId));
  };

  const isUserSelected = (userId: string) => {
    return selectedUsers.some((u) => u._id === userId);
  };

  // Generate comma-separated email string
  const getEmailString = () => {
    return selectedUsers.map((u) => u.email).join(", ");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Users Display */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full min-h-[60px] px-3 py-2 bg-[var(--dashboard-card-bg)] dark:bg-[var(--navy-blue-lighter)] border border-[var(--dashboard-card-border)] dark:border-[var(--medium-grey)] rounded-lg cursor-pointer ${
          disabled ? "opacity-50 cursor-not-allowed" : "hover:border-[var(--neon-blue)]"
        } focus-within:border-[var(--neon-blue)] focus-within:outline-none transition-colors`}
      >
        {selectedUsers.length === 0 ? (
          <div className="flex items-center gap-2 text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">
            <Users className="w-4 h-4" />
            <span>{t("Select users...")}</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map((user) => (
              <div
                key={user._id}
                className="flex items-center gap-1 px-2 py-1 bg-[var(--neon-blue)]/20 border border-[var(--neon-blue)]/50 rounded-md text-sm"
              >
                <div className="flex flex-col">
                  <span className="text-[var(--neon-blue)] dark:text-white font-medium text-xs">
                    {user.displayName || user.email}
                  </span>
                  <span className="text-[var(--dashboard-text-secondary)] dark:text-[var(--light-blue)] text-xs">
                    {user.email}
                  </span>
                </div>
                {!disabled && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeUser(user._id);
                    }}
                    className="ml-1 hover:bg-[var(--neon-blue)]/30 rounded p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {!disabled && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <ChevronDown
              className={`w-4 h-4 text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        )}
      </div>

      {/* Hidden input for form submission (comma-separated emails) */}
      <input
        type="hidden"
        value={getEmailString()}
        readOnly
      />

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-[var(--navy-blue-light)] border border-gray-200 dark:border-[var(--medium-grey)] rounded-lg shadow-xl max-h-80 overflow-hidden flex flex-col">
          {/* Search Bar */}
          <div className="p-3 border-b border-gray-200 dark:border-[var(--medium-grey)]/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("Search users...")}
                className="w-full pl-10 pr-3 py-2 bg-white dark:bg-[var(--navy-blue-lighter)] border border-gray-300 dark:border-[var(--medium-grey)] rounded-lg text-[var(--dashboard-text-primary)] dark:text-white placeholder-[var(--dashboard-text-secondary)] dark:placeholder-[var(--medium-grey)] focus:border-[var(--neon-blue)] focus:outline-none text-sm"
                autoFocus
              />
            </div>
          </div>

          {/* User List */}
          <div className="overflow-y-auto max-h-60">
            {isLoading ? (
              <div className="p-4 text-center text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] text-sm">
                {t("Loading users...")}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] text-sm">
                {searchQuery
                  ? t("No users found matching your search")
                  : t("No users available")}
              </div>
            ) : (
              <div className="p-2">
                {filteredUsers.map((user) => {
                  const isSelected = isUserSelected(user._id);
                  return (
                    <div
                      key={user._id}
                      onClick={() => toggleUser(user)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-[var(--neon-blue)]/20 border border-[var(--neon-blue)]/50"
                          : "hover:bg-gray-100 dark:hover:bg-[var(--navy-blue-lighter)]"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? "bg-[var(--neon-blue)] border-[var(--neon-blue)]"
                            : "border-gray-300 dark:border-[var(--medium-grey)]"
                        }`}
                      >
                        {isSelected && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[var(--dashboard-text-primary)] dark:text-white font-medium text-sm truncate">
                          {user.displayName || user.email}
                        </div>
                        <div className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] text-xs truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Done Button */}
          <div className="p-3 border-t border-gray-200 dark:border-[var(--medium-grey)]/30">
            <button
              onClick={() => {
                setIsOpen(false);
                setSearchQuery("");
              }}
              className="w-full px-4 py-2 bg-[var(--neon-blue)] text-white rounded-lg hover:bg-[var(--medium-blue)] dark:hover:bg-[var(--neon-blue)]/80 transition-colors text-sm font-semibold"
            >
              {t("Done")}
            </button>
          </div>
        </div>
      )}

      {/* Helper Text */}
      <p className="text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] mt-1">
        💡 {t("Click to select multiple users. Selected emails will be comma-separated.")}
      </p>
    </div>
  );
}
