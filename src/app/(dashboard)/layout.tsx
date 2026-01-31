"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { VoiceButton } from "@/components/voice/voice-button";
import { CurrencyCalculator } from "@/components/currency-calculator";
import { Loader2 } from "lucide-react";

function DashboardLayoutContent({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="md:pl-64">
        <div className="p-4 md:p-8">{children}</div>
      </main>
      <VoiceButton />
      <CurrencyCalculator />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </AuthProvider>
  );
}
