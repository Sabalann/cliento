"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import DarkVeil from "@/app/components/DarkVeil";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading
    if (!session) {
      router.push("/auth/signin");
      return;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center">
        <div className="absolute inset-0 -z-10" style={{ width: '100%', height: '100%' }}>
          <DarkVeil />
        </div>
        <div className="text-white">Laden...</div>
      </div>
    );
  }

  if (!session) {
    return null; // Redirecting
  }

  return (
    <div className="relative min-h-screen w-full">
      <div className="absolute inset-0 -z-10" style={{ width: '100%', height: '100%' }}>
        <DarkVeil />
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}






