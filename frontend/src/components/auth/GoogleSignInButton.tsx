'use client';

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';

export function GoogleSignInButton({ onCredential }: { onCredential: (credential: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Fetched at runtime (rather than baked in at build time via
    // NEXT_PUBLIC_GOOGLE_CLIENT_ID) so an admin can change it from
    // Admin > Access > Login Sessions without a frontend redeploy. Falls
    // back to the build-time env var if the admin hasn't set one.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, scriptLoaded]);

  if (clientId === '') return null;

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
      <div ref={containerRef} className="flex justify-center" />
    </>
  );
}
