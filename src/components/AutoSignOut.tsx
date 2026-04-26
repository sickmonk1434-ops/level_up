"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef } from "react";

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

export function AutoSignOut() {
  const { status } = useSession();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only track inactivity if the user is currently logged in
    if (status !== "authenticated") {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const handleActivity = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      // Set new timeout for 5 minutes
      timerRef.current = setTimeout(() => {
        // Automatically sign out and redirect to home
        signOut({ callbackUrl: "/" });
      }, INACTIVITY_TIMEOUT);
    };

    // Initialize the timer as soon as the component mounts
    handleActivity();

    // Listeners for any sign of user activity
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];
    
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [status]);

  return null;
}
