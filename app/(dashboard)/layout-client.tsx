"use client";

import useAuth from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoggedIn, isHydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, isHydrated, router]);

  if (!isHydrated) {
    return null;
  }

  if (!isLoggedIn) {
    return null;
  }

  return <>{children}</>;
}
