import { useEffect, useRef, useState } from 'react';
import './QrLocationScanner.css';

interface QrLocationScannerProps {
  expectedCode: string;
  title: string;
  hint: string;
  onSuccess: () => void;
  onClose: () => void;
}

type ScannedPayload = {
  code?: string;
};

export default function QrLocationScanner({
  expectedCode,
  title,
  hint,
  onSuccess,
  onClose,
}: QrLocationScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const [loadingCamera, setLoadingCamera] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!window.isSecureContext) {
      setError('La caméra nécessite HTTPS sur mobile.');
      setLoadingCamera(false);
      return;
    }

    let cancelled = false;
    const detector =
      'BarcodeDetector' in window
        ? new (window as any).BarcodeDetector({ formats: ['qr_code'] })
        : null;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setLoadingCamera(false);

        if (!detector) {
          setError('Votre navigateur ne supporte pas le scan QR natif.');
          return;
        }

        const scanFrame = async () => {
          if (cancelled || !videoRef.current) return;

          try {
            const codes = await detector.detect(videoRef.current);

            if (codes.length > 0) {
              const rawValue: string = String(codes[0].rawValue ?? '').trim();
              let scannedCode = rawValue;

              try {
                const parsed = JSON.parse(rawValue) as ScannedPayload;
                scannedCode = String(parsed?.code ?? '').trim();
              } catch {
                // QR non JSON: on garde la valeur brute
              }

              if (scannedCode !== expectedCode) {
                setError(`QR incorrect. Attendu: ${expectedCode}, lu: ${scannedCode || 'vide'}`);
              } else {
                onSuccess();
                return;
              }
            }
          } catch (e) {
            setError(
              `Erreur de scan (${e instanceof Error ? e.message : 'inconnue'})`,
            );
          }

          scanTimerRef.current = window.setTimeout(scanFrame, 250);
        };

        scanTimerRef.current = window.setTimeout(scanFrame, 250);
      } catch (e) {
        setError(
          `Impossible d'accéder à la caméra (${e instanceof Error ? e.message : 'erreur inconnue'}).`,
        );
        setLoadingCamera(false);
      }
    };

    startCamera();

    return () => {
      cancelled = true;

      if (scanTimerRef.current) {
        window.clearTimeout(scanTimerRef.current);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [expectedCode, onSuccess]);

  return (
    <div className='qr-location-overlay' onClick={onClose}>
      <div className='qr-location-modal' onClick={(e) => e.stopPropagation()}>
        <div className='qr-location-header'>
          <h3 className='qr-location-title'>{title}</h3>
          <button type='button' className='qr-location-close' onClick={onClose}>
            ✕
          </button>
        </div>

        <p className='qr-location-hint'>
          {hint} <strong>{expectedCode}</strong>
        </p>

        <div className='qr-location-reader'>
          <video
            ref={videoRef}
            className='qr-location-video'
            playsInline
            muted
            autoPlay
          />
          {loadingCamera && (
            <p className='qr-location-loading'>Activation de la caméra…</p>
          )}
        </div>

        {error && <p className='qr-location-error'>{error}</p>}
      </div>
    </div>
  );
}
