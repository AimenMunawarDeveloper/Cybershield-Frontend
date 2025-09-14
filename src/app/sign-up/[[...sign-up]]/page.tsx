import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Join CyberShield
          </h1>
          <p className="text-gray-600">
            Create your account to start your cybersecurity journey
          </p>
        </div>
        <SignUp 
          appearance={{
            elements: {
              formButtonPrimary: 
                "bg-[#6c47ff] hover:bg-[#5a3dd9] text-white",
              card: "shadow-lg border border-gray-200",
              headerTitle: "text-gray-900",
              headerSubtitle: "text-gray-600",
            }
          }}
        />
      </div>
    </div>
  );
}
