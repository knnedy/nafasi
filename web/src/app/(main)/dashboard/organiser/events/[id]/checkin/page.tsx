"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Camera,
  CameraOff,
  ClipboardList,
  ScanLine,
} from "lucide-react";
import { api, APIError } from "@/lib/api";

interface CheckInResult {
  order_id: string;
  event_id: string;
  user_id: string;
  checked_in: boolean;
  message: string;
}

type ScanState =
  | { status: "idle" }
  | { status: "scanning" }
  | { status: "loading" }
  | { status: "success"; result: CheckInResult }
  | { status: "already_checked_in" }
  | { status: "error"; message: string };

const RESET_DELAY_MS = 3000;

export default function CheckInScanPage() {
  const { id: eventId } = useParams<{ id: string }>();

  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const cooldownRef = useRef(false);

  const [scanState, setScanState] = useState<ScanState>({ status: "idle" });
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [checkedInCount, setCheckedInCount] = useState(0);

  const resetToScanning = useCallback(() => {
    cooldownRef.current = false;
    setScanState({ status: "scanning" });
  }, []);

  const handleQRCode = useCallback(
    async (qrCode: string) => {
      if (cooldownRef.current) return;
      cooldownRef.current = true;

      setScanState({ status: "loading" });

      try {
        const res = await api.post("/api/v1/checkin", { qr_code: qrCode });
        const json = await res.json();
        const result: CheckInResult = json.data;

        setCheckedInCount((c) => c + 1);
        setScanState({ status: "success", result });
      } catch (err) {
        if (err instanceof APIError) {
          if (err.code === "TICKET_ALREADY_CHECKED_IN") {
            setScanState({ status: "already_checked_in" });
          } else {
            setScanState({ status: "error", message: err.message });
          }
        } else {
          setScanState({
            status: "error",
            message: "an unexpected error occurred",
          });
        }
      } finally {
        setTimeout(resetToScanning, RESET_DELAY_MS);
      }
    },
    [resetToScanning],
  );

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    if (!videoRef.current) return;

    setScanState({ status: "scanning" });

    reader
      .decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
        if (result) {
          handleQRCode(result.getText());
        }
        if (err && !(err instanceof NotFoundException)) {
          console.error("QR decode error:", err);
        }
      })
      .then((controls) => {
        controlsRef.current = controls;
      })
      .catch((err: Error) => {
        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          setCameraError(
            "Camera permission denied. Please allow camera access and reload.",
          );
        } else if (err.name === "NotFoundError") {
          setCameraError("No camera found on this device.");
        } else {
          setCameraError("Unable to start camera.");
        }
        setScanState({ status: "idle" });
      });

    return () => {
      controlsRef.current?.stop();
    };
  }, [handleQRCode]);

  const isActive =
    scanState.status === "scanning" || scanState.status === "loading";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/dashboard/organiser/events/${eventId}`}
          className="inline-flex items-center gap-2 text-white/30 hover:text-white/60 text-sm font-semibold transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to event
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-orange-400/70 text-[10px] font-black tracking-[0.3em] uppercase mb-1">
              Check-in
            </p>
            <h1 className="text-white font-black text-3xl tracking-tight">
              Scan Tickets
            </h1>
            <p className="text-white/30 text-sm mt-1">
              {checkedInCount} checked in this session
            </p>
          </div>
          <Link
            href={`/dashboard/organiser/events/${eventId}/checkin/orders`}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/4 border border-white/8 text-white/50 hover:text-white/80 hover:bg-white/6 text-sm font-bold transition-all duration-200">
            <ClipboardList className="w-4 h-4" />
            <span className="hidden sm:inline">View checked-in</span>
            <span className="sm:hidden">List</span>
          </Link>
        </div>
      </div>

      {/* Scanner */}
      <div className="relative w-full max-w-lg mx-auto">
        <div className="relative rounded-2xl overflow-hidden border border-white/8 bg-black aspect-square sm:aspect-video">
          {/* Video feed */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />

          {/* Scan overlay — only when actively scanning */}
          {isActive && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Corner brackets */}
              <div className="relative w-52 h-52 sm:w-64 sm:h-64">
                <span className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-orange-400 rounded-tl-lg" />
                <span className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-orange-400 rounded-tr-lg" />
                <span className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-orange-400 rounded-bl-lg" />
                <span className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-orange-400 rounded-br-lg" />
                {/* Scan line */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-orange-400/60 animate-pulse" />
              </div>
            </div>
          )}

          {/* Result overlay */}
          {scanState.status !== "scanning" && scanState.status !== "idle" && (
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center transition-all duration-300 ${
                scanState.status === "success"
                  ? "bg-emerald-950/90"
                  : scanState.status === "already_checked_in"
                    ? "bg-amber-950/90"
                    : scanState.status === "loading"
                      ? "bg-black/70"
                      : "bg-red-950/90"
              }`}>
              {scanState.status === "loading" && (
                <>
                  <ScanLine className="w-10 h-10 text-white/40 animate-pulse" />
                  <p className="text-white/60 text-sm font-bold">Verifying…</p>
                </>
              )}

              {scanState.status === "success" && (
                <>
                  <CheckCircle className="w-14 h-14 text-emerald-400" />
                  <p className="text-emerald-400 text-xl font-black tracking-tight">
                    Checked In
                  </p>
                  <p className="text-emerald-400/60 text-xs font-mono">
                    {scanState.result.order_id}
                  </p>
                </>
              )}

              {scanState.status === "already_checked_in" && (
                <>
                  <AlertTriangle className="w-14 h-14 text-amber-400" />
                  <p className="text-amber-400 text-xl font-black tracking-tight">
                    Already Checked In
                  </p>
                  <p className="text-amber-400/60 text-sm">
                    This ticket has already been scanned.
                  </p>
                </>
              )}

              {scanState.status === "error" && (
                <>
                  <XCircle className="w-14 h-14 text-red-400" />
                  <p className="text-red-400 text-xl font-black tracking-tight">
                    Invalid Ticket
                  </p>
                  <p className="text-red-400/60 text-sm">{scanState.message}</p>
                </>
              )}
            </div>
          )}

          {/* Camera error state */}
          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center bg-black/80">
              <CameraOff className="w-10 h-10 text-white/20" />
              <p className="text-white/40 text-sm">{cameraError}</p>
            </div>
          )}
        </div>

        {/* Status label below scanner */}
        <div className="mt-3 flex items-center justify-center gap-2">
          {isActive && !cameraError && (
            <>
              <Camera className="w-3.5 h-3.5 text-orange-400/70" />
              <p className="text-white/30 text-xs font-bold">
                Point camera at QR code
              </p>
            </>
          )}
          {scanState.status === "success" && (
            <p className="text-emerald-400/50 text-xs font-bold">
              Resuming in {RESET_DELAY_MS / 1000}s…
            </p>
          )}
          {(scanState.status === "already_checked_in" ||
            scanState.status === "error") && (
            <p className="text-white/20 text-xs font-bold">
              Resuming in {RESET_DELAY_MS / 1000}s…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
