import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  QrCode,
  Users,
  Loader2,
  ArrowRight,
  KeyRound,
  ShieldCheck,
  Hash,
} from "lucide-react";
import toast from "react-hot-toast";
import { useRoomStore, useAuthStore } from "@/store";
import UserAvatar from "@/components/rooms/UserAvatar";

export default function JoinRoomPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { fetchRoomPreview, joinRoomByCode } = useRoomStore();

  const codeFromUrl = searchParams.get("code")?.trim().toUpperCase() || "";
  const [code, setCode] = useState(codeFromUrl);
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(Boolean(codeFromUrl));
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!codeFromUrl) return;

    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) {
        setLoadingPreview(true);
        setError(null);
      }
    });

    fetchRoomPreview(codeFromUrl)
      .then((data) => {
        if (isMounted) {
          setPreview(data);
          setLoadingPreview(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(
            err.response?.data?.message || "Invalid or expired room code"
          );
          setLoadingPreview(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [codeFromUrl, fetchRoomPreview]);

  const handleJoin = async (e) => {
    e?.preventDefault();
    const cleanCode = (preview ? preview.code : code).trim().toUpperCase();
    if (!cleanCode) {
      toast.error("Please enter a valid room code");
      return;
    }

    setJoining(true);
    try {
      const room = await joinRoomByCode(cleanCode);
      toast.success(`Welcome to #${room.name}!`);
      navigate(`/rooms/${room._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to join room");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-[#182133] flex flex-col font-sans">
      {/* Top Header */}
      <header className="fixed left-0 right-0 top-0 z-40 h-16 border-b border-[#e4e9f1] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="brand-wordmark text-[#182133] hover:opacity-80 transition-opacity cursor-pointer"
          >
            RepoMind
          </button>
          <div className="flex items-center gap-2">
            <UserAvatar user={user} size="sm" />
            <span className="text-xs font-medium text-[#687386] hidden sm:block">
              {user?.username}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-6 pt-24 pb-16">
        <div className="w-full max-w-lg">
          {/* Card */}
          <div className="rounded-3xl border border-[#e4e9f1] bg-white p-8 sm:p-10 shadow-[0_12px_40px_rgba(24,33,51,0.06)] text-center">
            {/* Header Icon */}
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf4ff] text-blue-600 shadow-sm">
              <QrCode className="h-7 w-7" />
            </div>

            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
              Dev Rooms Invitation
            </p>
            <h1 className="mt-1 font-sketch text-4xl font-bold tracking-tight text-[#182133]">
              Join the Conversation
            </h1>

            {loadingPreview ? (
              <div className="my-10 flex flex-col items-center justify-center py-8">
                <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
                <p className="mt-3 text-xs text-[#8a94a5]">
                  Verifying room invitation…
                </p>
              </div>
            ) : error ? (
              <div className="my-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-left">
                <p className="text-xs font-semibold text-red-600">
                  Invitation Error
                </p>
                <p className="mt-1 text-xs text-red-500">{error}</p>
                <div className="mt-4">
                  <button
                    onClick={() => navigate("/rooms")}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Go to Rooms directory
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : preview ? (
              /* Preview of the room scanned from QR Code */
              <div className="my-8 rounded-2xl border border-[#e4e9f1] bg-[#f9fbfe] p-6 text-left">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-blue-600 font-medium">
                      <Hash className="h-4 w-4" />
                      <span className="text-lg font-bold text-[#182133]">
                        {preview.name}
                      </span>
                    </div>
                    {preview.description && (
                      <p className="mt-1.5 text-xs text-[#687386] leading-relaxed">
                        {preview.description}
                      </p>
                    )}
                  </div>
                  <span className="rounded-full bg-white border border-[#e4e9f1] px-3 py-1 font-mono text-xs font-semibold text-[#182133] shrink-0">
                    {preview.code}
                  </span>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[#edf1f7] pt-4 text-xs text-[#8a94a5]">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-[#687386]" />
                    <span>
                      {preview.memberCount} member
                      {preview.memberCount === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UserAvatar user={preview.creator} size="xs" />
                    <span>
                      Created by{" "}
                      <strong className="text-[#182133]">
                        @{preview.creator?.username}
                      </strong>
                    </span>
                  </div>
                </div>

                {preview.isMember ? (
                  <div className="mt-6 flex flex-col items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                      <ShieldCheck className="h-4 w-4" />
                      You are already a member of this room
                    </div>
                    <button
                      onClick={() => navigate(`/rooms/${preview._id}`)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      Open Room Chat
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleJoin}
                    disabled={joining}
                    className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {joining && <Loader2 className="h-4 w-4 animate-spin" />}
                    {joining ? "Joining Room…" : `Join #${preview.name}`}
                    {!joining && <ArrowRight className="h-4 w-4" />}
                  </button>
                )}
              </div>
            ) : (
              /* If no code was provided in URL, manual entry form */
              <form onSubmit={handleJoin} className="my-8 text-left space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#687386]">
                    Enter Room Invite Code
                  </label>
                  <div className="relative mt-2 flex items-center">
                    <span className="absolute left-3.5 text-[#8a94a5]">
                      <KeyRound className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="e.g. RPM-9A2F4"
                      className="w-full font-mono uppercase rounded-xl border border-[#d8e0eb] bg-white py-3 pl-10 pr-4 text-sm text-[#182133] placeholder-[#9aa3b2] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={joining || !code.trim()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {joining && <Loader2 className="h-4 w-4 animate-spin" />}
                  {joining ? "Joining…" : "Join Room"}
                  {!joining && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>
            )}

            <div className="border-t border-[#edf1f7] pt-5 text-center">
              <button
                onClick={() => navigate("/rooms")}
                className="text-xs font-semibold text-[#687386] hover:text-[#182133] transition-colors cursor-pointer"
              >
                Back to all Dev Rooms
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
