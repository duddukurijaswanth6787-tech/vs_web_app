'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, RefreshCw, AlertCircle, CheckCircle2, SwitchCamera } from 'lucide-react';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export default function CameraScannerModal({
  isOpen,
  onClose,
  onScan,
}: CameraScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [scannedFeedback, setScannedFeedback] = useState<string | null>(null);

  // Initialize and enumerate cameras
  useEffect(() => {
    if (!isOpen) return;

    let activeStream: MediaStream | null = null;
    let scanInterval: any = null;

    const startCamera = async (deviceId?: string) => {
      try {
        setLoading(true);
        setError('');

        if (activeStream) {
          activeStream.getTracks().forEach((track) => track.stop());
        }

        const constraints: MediaStreamConstraints = {
          video: deviceId
            ? { deviceId: { exact: deviceId } }
            : { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        activeStream = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Enumerate devices once stream starts
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = allDevices.filter((d) => d.kind === 'videoinput');
        setDevices(videoInputs);
        if (!selectedDeviceId && videoInputs.length > 0) {
          setSelectedDeviceId(videoInputs[0].deviceId);
        }

        setLoading(false);

        // Check for BarcodeDetector API
        if ('BarcodeDetector' in window) {
          // @ts-ignore
          const detector = new (window as any).BarcodeDetector({
            formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'qr_code', 'upc_a', 'upc_e'],
          });

          scanInterval = setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
              try {
                const barcodes = await detector.detect(videoRef.current);
                if (barcodes.length > 0) {
                  const rawValue = barcodes[0].rawValue;
                  if (rawValue && rawValue.trim()) {
                    setScannedFeedback(rawValue);
                    // Play scanner beep
                    try {
                      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                      const osc = ctx.createOscillator();
                      osc.type = 'sine';
                      osc.frequency.setValueAtTime(800, ctx.currentTime);
                      osc.connect(ctx.destination);
                      osc.start();
                      osc.stop(ctx.currentTime + 0.1);
                    } catch {}

                    onScan(rawValue.trim());
                    setTimeout(() => {
                      onClose();
                    }, 400);
                  }
                }
              } catch (detectErr) {
                // frame processing error
              }
            }
          }, 200);
        } else {
          setError('Live barcode detection is best supported on Google Chrome / MS Edge.');
        }
      } catch (err: any) {
        setLoading(false);
        setError(err?.message || 'Could not access web camera. Please check browser permissions.');
      }
    };

    startCamera(selectedDeviceId);

    return () => {
      if (scanInterval) clearInterval(scanInterval);
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, selectedDeviceId, onClose, onScan]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-sky-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Desktop Camera Barcode Scanner</h3>
              <p className="text-[10px] text-neutral-400">Hold product barcode steadily in front of the lens</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera Viewfinder */}
        <div className="relative bg-black h-72 sm:h-80 flex items-center justify-center overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-2 z-10 bg-black/50">
              <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
              <span className="text-xs font-semibold">Starting camera feed...</span>
            </div>
          )}

          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Scanner Overlay Box & Laser Reticle */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-64 h-44 border-2 border-dashed border-sky-400/80 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
              {/* Corner Indicators */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-sky-400 rounded-tl-sm" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-sky-400 rounded-tr-sm" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-sky-400 rounded-bl-sm" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-sky-400 rounded-br-sm" />

              {/* Animated Laser Line */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent absolute top-1/2 -translate-y-1/2 shadow-[0_0_8px_#34d399] animate-pulse" />
            </div>
          </div>

          {/* Scanned Success Feedback Pill */}
          {scannedFeedback && (
            <div className="absolute bottom-4 bg-emerald-600 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg animate-bounce">
              <CheckCircle2 className="w-4 h-4" /> Scanned: {scannedFeedback}
            </div>
          )}
        </div>

        {/* Footer Controls & Camera Switcher */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          {devices.length > 1 ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <SwitchCamera className="w-4 h-4 text-neutral-500 shrink-0" />
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="bg-white border border-neutral-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              >
                {devices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Camera ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <span className="text-2xs font-semibold text-neutral-500">
              💡 Tip: You can also use a handheld USB laser barcode scanner anytime.
            </span>
          )}

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            Close Scanner
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 bg-amber-50 border-t border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
