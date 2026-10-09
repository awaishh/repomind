import { useState } from "react";
import { X, Loader2, LogIn, KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import { useRoomStore } from "@/store";

export default function JoinRoomModal({ isOpen, onClose, onRoomJoined }) {
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const { joinRoomByCode } = useRoomStore();

  if (!isOpen) return null;

  const handleCodeChange = (e) => {
    let val = e.target.value;
    // If user pasted a full invite URL, extract code query param
    if (val.includes("code=")) {
      try {
        const url = new URL(val);
        const extracted = url.searchParams.get("code");
        if (extracted) val = extracted;
      } catch {
        const match = val.match(/code=([A-Za-z0-9_-]+)/);
        if (match?.[1]) val = match[1];
      }
    }
    setCode(val.toUpperCase());
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      toast.error("Please enter a room invite code");
      return;
    }

    setJoining(true);
    try {
      const room = await joinRoomByCode(cleanCode);
      toast.success(`Joined #${room.name}!`);
      setCode("");
      onClose();
      if (onRoomJoined) onRoomJoined(room);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Invalid room code or failed to join"
      );
    } finally {
      setJoining(false);
    }
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

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#edf4ff] text-blue-600">
            <LogIn className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[#182133]">
              Join a Dev Room
            </h2>
            <p className="text-xs text-[#8a94a5]">
              Enter a room code or paste an invite link to join your team.
            </p>
          </div>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#687386]">
              Invite Code or Link
            </label>
            <div className="relative mt-1.5 flex items-center">
              <span className="absolute left-3.5 text-[#8a94a5]">
                <KeyRound className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={code}
                onChange={handleCodeChange}
                placeholder="e.g. RPM-9A2F4 or paste invite link"
                required
                className="w-full font-mono uppercase rounded-xl border border-[#d8e0eb] bg-white py-2.5 pl-10 pr-4 text-sm text-[#182133] placeholder-[#9aa3b2] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-[#8a94a5]">
              You can find this code in the room invite QR modal.
            </p>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#d8e0eb] bg-white px-4 py-2.5 text-xs font-semibold text-[#687386] hover:bg-[#f1f4f8] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={joining || !code.trim()}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {joining && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {joining ? "Joining…" : "Join Room"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
