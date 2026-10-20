import { useState, useEffect } from "react";
import {
  X,
  Building2,
  MessagesSquare,
  Crown,
  Shield,
  Loader2,
  Calendar,
  User as UserIcon,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import UserAvatar from "./UserAvatar";
import { useAuthStore } from "@/store";

export default function UserProfileModal({
  user,
  userId,
  isOpen,
  onClose,
}) {
  const navigate = useNavigate();
  const { user: currentUser, fetchUserProfile } = useAuthStore();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);

  const targetId = userId || user?._id || user?.id;

  useEffect(() => {
    if (!isOpen || !targetId) return;

    let isMounted = true;
    fetchUserProfile(targetId)
      .then((data) => {
        if (isMounted && data) {
          setProfileData(data);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch user profile details:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, targetId, fetchUserProfile]);

  if (!isOpen) return null;

  const isTargetMatched = profileData?.user?._id === targetId;
  const displayUser = (isTargetMatched ? profileData.user : null) || user || {};
  const joinedRooms = (isTargetMatched ? profileData.rooms : []) || [];
  const isSelf = currentUser?._id === displayUser._id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0a0a0a]/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-3xl border border-[#e4e9f1] bg-white p-6 shadow-2xl transition-all sm:p-7 flex flex-col max-h-[85vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-[#8a94a5] hover:bg-[#f1f4f8] hover:text-[#182133] transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* User Profile Header */}
        <div className="flex flex-col items-center sm:flex-row sm:items-center sm:gap-6 border-b border-[#edf1f7] pb-6 pt-2">
          <UserAvatar
            user={displayUser}
            size="2xl"
            className="ring-4 ring-blue-50 shadow-md"
          />

          <div className="mt-4 sm:mt-0 text-center sm:text-left min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-lg font-bold text-[#182133] truncate">
                {displayUser.fullName || displayUser.username || "Developer"}
              </h2>
              {isSelf && (
                <span className="rounded-full bg-[#edf4ff] px-2 py-0.5 text-[10px] font-bold text-blue-600">
                  You
                </span>
              )}
            </div>

            <p className="text-xs font-semibold text-blue-600">
              @{displayUser.username || "user"}
            </p>

            {/* Current Organization */}
            <div className="mt-2 flex items-center justify-center sm:justify-start gap-1.5 text-xs text-[#687386]">
              <Building2 className="h-3.5 w-3.5 text-[#8a94a5]" />
              <span className="font-medium">
                {displayUser.organization ? (
                  displayUser.organization
                ) : (
                  <span className="text-[#9aa3b2] italic">
                    No organization listed
                  </span>
                )}
              </span>
            </div>

            {/* Member Since */}
            {displayUser.createdAt && (
              <p className="mt-1 flex items-center justify-center sm:justify-start gap-1 text-[11px] text-[#8a94a5]">
                <Calendar className="h-3 w-3" />
                Joined {new Date(displayUser.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Bio / Description */}
        {displayUser.bio && (
          <div className="mt-4 rounded-2xl border border-[#edf1f7] bg-[#fbfdff] p-3.5">
            <p className="text-xs leading-relaxed text-[#404c60] whitespace-pre-wrap">
              {displayUser.bio}
            </p>
          </div>
        )}

        {/* Joined Chat Groups */}
        <div className="mt-5 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <MessagesSquare className="h-4 w-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#182133]">
                Joined Dev Rooms ({joinedRooms.length})
              </h3>
            </div>
            {loading && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
            )}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#f4f7fb] rounded-2xl border border-[#edf1f7] bg-white pr-1 max-h-48">
            {loading && joinedRooms.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#8a94a5] flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                Loading profile rooms…
              </div>
            ) : joinedRooms.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#8a94a5]">
                No public chat rooms joined yet.
              </div>
            ) : (
              joinedRooms.map((room) => {
                const isCreator =
                  room.creator?._id === displayUser._id ||
                  room.creator === displayUser._id;

                return (
                  <div
                    key={room._id}
                    className="flex items-center justify-between p-3 hover:bg-[#fbfdff] transition-colors"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-1.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#edf4ff] text-[10px] font-bold text-blue-600">
                          #
                        </span>
                        <span className="text-xs font-bold text-[#182133] truncate">
                          {room.name}
                        </span>
                        {isCreator ? (
                          <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.2 text-[9px] font-semibold text-amber-700">
                            <Crown className="h-2.5 w-2.5" />
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-[#f1f4f8] px-1.5 py-0.2 text-[9px] font-medium text-[#687386]">
                            <Shield className="h-2.5 w-2.5" />
                            Member
                          </span>
                        )}
                      </div>
                      <span className="mt-0.5 block font-mono text-[10px] text-[#8a94a5]">
                        {room.code}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        navigate(`/rooms/${room._id}`);
                      }}
                      className="inline-flex items-center gap-1 rounded-xl border border-[#e4e9f1] bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:border-blue-300 hover:bg-[#edf4ff] transition-colors shrink-0 cursor-pointer"
                    >
                      Join / Open
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-between border-t border-[#edf1f7] pt-4">
          {isSelf ? (
            <button
              onClick={() => {
                onClose();
                navigate("/profile");
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <UserIcon className="h-3.5 w-3.5" />
              Edit My Profile
            </button>
          ) : (
            <div className="text-[11px] text-[#8a94a5]">
              Member of RepoMind Community
            </div>
          )}

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
