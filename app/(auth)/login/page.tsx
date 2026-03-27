/**
 * Login Page - Server Component
 * Renders the OTP-based login flow (redirects to request page)
 */

import RequestOtpClient from "../request/RequestOtpClient";

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectTo = params.redirect || "/";

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Base gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100"></div>
      
      {/* Layered radial gradients for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-100/40 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-100/30 via-transparent to-transparent"></div>
      
      {/* Floating orbs with sophisticated blur */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-emerald-200/60 to-emerald-300/40 rounded-full mix-blend-multiply filter blur-[120px] opacity-30 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-blue-200/50 to-slate-200/40 rounded-full mix-blend-multiply filter blur-[100px] opacity-25 animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-gradient-to-br from-emerald-100/30 to-transparent rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
      
      {/* Subtle noise texture overlay (illusion via gradient) */}
      <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]"></div>
      
      {/* Content container with elevated z-index */}
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-900 bg-clip-text text-transparent mb-3 sm:mb-4">
            MannarCraft
          </h1>
          <p className="text-base sm:text-lg text-slate-600 font-medium">
            Welcome back
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Sign in to continue to your account
          </p>
        </div>

        <RequestOtpClient purpose="login" redirectTo={redirectTo} />
      </div>
    </div>
  );
}
