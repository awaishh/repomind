import { useState } from "react";
import {
  X,
  Info,
  Users,
  Search,
  Crown,
  Shield,
  Calendar,
  Copy,
  Check,
  QrCode,
} from "lucide-react";
import toast from "react-hot-toast";
import UserAvatar from "./UserAvatar";
import { useAuthStore } from "@/store";

export default function RoomInfoModal({
  room,
  isOpen,
  onClose,
  onOpenQR,
}) {
  const [searchMember, setSearchMember] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const { user: currentUser } = useAuthStore();

  if (!isOpen || !room) return null;

  const members = room.members || [];
  const creatorId = room.creator?._id || room.creator;

  const filteredMembers = members.filter((m) => {
    const uname = m.user?.username || "";
    return uname.toLowerCase().includes(searchMember.toLowerCase().trim());
  });

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0a0a0a]/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl border border-[#e4e9f1] bg-white p-6 shadow-2xl transition-all sm:p-7 flex flex-col max-h-[85vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-[#8a94a5] hover:bg-[#f1f4f8] hover:text-[#182133] transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[#edf1f7] pb-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#edf4ff] text-blue-600">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-[#182133]">
                #{room.name}
              </h2>
              <span className="rounded-md border border-[#e4e9f1] bg-[#f8fafc] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#687386]">
                {room.code}
              </span>
            </div>
            <p className="text-xs text-[#8a94a5]">
              Room Information & Joined Members
            </p>
          </div>
        </div>

        {/* Room Details Card */}
        <div className="my-4 rounded-xl border border-[#edf1f7] bg-[#fbfdff] p-4 space-y-3">
          {room.description && (
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#8a94a5]">
                Topic / Description
              </span>
              <p className="mt-0.5 text-xs text-[#3d485b] leading-relaxed">
                {room.description}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-[#687386]">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#8a94a5]" />
              <span>
                Created {room.createdAt ? new Date(room.createdAt).toLocaleDateString() : "recently"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#8a94a5]">Code:</span>
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1 font-mono font-bold text-[#182133] hover:text-blue-600 cursor-pointer"
              >
                {room.code}
                {copiedCode ? (
                  <Check className="h-3 w-3 text-emerald-600" />
                ) : (
                  <Copy className="h-3 w-3 text-[#8a94a5]" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Members Section */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#182133]">
                Joined Members ({members.length})
              </h3>
            </div>
          </div>

          {/* Member Search */}
          {members.length > 5 && (
            <div className="relative mb-3 flex items-center">
              <Search className="absolute left-3 h-3.5 w-3.5 text-[#9aa3b2]" />
              <input
                type="text"
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
                placeholder="Search member username…"
                className="w-full rounded-xl border border-[#edf1f7] bg-[#f8fafc] py-2 pl-9 pr-3 text-xs text-[#182133] placeholder-[#9aa3b2] focus:border-blue-400 focus:bg-white focus:outline-none"
              />
            </div>
          )}

          {/* Members List Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#f4f7fb] rounded-xl border border-[#edf1f7] bg-white pr-1">
            {filteredMembers.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#8a94a5]">
                No members found matching &quot;{searchMember}&quot;
              </div>
            ) : (
              filteredMembers.map((m, idx) => {
                const memberUser = m.user || {};
                const isCreator =
                  creatorId &&
                  (creatorId === memberUser._id ||
                    (typeof creatorId === "object" &&
                      creatorId._id === memberUser._id));
                const isCurrent = currentUser?._id === memberUser._id;
                const isAdmin = m.role === "admin" || isCreator;

                return (
                  <div
                    key={memberUser._id || idx}
                    className="flex items-center justify-between p-3 hover:bg-[#fbfdff] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar
                        user={memberUser}
                        size="md"
                        showTooltip
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-xs font-semibold text-[#182133]">
                            @{memberUser.username || "Anonymous"}
                          </span>
                          {isCurrent && (
                            <span className="rounded-md bg-[#edf4ff] px-1.5 py-0.5 text-[9px] font-bold text-blue-600">
                              You
                            </span>
                          )}
                        </div>
                        <span className="block text-[10px] text-[#8a94a5]">
                          Joined{" "}
                          {m.joinedAt
                            ? new Date(m.joinedAt).toLocaleDateString()
                            : "recently"}
                        </span>
                      </div>
                    </div>

                    {/* Role Badges */}
                    <div>
                      {isCreator ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700">
                          <Crown className="h-3 w-3 text-amber-500" />
                          Creator
                        </span>
                      ) : isAdmin ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700">
                          <Shield className="h-3 w-3 text-blue-500" />
                          Admin
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#f1f4f8] px-2.5 py-0.5 text-[10px] font-medium text-[#687386]">
                          Member
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex items-center justify-between border-t border-[#edf1f7] pt-4">
          <button
            onClick={() => {
              onClose();
              if (onOpenQR) onOpenQR();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-[#edf4ff] px-3.5 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <QrCode className="h-3.5 w-3.5" />
            Invite via QR
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-[#d8e0eb] bg-white px-4 py-2 text-xs font-semibold text-[#687386] hover:bg-[#f1f4f8] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
