import { type Metadata } from 'next'
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import Link from 'next/link'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'CyberShield - Cybersecurity Awareness Platform',
  description: 'Comprehensive cybersecurity training and phishing simulation platform for educational institutions and individuals',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <header className="flex justify-between items-center my-4 px-4 gap-4 h-16">
            <div className="flex items-center">
             <img src="/images/CyberShield_logo_Final-removebg.png" alt="CyberShield Logo" className="h-20 w-full object-contain" />
            </div>
            <div className="flex items-center gap-4">
              <SignedOut>
                <Link 
                  href="/sign-in"
                  className="text-gray-700 hover:text-gray-900 font-medium"
                >
                  Sign In
                </Link>
                <Link 
                  href="/sign-up"
                  className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer flex items-center hover:bg-[#5a3dd9] transition-colors"
                >
                  Sign Up
                </Link>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}