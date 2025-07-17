import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { fetchProductByBarcode, OFFProduct } from '../utils/openFoodFacts';

type BarcodeDetectorResult = { rawValue: string };
type BarcodeDetectorClass = new (options?: { formats?: string[] }) => {
  detect(video: HTMLVideoElement): Promise<BarcodeDetectorResult[]>;
};

interface QRScannerProps {
  onResult: (product: OFFProduct) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onResult, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState('');
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const frameRef = useRef<number>();

  useEffect(() => {
    const start = async () => {
      const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorClass }).BarcodeDetector;
      const constraints = { video: { facingMode: 'environment' } };
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
        }

        if (Detector) {
          const detector = new Detector({ formats: ['ean_13', 'qr_code'] });
          const scan = async () => {
            if (!videoRef.current) return;
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const code = barcodes[0].rawValue;
                const product = await fetchProductByBarcode(code);
                if (product) {
                  onResult(product);
                  onClose();
                } else {
                  setError('Produit introuvable');
                }
              }
            } catch {
              /* ignore */
            }
            frameRef.current = requestAnimationFrame(scan);
          };
          frameRef.current = requestAnimationFrame(scan);
        } else {
          const reader = new BrowserMultiFormatReader();
          readerRef.current = reader;
          reader.decodeFromVideoDevice(undefined, videoRef.current!, async result => {
            if (result) {
              const product = await fetchProductByBarcode(result.getText());
              if (product) {
                onResult(product);
                onClose();
              } else {
                setError('Produit introuvable');
              }
            }
          });
        }
      } catch {
        setError("Impossible d'accéder à la caméra");
      }
    };
    start();
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      readerRef.current?.reset();
    };
  }, [onResult, onClose]);

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdrop}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl p-4 space-y-4 w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">Scanner un code-barres</h3>
          <button onClick={onClose} className="text-sm text-gray-500">Fermer</button>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="relative">
          <video ref={videoRef} className="w-full rounded" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-4 border-blue-500 w-40 h-40 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
