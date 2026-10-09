import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, Download, X, QrCode, Share2 } from "lucide-react";
import toast from "react-hot-toast";

export default function QRCodeModal({ room, isOpen, onClose }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const qrRef = useRef(null);

  if (!isOpen || !room) return null;

  const joinUrl = `${window.location.origin}/rooms/join?code=${room.code}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopiedLink(true);
      toast.success("Invite link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopiedCode(true);
      toast.success("Room code copied!");
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      toast.error("Failed to copy code");
    }
  };

  const handleDownloadQR = () => {
    const svgElement = qrRef.current?.querySelector("svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 400, 400);
      ctx.drawImage(img, 40, 40, 320, 320);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `repomind-room-${room.code}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success("QR code downloaded!");
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0a0a0a]/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-2xl border border-[#e4e9f1] bg-white p-6 shadow-2xl transition-all sm:p-7">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-[#8a94a5] hover:bg-[#f1f4f8] hover:text-[#182133] transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf4ff] text-blue-600">
            <QrCode className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[#182133]">
            Invite to #{room.name}
          </h2>
          <p className="mt-1 text-xs text-[#8a94a5]">
            Teammates can scan this QR code or use the invite code to join immediately.
          </p>
        </div>

        {/* QR Code Container */}
        <div
          ref={qrRef}
          className="my-6 flex flex-col items-center justify-center rounded-xl border border-[#edf1f7] bg-[#f9fbfe] p-6 shadow-inner"
        >
          <div className="rounded-xl bg-white p-4 shadow-sm border border-[#e4e9f1]">
            <QRCodeSVG
              value={joinUrl}
              size={180}
              level="M"
              includeMargin={false}
              fgColor="#182133"
              bgColor="#ffffff"
            />
          </div>
          <span className="mt-3 text-[11px] font-medium text-[#8a94a5] flex items-center gap-1.5">
            <Share2 className="h-3 w-3 text-blue-600" />
            Scan with any phone camera or barcode app
          </span>
        </div>

        {/* Room Code Quick Box */}
        <div className="mb-4 flex items-center justify-between rounded-xl border border-[#e4e9f1] bg-[#fafbfd] px-4 py-3">
          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#8a94a5]">
              Room Code
            </span>
            <span className="font-mono text-base font-bold tracking-wide text-[#182133]">
              {room.code}
            </span>
          </div>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 rounded-lg border border-[#d8e0eb] bg-white px-3 py-1.5 text-xs font-semibold text-[#182133] hover:bg-[#f1f4f8] transition-colors cursor-pointer"
          >
            {copiedCode ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-600">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-[#687386]" />
                Copy Code
              </>
            )}
          </button>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="h-4 w-4" />
                Link Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Invite Link
              </>
            )}
          </button>
          <button
            onClick={handleDownloadQR}
            className="flex items-center justify-center gap-2 rounded-xl border border-[#e4e9f1] bg-white px-4 py-2.5 text-xs font-semibold text-[#182133] hover:bg-[#f1f4f8] transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4 text-[#687386]" />
            Download PNG
          </button>
        </div>
      </div>
    </div>
  );
}
