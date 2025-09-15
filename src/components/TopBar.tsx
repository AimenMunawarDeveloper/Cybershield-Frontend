import { UserButton } from "@clerk/nextjs";

interface TopBarProps {
  userName?: string;
  title?: string;
  subtitle?: string;
}

export default function TopBar({
  userName,
  title = "Welcome to CyberShield",
  subtitle = "Your cybersecurity awareness journey starts here.",
}: TopBarProps) {
  return (
    <div className="bg-white shadow-sm border-b border-medium-grey">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Left side - Title and subtitle */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-navy-blue">
              {userName ? `${title}, ${userName}!` : title}
            </h1>
            <p className="mt-1 text-medium-grey text-sm">{subtitle}</p>
          </div>

          {/* Right side - User menu */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-neon-blue rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {userName ? userName.charAt(0).toUpperCase() : "U"}
                </span>
              </div>
              <span className="text-navy-blue font-medium hidden sm:block">
                {userName || "User"}
              </span>
            </div>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
