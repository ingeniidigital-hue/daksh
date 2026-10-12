"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Auth() {
  const router = useRouter();

  useEffect(() => {
    // Seamless routing to AI LiveOps workspace without account barriers
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center font-sans text-gray-500">
      <div className="flex items-center space-x-2 text-sm">
        <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
        <span>Entering Daksh LiveOps...</span>
      </div>
    </div>
  );
}
