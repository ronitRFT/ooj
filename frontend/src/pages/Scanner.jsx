import { useState, useRef, useEffect, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { adminAPI } from '../services/api';
import { parseGuestUuid } from '../utils/qrDecoder';
import './Scanner.css';

const SCANNER_ID = 'qr-scanner-region';

function pickDefaultCamera(cameras) {
  if (!cameras.length) return null;

  const backCamera = cameras.find(
    (cam) => /back|rear|environment|traseira|trás/i.test(cam.label),
  );
  if (backCamera) return backCamera.id;

  if (cameras.length > 1) {
    return cameras[cameras.length - 1].id;
  }

  return cameras[0].id;
}

function formatCameraLabel(camera, index) {
  if (camera.label && camera.label.trim()) return camera.label;
  return `Camera ${index + 1}`;
}

export default function Scanner({ embedded = false }) {
  const isSecureContext = window.isSecureContext;
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  const [scanStatus, setScanStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [manualUuid, setManualUuid] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [scannerRunning, setScannerRunning] = useState(false);

  const scannerRef = useRef(null);
  const processingRef = useRef(false);
  const lastScanRef = useRef('');
  const showManualRef = useRef(showManual);
  const selectedCameraRef = useRef(selectedCameraId);

  showManualRef.current = showManual;
  selectedCameraRef.current = selectedCameraId;

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
    setScannerRunning(false);
  }, []);

  const loadCameras = useCallback(async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      setCameras(devices);
      if (devices.length && !selectedCameraRef.current) {
        setSelectedCameraId(pickDefaultCamera(devices));
      }
      return devices;
    } catch {
      setCameras([]);
      return [];
    }
  }, []);

  const handleCheckIn = useCallback(async (uuid) => {
    if (processingRef.current || !uuid || uuid === lastScanRef.current) return;

    processingRef.current = true;
    lastScanRef.current = uuid;
    setScanStatus('processing');
    await stopScanner();

    try {
      const { data } = await adminAPI.checkIn({ uuid });
      vibrate(200);
      setResult({ type: 'success', message: data.message, guest: data.data?.guest });
    } catch (err) {
      const response = err.response?.data;
      const checkInStatus = response?.data?.status;
      if (checkInStatus === 'already_checked_in') {
        vibrate([100, 50, 100]);
        setResult({
          type: 'already_checked_in',
          message: response.message || 'Already Checked In',
          guest: response.data?.guest,
        });
      } else if (checkInStatus === 'expired_event') {
        vibrate([50, 50, 50]);
        setResult({
          type: 'invalid',
          message: response.message || 'This guest is not registered for the current active event',
        });
      } else if (checkInStatus === 'invalid_guest' || err.response?.status === 404) {
        vibrate([50, 50, 50]);
        setResult({
          type: 'invalid',
          message: response?.message || 'Guest not found',
        });
      } else {
        vibrate([50, 50, 50]);
        setResult({
          type: 'invalid',
          message: response?.message || 'Check-in failed. Please try again.',
        });
      }
    }

    setScanStatus('result');
    processingRef.current = false;
  }, [stopScanner]);

  const showInvalidFormat = useCallback(async () => {
    processingRef.current = true;
    vibrate([30, 30, 30]);
    setResult({ type: 'invalid', message: 'Invalid QR code format' });
    setScanStatus('result');
    await stopScanner();
    processingRef.current = false;
  }, [stopScanner]);

  const onScanSuccess = useCallback((decodedText) => {
    if (processingRef.current) return;

    const uuid = parseGuestUuid(decodedText);
    if (!uuid) {
      if (decodedText === lastScanRef.current) return;
      lastScanRef.current = decodedText;
      showInvalidFormat();
      return;
    }

    handleCheckIn(uuid);
  }, [handleCheckIn, showInvalidFormat]);

  const startScanner = useCallback(async (cameraIdOverride) => {
    if (showManualRef.current) return;

    if (!isSecureContext) {
      setCameraError('Camera requires HTTPS in production');
      setScanStatus('error');
      return;
    }

    setCameraError('');
    setScanStatus('loading');

    try {
      await stopScanner();

      const devices = cameras.length ? cameras : await loadCameras();
      if (!devices.length) {
        throw new Error('No camera found on this device');
      }

      const cameraId = cameraIdOverride
        || selectedCameraRef.current
        || pickDefaultCamera(devices);

      if (!cameraId) {
        throw new Error('No camera selected');
      }

      setSelectedCameraId(cameraId);

      const html5QrCode = new Html5Qrcode(SCANNER_ID);
      scannerRef.current = html5QrCode;

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
        () => {},
      );

      setScannerRunning(true);
      setScanStatus('scanning');
    } catch (err) {
      setCameraError(err.message || 'Unable to access camera');
      setScanStatus('error');
      setScannerRunning(false);
    }
  }, [cameras, isSecureContext, loadCameras, onScanSuccess, stopScanner]);

  const handleStopCamera = useCallback(async () => {
    await stopScanner();
    setScanStatus('idle');
  }, [stopScanner]);

  const resumeScanning = useCallback(async () => {
    setResult(null);
    setCameraError('');
    lastScanRef.current = '';
    processingRef.current = false;
    await startScanner();
  }, [startScanner]);

  useEffect(() => {
    loadCameras();
    return () => { stopScanner(); };
  }, [loadCameras, stopScanner]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const uuid = parseGuestUuid(manualUuid);
    if (!uuid) {
      setResult({ type: 'invalid', message: 'Invalid QR code format' });
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
      setScanStatus('idle');
    } else {
      await stopScanner();
      setShowManual(true);
      setScanStatus('idle');
      setResult(null);
    }
  };

  const handleCameraChange = async (e) => {
    const nextCameraId = e.target.value;
    setSelectedCameraId(nextCameraId);
    if (scannerRunning) {
      await startScanner(nextCameraId);
    }
  };

  const cameraLabelsMissing = cameras.length > 0 && cameras.every((cam) => !cam.label?.trim());

  return (
    <div className={`scanner-page${embedded ? ' scanner-page--embedded' : ''}`}>
      {!embedded && (
        <div className="scanner-header">
          <h1>Check-In Scanner</h1>
          <p>Point camera at guest QR code</p>
        </div>
      )}

      {!isSecureContext && (
        <div className="scanner-secure-warning" role="alert">
          Camera requires HTTPS in production
        </div>
      )}

      {!showManual && (
        <>
          {cameras.length > 0 && (
            <div className="scanner-camera-select">
              <label htmlFor="camera-select">Camera</label>
              <select
                id="camera-select"
                value={selectedCameraId}
                onChange={handleCameraChange}
                disabled={scanStatus === 'loading' || scanStatus === 'processing'}
              >
                {!selectedCameraId && <option value="">Select a camera</option>}
                {cameras.map((camera, index) => (
                  <option key={camera.id} value={camera.id}>
                    {formatCameraLabel(camera, index)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(isSafari || cameraLabelsMissing) && (
            <p className="scanner-permission-hint">
              Allow camera access when prompted. On Safari, enable camera permission for this site
              in Settings → Safari → Camera, then tap Start Camera again.
            </p>
          )}

          <div className="scanner-viewport">
            <div id={SCANNER_ID} className="scanner-region" />

            {scanStatus === 'idle' && !scannerRunning && (
              <div className="scanner-overlay">
                <p>Tap Start Camera to begin scanning</p>
              </div>
            )}

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
                <button type="button" onClick={() => startScanner()} className="btn btn-primary">
                  Retry Camera
                </button>
              </div>
            )}
          </div>

          <div className="scanner-camera-controls">
            {!scannerRunning && scanStatus !== 'processing' && scanStatus !== 'result' && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => startScanner()}
                disabled={!isSecureContext}
              >
                Start Camera
              </button>
            )}
            {scannerRunning && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleStopCamera}
              >
                Stop Camera
              </button>
            )}
          </div>
        </>
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
          {!showManual ? (
            <button
              type="button"
              className="btn btn-secondary scan-next-btn"
              onClick={resumeScanning}
            >
              Scan Next
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-secondary scan-next-btn"
              onClick={() => { setResult(null); setScanStatus('idle'); setManualUuid(''); }}
            >
              Try Again
            </button>
          )}
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
