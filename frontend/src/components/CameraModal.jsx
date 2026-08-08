import { useState, useRef, useEffect, useCallback } from 'react';
import { HiOutlineXMark, HiOutlineCamera, HiOutlineArrowPath } from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function CameraModal({ onClose, onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
 const [capturedImage, setCapturedImage] = useState(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setError(null);
    setCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Kamera ochilmadi. Iltimos ruxsat bering yoki boshqa qurilmani tanlang.');
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageDataUrl);
  };

  const confirmCapture = () => {
    if (!capturedImage) return;
    onCapture(capturedImage);
    stopCamera();
    onClose();
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <HiOutlineCamera className="w-5 h-5" />
            Kamera
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Camera view */}
        <div className="relative bg-black aspect-video">
          {!capturedImage ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!cameraReady && !error && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full" />
                </div>
              )}
              {error && (
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <p className="text-white text-center text-sm">{error}</p>
                </div>
              )}
            </>
          ) : (
            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 p-4">
          {!capturedImage ? (
            <>
              <button
                onClick={switchCamera}
                className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Kamerani almashtirish"
              >
                <HiOutlineArrowPath className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              <button
                onClick={capturePhoto}
                disabled={!cameraReady}
                className="w-16 h-16 rounded-full bg-white border-4 border-indigo-500 flex items-center justify-center hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50 shadow-lg"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-500" />
              </button>
              <div className="w-11" />
            </>
          ) : (
            <>
              <button
                onClick={retakePhoto}
                className="flex-1 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Qyla olish
              </button>
              <button
                onClick={confirmCapture}
                className="flex-1 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
              >
                Tasdiqlash
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
