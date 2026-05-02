import { SignUp } from "@clerk/nextjs";
import Image from "next/image";

/** Brand navy — do not use `var(--navy-blue)` here; in `.light` it maps to a pale dashboard bg. */
const AUTH_NAVY = "#0f1a2a";

const clerkAppearance = {
  variables: {
    colorPrimary: AUTH_NAVY,
    colorText: "#111827",
    colorTextSecondary: "#4b5563",
    colorBackground: "transparent",
    colorInputBackground: "#ffffff",
    colorInputText: "#111827",
  },
  elements: {
    rootBox: {
      width: "100%",
      boxShadow: "none",
      border: "none",
      backgroundColor: "transparent",
    },
    cardBox: {
      boxShadow: "none",
      border: "none",
      backgroundColor: "transparent",
    },
    scrollBox: {
      boxShadow: "none",
      border: "none",
    },
    main: {
      boxShadow: "none",
      border: "none",
      backgroundColor: "transparent",
    },
    formButtonPrimary: {
      backgroundColor: AUTH_NAVY,
      color: "#ffffff",
      borderRadius: "0.2rem",
      padding: "8px 4px",
      fontWeight: 600,
      "&:hover": {
        backgroundColor: "#1a2a3f",
      },
    },
    card: {
      border: "none",
      width: "100%",
      maxWidth: "100%",
      padding: "clamp(1rem, 4vw, 2.5rem)",
      borderRadius: "0",
      backgroundColor: "transparent",
      boxShadow: "none",
    },
    headerTitle: {
      textAlign: "center",
      fontSize: "20px",
      fontWeight: 600,
      color: AUTH_NAVY,
    },
    headerSubtitle: {
      textAlign: "center",
      fontSize: "14px",
      color: "#4b5563",
    },
    formFieldInput: {
      border: `1px solid ${AUTH_NAVY}`,
      borderRadius: "5px",
      padding: "8px 8px",
      color: "#111827",
      backgroundColor: "#ffffff",
      "&:focus": {
        outline: "none",
        borderColor: AUTH_NAVY,
      },
    },
    formFieldLabel: {
      color: AUTH_NAVY,
      fontSize: "14px",
    },
    dividerLine: {
      backgroundColor: "#d1d5db",
    },
    dividerText: {
      color: "#6b7280",
      fontSize: "15px",
    },
    socialButtonsBlockButton: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: `1px solid ${AUTH_NAVY}`,
      borderRadius: "5px",
      padding: "10px",
      backgroundColor: "#ffffff",
      "&:hover": {
        backgroundColor: "#f8fafc",
      },
    },
    socialButtonsBlockButtonText: {
      color: AUTH_NAVY,
      fontSize: "15px",
    },
    footerActionLink: {
      color: AUTH_NAVY,
      fontWeight: 500,
    },
    identityPreviewText: {
      color: "#111827",
    },
    formFieldHintText: {
      color: "#6b7280",
    },
    formFieldErrorText: {
      color: "#b91c1c",
    },
  },
} as const;

export default function SignUpPage() {
  return (
    <div className="flex w-full min-h-0 flex-col overflow-x-hidden lg:min-h-[calc(100dvh-6rem)] lg:flex-row">
      <section className="flex w-full flex-col justify-center bg-[var(--white)] px-4 py-8 sm:px-6 sm:py-10 md:p-10 lg:w-1/2 lg:min-h-0 lg:flex-1 lg:justify-center">
        <h1 className="mb-5 text-center text-2xl font-bold text-[#0f1a2a] sm:mb-6 sm:text-3xl lg:text-left">
          Sign Up
        </h1>
        <div className="auth-clerk-form mx-auto w-full max-w-md">
          <SignUp appearance={clerkAppearance} />
        </div>
      </section>

      <section className="flex w-full flex-col items-center justify-center bg-[#0f1a2a] px-4 py-8 sm:py-10 lg:w-1/2 lg:min-h-0 lg:flex-1 lg:px-6 lg:py-12">
        <Image
          src="/images/Signup_illustrator.png"
          alt="Signup illustrator"
          width={800}
          height={800}
          priority
          sizes="(max-width: 1024px) 90vw, 45vw"
          className="h-auto w-full max-w-[min(100%,24rem)] object-contain sm:max-w-md lg:max-w-lg xl:max-w-xl"
        />
      </section>
    </div>
  );
}
