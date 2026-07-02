import { useState, useRef, useEffect, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { guestAPI } from '../services/api';
import { parseGuestUuid } from '../utils/qrDecoder';
import './Scanner.css';

const SCANNER_ID = 'qr-scanner-region';
const COOLDOWN_MS = 2500;

export default function Scanner() {
  const [scanStatus, setScanStatus] = useState('loading');
  const [result, setResult] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [manualUuid, setManualUuid] = useState('');
  const [showManual, setShowManual] = useState(false);

  const scannerRef = useRef(null);
  const processingRef = useRef(false);
  const lastScanRef = useRef('');
  const showManualRef = useRef(showManual);

  showManualRef.current = showManual;

  const vibrate = (pattern = 100) => {
    if (navigator.vibrate) navigator.vibrate(pattern);
  };

  const stopScanner = useCallback(async () => {
    if (!scannerRef.current) return;
    try {
      const state = scannerRef.current.getState();
      if (state === 2) {
        await scannerRef.current.stop();
      }
      scannerRef.current.clear();
    } catch {
      // Already stopped
    }
    scannerRef.current = null;
  }, []);

  const handleCheckIn = useCallback(async (uuid) => {
    if (processingRef.current || !uuid || uuid === lastScanRef.current) return;

    processingRef.current = true;
    lastScanRef.current = uuid;
    setScanStatus('processing');
    await stopScanner();

    try {
      const { data } = await guestAPI.checkIn({ uuid });
      vibrate(200);
      setResult({ type: 'success', message: data.message, guest: data.data });
    } catch (err) {
      const response = err.response?.data;
      if (response?.status === 'already_checked_in') {
        vibrate([100, 50, 100]);
        setResult({
          type: 'already_checked_in',
          message: response.message || 'Already Checked In',
          guest: response.data,
        });
      } else {
        vibrate([50, 50, 50]);
        setResult({
          type: 'invalid',
          message: response?.message || 'Invalid Guest',
        });
      }
    }

    setScanStatus('result');
    processingRef.current = false;
  }, [stopScanner]);

  const onScanSuccess = useCallback((decodedText) => {
    if (processingRef.current) return;

    const uuid = parseGuestUuid(decodedText);
    if (!uuid) {
      if (decodedText === lastScanRef.current) return;
      lastScanRef.current = decodedText;
      processingRef.current = true;
      vibrate([30, 30, 30]);
      setResult({ type: 'invalid', message: 'Invalid Guest' });
      setScanStatus('result');
      stopScanner().then(() => { processingRef.current = false; });
      return;
    }

    handleCheckIn(uuid);
  }, [handleCheckIn, stopScanner]);

  const startScanner = useCallback(async () => {
    if (showManualRef.current) return;

    setCameraError('');
    setScanStatus('loading');

    try {
      await stopScanner();

      const html5QrCode = new Html5Qrcode(SCANNER_ID);
      scannerRef.current = html5QrCode;

      const cameras = await Html5Qrcode.getCameras();
      if (!cameras.length) throw new Error('No camera found on this device');

      const backCamera = cameras.find(
        (cam) => /back|rear|environment/i.test(cam.label)
      );
      const cameraId = backCamera?.id || cameras[cameras.length - 1].id;

      await html5QrCode.start(
        cameraId,
        {
          fps: 15,
          qrbox: (w, h) => {
            const size = Math.min(w, h) * 0.72;
            return { width: size, height: size };
          },
          aspectRatio: 1,
        },
        onScanSuccess,
        () => {}
      );

      setScanStatus('scanning');
    } catch (err) {
      setCameraError(err.message || 'Unable to access camera');
      setScanStatus('error');
    }
  }, [onScanSuccess, stopScanner]);

  const resumeScanning = useCallback(async () => {
    setResult(null);
    setCameraError('');
    lastScanRef.current = '';
    processingRef.current = false;
    await startScanner();
  }, [startScanner]);

  useEffect(() => {
    if (!showManual) startScanner();
    return () => { stopScanner(); };
  }, [showManual, startScanner, stopScanner]);

  useEffect(() => {
    if (scanStatus !== 'result' || showManual) return;
    const timer = setTimeout(resumeScanning, COOLDOWN_MS);
    return () => clearTimeout(timer);
  }, [scanStatus, showManual, resumeScanning]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const uuid = parseGuestUuid(manualUuid);
    if (!uuid) {
      setResult({ type: 'invalid', message: 'Invalid Guest' });
      setScanStatus('result');
      return;
    }
    handleCheckIn(uuid);
  };

  const toggleManual = async () => {
    if (showManual) {
      setShowManual(false);
      setManualUuid('');
      setResult(null);
    } else {
      await stopScanner();
      setShowManual(true);
      setScanStatus('idle');
      setResult(null);
    }
  };

  return (
    <div className="scanner-page">
      <div className="scanner-header">
        <h1>Check-In Scanner</h1>
        <p>Point camera at guest QR code</p>
      </div>

      {!showManual && (
        <div className="scanner-viewport">
          <div id={SCANNER_ID} className="scanner-region" />

          {scanStatus === 'loading' && (
            <div className="scanner-overlay">
              <div className="scanner-spinner" />
              <p>Starting camera…</p>
            </div>
          )}

          {scanStatus === 'processing' && (
            <div className="scanner-overlay">
              <div className="scanner-spinner" />
              <p>Verifying guest…</p>
            </div>
          )}

          {scanStatus === 'scanning' && (
            <div className="scan-frame-hint">Align QR code within the frame</div>
          )}

          {scanStatus === 'error' && (
            <div className="scanner-overlay error">
              <p>{cameraError}</p>
              <button type="button" onClick={startScanner} className="btn btn-primary">
                Retry Camera
              </button>
            </div>
          )}
        </div>
      )}

      {result && (
        <div className={`scan-result scan-result--${result.type}`}>
          <div className="scan-result-icon">
            {result.type === 'success' && '✓'}
            {result.type === 'already_checked_in' && '!'}
            {result.type === 'invalid' && '✕'}
          </div>
          <h2>{result.message}</h2>
          {result.guest && (
            <div className="scan-result-guest">
              <p className="guest-name">{result.guest.full_name}</p>
              {result.guest.organization && (
                <p className="guest-org">{result.guest.organization}</p>
              )}
            </div>
          )}
          {scanStatus === 'result' && !showManual && (
            <p className="scan-resume-hint">Scanning again in a moment…</p>
          )}
          <button
            type="button"
            className="btn btn-secondary scan-next-btn"
            onClick={showManual ? () => { setResult(null); setScanStatus('idle'); } : resumeScanning}
          >
            Scan Next
          </button>
        </div>
      )}

      <div className="scanner-actions">
        <button
          type="button"
          className={`btn ${showManual ? 'btn-primary' : 'btn-secondary'}`}
          onClick={toggleManual}
        >
          {showManual ? 'Use Camera' : 'Manual Entry'}
        </button>
      </div>

      {showManual && (
        <form className="manual-form" onSubmit={handleManualSubmit}>
          <input
            type="text"
            value={manualUuid}
            onChange={(e) => setManualUuid(e.target.value)}
            placeholder="Paste Guest UUID or QR data"
            autoComplete="off"
            autoFocus
          />
          <button type="submit" className="btn btn-primary">Check In</button>
        </form>
      )}
    </div>
  );
}
