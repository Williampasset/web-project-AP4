import { useEffect, useMemo, useRef, useState } from 'react';
import './QrPickingScanner.css';

interface ScannedLocation {
  id: number;
  code: string;
  zone: string;
  article: string | null;
}

interface QrPickingScannerProps {
  expectedArticleRef: string;
  onSuccess: () => void;
  onClose: () => void;
}

export default function QrPickingScanner({
  expectedArticleRef,
  onSuccess,
  onClose,
}: QrPickingScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const barcodeDetectorRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);
  const [loadingCamera, setLoadingCamera] = useState(true);

  const expectedCode = useMemo(() => expectedArticleRef.trim(), [expectedArticleRef]);

  useEffect(() => {
    if (!window.isSecureContext) {
      setError(
        "La caméra nécessite HTTPS sur Android. Ouvre l'app via l'URL sécurisée affichée par Vite.",
      );
      setLoadingCamera(false);
      setScanning(false);
      return;
    }

    let cancelled = false;

    const detector = 'BarcodeDetector' in window ? new (window as any).BarcodeDetector({ formats: ['qr_code'] }) : null;

    barcodeDetectorRef.current = detector;

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
          setError(
            "Votre navigateur peut afficher la caméra mais ne prend pas en charge le scan QR natif. Sur Android Chrome récent, mettez à jour le navigateur.",
          );
          return;
        }

        const scanFrame = async () => {
          if (cancelled || !videoRef.current) return;

          try {
                const codes = await detector.detect(videoRef.current);

            if (codes.length > 0) {
              const raw = codes[0].rawValue;

              try {
                const data: ScannedLocation = JSON.parse(raw);

                if (data.article !== expectedCode) {
                  setError(
                    `❌ Mauvais article. Attendu : ${expectedCode}, lu : ${data.article ?? 'inconnu'}`,
                  );
                  return;
                }

                setScanning(false);
                onSuccess();
                return;
              } catch {
                setError('QR code invalide ou non reconnu');
              }
            }
          } catch (scanError) {
            setError(
              `Erreur pendant le scan QR (${scanError instanceof Error ? scanError.message : 'inconnue'})`,
            );
          }

          scanTimerRef.current = window.setTimeout(scanFrame, 250);
        };

        scanTimerRef.current = window.setTimeout(scanFrame, 250);
      } catch (cameraError) {
        setError(
          `Impossible d'accéder à la caméra. Vérifiez les permissions (${cameraError instanceof Error ? cameraError.message : 'erreur inconnue'}).`,
        );
        setLoadingCamera(false);
        setScanning(false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className='qr-picking-overlay' onClick={onClose}>
      <div
        className='qr-picking-modal'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='qr-picking-header'>
          <h3 className='qr-picking-title'>Scanner l'emplacement</h3>
          <button type='button' className='qr-picking-close' onClick={onClose}>
            ✕
          </button>
        </div>

        <p className='qr-picking-hint'>
          Article attendu :{' '}
          <strong className='qr-picking-ref'>{expectedCode}</strong>
        </p>

        <div className='qr-picking-reader'>
          <video
            ref={videoRef}
            className='qr-picking-video'
            playsInline
            muted
            autoPlay
          />
          {loadingCamera && (
            <p className='qr-picking-loading'>Activation de la caméra…</p>
          )}
        </div>

        {error && <p className='qr-picking-error'>{error}</p>}

        {scanning && !error && !loadingCamera && (
          <p className='qr-picking-status'>
            Pointez la caméra vers le QR code de l'emplacement…
          </p>
        )}
      </div>
    </div>
  );
}
