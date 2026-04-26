"use client";

import { signIn, signOut } from "next-auth/react";
import { LogIn, LogOut } from "lucide-react";

export function AuthButtons({ session }: { session?: any }) {
  if (session) {
    return (
      <button 
        onClick={() => signOut()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1.25rem',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '0.5rem',
          fontWeight: 600,
          transition: 'background 0.2s'
        }}
        onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
        onMouseOut={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
      >
        <LogOut size={18} />
        Sign Out
      </button>
    );
  }

  return (
    <button 
      onClick={() => signIn("google")}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.875rem 1.5rem',
        background: 'white',
        color: 'black',
        borderRadius: '0.5rem',
        fontWeight: 600,
        fontSize: '1rem',
        transition: 'transform 0.2s',
        boxShadow: '0 4px 14px 0 rgba(255,255,255,0.2)'
      }}
      onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseOut={e => e.currentTarget.style.transform = 'none'}
    >
      <LogIn size={20} />
      Continue with Google
    </button>
  );
}
