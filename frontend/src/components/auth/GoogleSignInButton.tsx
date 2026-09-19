'use client';

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';

export function GoogleSignInButton({ onCredential }: { onCredential: (credential: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [gisRendered, setGisRendered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<StandardResponse<{ clientId: string }>>('/auth/google/client-id')
      .then((res) => {
        if (cancelled) return;
        setClientId(res.data.data?.clientId || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '');
      })
      .catch(() => {
        if (!cancelled) setClientId(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!clientId || !scriptLoaded || !window.google || !containerRef.current) return;
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => onCredential(response.credential),
      });
      containerRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(containerRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        width: 320,
        text: 'continue_with',
      });
      setGisRendered(true);
    } catch {
      setGisRendered(false);
    }
  }, [clientId, scriptLoaded, onCredential]);

  const handleFallbackClick = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gsi = (window as unknown as { google?: { accounts?: { id?: { prompt?: () => void } } } })?.google?.accounts?.id;
    if (clientId && gsi?.prompt) {
      gsi.prompt();
    } else {
      alert('Google Sign-In is initializing. You can also sign in instantly using Mobile Number OTP or Email.');
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
      <div ref={containerRef} className={`w-full flex justify-center ${gisRendered ? 'block' : 'hidden'}`} />
      {!gisRendered && (
        <button
          type="button"
          onClick={handleFallbackClick}
          className="w-full max-w-xs flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-neutral-50 border border-neutral-300 rounded-full text-xs font-semibold text-neutral-700 shadow-2xs transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>
      )}
    </div>
  );
}
