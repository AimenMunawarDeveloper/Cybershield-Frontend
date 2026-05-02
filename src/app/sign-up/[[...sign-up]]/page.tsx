import { SignUp } from "@clerk/nextjs";
import Image from "next/image";

const clerkAppearance = {
  elements: {
    rootBox: {
      width: "100%",
    },
    formButtonPrimary: {
      backgroundColor: "var(--navy-blue)",
      color: "var(--white)",
      borderRadius: "0.2rem",
      padding: "8px 4px",
      "&:hover": {},
    },
    card: {
      border: "none",
      width: "100%",
      maxWidth: "100%",
      padding: "clamp(1rem, 4vw, 2.5rem)",
      borderRadius: "0",
    },
    headerTitle: {
      textAlign: "center",
      fontSize: "20px",
      fontWeight: 600,
      color: "var(--navy-blue)",
    },
    headerSubtitle: {
      textAlign: "center",
      fontSize: "14px",
      color: "var(--dark-grey)",
    },
    formFieldInput: {
      border: "1px solid var(--navy-blue)",
      borderRadius: "5px",
      padding: "8px 8px",
      "&:focus": {
        outline: "none",
        borderColor: "var(--navy-blue)",
      },
    },
    formFieldLabel: {
      color: "var(--navy-blue)",
      fontSize: "14px",
    },
    dividerLine: {
      backgroundColor: "var(--dark-grey)",
    },
    dividerText: {
      color: "var(--dark-grey)",
      fontSize: "15px",
    },
    socialButtonsBlockButton: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "1px solid var(--navy-blue)",
      borderRadius: "5px",
      padding: "10px",
      "&:hover": {},
    },
    socialButtonsBlockButtonText: {
      color: "var(--navy-blue)",
      fontSize: "15px",
    },
  },
} as const;

export default function SignUpPage() {
  return (
    <div className="flex w-full min-h-0 flex-col overflow-x-hidden lg:min-h-[calc(100dvh-6rem)] lg:flex-row">
      <section className="flex w-full flex-col justify-center bg-[var(--white)] px-4 py-8 sm:px-6 sm:py-10 md:p-10 lg:w-1/2 lg:min-h-0 lg:flex-1 lg:justify-center">
        <h1 className="mb-5 text-center text-2xl font-bold text-[var(--navy-blue)] sm:mb-6 sm:text-3xl lg:text-left">
          Sign Up
        </h1>
        <div className="mx-auto w-full max-w-md">
          <SignUp appearance={clerkAppearance} />
        </div>
      </section>

      <section className="flex w-full flex-col items-center justify-center bg-[var(--navy-blue)] px-4 py-8 sm:py-10 lg:w-1/2 lg:min-h-0 lg:flex-1 lg:px-6 lg:py-12">
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
