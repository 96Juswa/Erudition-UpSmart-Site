import { useState, useRef, useEffect } from "react";
import { X, Check, RefreshCw, Clock } from "lucide-react";

export default function ContractESignatureModal({ contract, onClose, onSign }) {
  const [signatureData, setSignatureData] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const canvasRef = useRef(null);
  const [ctx, setCtx] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      context.strokeStyle = "#000000";
      context.lineWidth = 2;
      context.lineCap = "round";
      context.lineJoin = "round";
      setCtx(context);

      // Add watermark to canvas
      addWatermark(context, canvas);
    }
  }, []);

  const addWatermark = (context, canvas) => {
    context.save();
    context.font = "10px Arial";
    context.fillStyle = "rgba(0, 0, 0, 0.1)";
    context.textAlign = "center";

    const watermarkText = `UpSmart E-Signature • ${new Date().toLocaleString()}`;

    // Draw watermark pattern
    for (let y = 30; y < canvas.height; y += 50) {
      for (let x = 0; x < canvas.width; x += 250) {
        context.fillText(watermarkText, x + 125, y);
      }
    }

    context.restore();
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      ctx.closePath();
      // Save signature as data URL
      const dataUrl = canvasRef.current.toDataURL();
      setSignatureData(dataUrl);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Re-add watermark after clearing
    addWatermark(ctx, canvas);
    setSignatureData(null);
  };

  const handleSign = async () => {
    if (!signatureData) {
      alert("Please provide your signature first");
      return;
    }

    setIsSigning(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Call the onSign callback with signature data and timestamp
    onSign({
      contractId: contract.id,
      signatureData: signatureData,
      signedAt: new Date().toISOString(),
    });

    setIsSigning(false);
  };

  const currentDateTime = new Date().toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">
              Sign Contract Agreement
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              Contract ID: #{contract.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Contract Preview */}
          <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">
              Contract Summary
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-medium">Service:</span>{" "}
                {contract.booking?.serviceListing?.title ||
                  contract.booking?.serviceRequest?.title ||
                  "Service Agreement"}
              </p>
              <p>
                <span className="font-medium">Provider:</span>{" "}
                {contract.provider?.firstName} {contract.provider?.lastName}
              </p>
              <p>
                <span className="font-medium">Date:</span>{" "}
                {new Date(contract.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Timestamp Information */}
          <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-700 text-sm">
                  Signing Timestamp
                </p>
                <p className="text-gray-600 text-xs">{currentDateTime}</p>
              </div>
            </div>
          </div>

          {/* Signature Instructions */}
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 mb-2">
              Your Electronic Signature
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              By signing below, you agree to the terms and conditions outlined
              in this contract. Draw your signature using your mouse or
              touchpad.
            </p>
          </div>

          {/* Signature Canvas with Watermark */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white relative">
            <canvas
              ref={canvasRef}
              width={700}
              height={200}
              className="w-full cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={(e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const mouseEvent = new MouseEvent("mousedown", {
                  clientX: touch.clientX,
                  clientY: touch.clientY,
                });
                canvasRef.current.dispatchEvent(mouseEvent);
              }}
              onTouchMove={(e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const mouseEvent = new MouseEvent("mousemove", {
                  clientX: touch.clientX,
                  clientY: touch.clientY,
                });
                canvasRef.current.dispatchEvent(mouseEvent);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                const mouseEvent = new MouseEvent("mouseup", {});
                canvasRef.current.dispatchEvent(mouseEvent);
              }}
            />
            {/* Timestamp Overlay */}
            <div className="absolute bottom-2 right-2 bg-black/5 px-2 py-1 rounded text-xs text-gray-500 pointer-events-none">
              {new Date().toLocaleString()}
            </div>
          </div>

          {/* Clear Button */}
          <div className="mt-3 flex justify-end">
            <button
              onClick={clearSignature}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Clear Signature
            </button>
          </div>

          {/* Legal Notice */}
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-xs text-amber-800">
              <strong>Legal Notice:</strong> By electronically signing this
              document, you acknowledge that your electronic signature is
              legally binding and has the same effect as a handwritten
              signature. This signature will be timestamped and recorded as part
              of our contract management system. This agreement is governed by
              the Student Development Organization (SDO) guidelines.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSign}
            disabled={!signatureData || isSigning}
            className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white rounded-lg transition-all ${
              !signatureData || isSigning
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 shadow-sm hover:shadow-md"
            }`}
          >
            {isSigning ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Signing...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Sign & Accept Contract
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
