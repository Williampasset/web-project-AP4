import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
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
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);
  const containerId = 'qr-picking-reader';

  useEffect(() => {
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          try {
            const data: ScannedLocation = JSON.parse(decodedText);

            if (data.article !== expectedArticleRef) {
              setError(
                `❌ Mauvais article. Attendu : ${expectedArticleRef}, lu : ${data.article ?? 'inconnu'}`,
              );
              return;
            }

            setScanning(false);
            scanner.stop().catch(() => {});
            onSuccess();
          } catch {
            setError('QR code invalide ou non reconnu');
          }
        },
        () => {},
      )
      .catch(() => {
        setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
        setScanning(false);
      });

    return () => {
      scanner.stop().catch(() => {});
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
          <button className='qr-picking-close' onClick={onClose}>
            ✕
          </button>
        </div>

        <p className='qr-picking-hint'>
          Article attendu :{' '}
          <strong className='qr-picking-ref'>{expectedArticleRef}</strong>
        </p>

        <div id={containerId} className='qr-picking-reader' />

        {error && (
          <p className='qr-picking-error'>{error}</p>
        )}

        {scanning && !error && (
          <p className='qr-picking-status'>Pointez la caméra vers le QR code de l'emplacement…</p>
        )}
      </div>
    </div>
  );
}
