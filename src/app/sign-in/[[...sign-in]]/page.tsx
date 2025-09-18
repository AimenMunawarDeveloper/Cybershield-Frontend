import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="block lg:flex lg:h-screen w-full">

      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 bg-[var(--white)] p-8 ">
        <h1 className="text-3xl font-bold mb-6 text-[var(--navy-blue)]">Login</h1>
        <SignIn
          appearance={{
            elements: {
              formButtonPrimary: {
                backgroundColor: "var(--navy-blue)",
                color: "var(--white)",
                borderRadius: "0.2rem",
                padding: "8px 4px",
                "&:hover": {

                },
              },
              card: {
                border: "none",
                padding: "40px",
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
                "&:hover": {

                },
              },
              socialButtonsBlockButtonText: {
                color: "var(--navy-blue)",
                fontSize: "15px",
              },
            },
          }}
        />


      </div>

      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 bg-[var(--navy-blue)] relative">
        <img src="/images/Signup_illustrator.png" alt='Signup illustrator' />

      </div>
    </div>
  );
}
