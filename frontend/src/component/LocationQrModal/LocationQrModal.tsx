import { QRCodeSVG } from 'qrcode.react';
import type { DisplayLocation } from '../types';

interface LocationQrModalProps {
  location: DisplayLocation | null;
  onClose: () => void;
}

export default function LocationQrModal({
  location,
  onClose,
}: LocationQrModalProps) {
  if (!location) return null;

  const code = `${location.building}${location.aisle}S${location.shelf}C${location.cell}`;
  const articleLabel = location.articles[0]?.label ?? 'Emplacement vide';
  const qrValue = JSON.stringify({
    id: location.id,
    code,
    zone: location.zone,
    article: location.articles[0]?.reference ?? null,
  });

  return (
    <div className='qr-modal-overlay' onClick={onClose}>
      <div className='qr-modal' onClick={(e) => e.stopPropagation()}>
        <div className='qr-modal__header'>
          <h3 className='qr-modal__title'>QR Code — {code}</h3>
          <button className='qr-modal__close' onClick={onClose}>
            ✕
          </button>
        </div>
        <p className='qr-modal__sub'>
          <span className={`zone-badge zone-badge--${location.zone.toLowerCase()}`}>
            {location.zone}
          </span>
          {articleLabel}
        </p>
        <div className='qr-modal__canvas'>
          <QRCodeSVG value={qrValue} size={220} level='M' includeMargin />
        </div>
        <p className='qr-modal__hint'>
          Scannez ce code pour identifier l'emplacement
        </p>
      </div>
    </div>
  );
}
