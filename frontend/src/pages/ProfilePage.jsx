import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Loader2,
  Save,
  Building2,
  User as UserIcon,
  Mail,
  FileText,
  MessagesSquare,
  ArrowRight,
  Shield,
  Crown,
  Hash,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import AppSidebar from "@/components/AppSidebar";
import UserAvatar from "@/components/rooms/UserAvatar";
import { useAuthStore, useRepoStore, useRoomStore } from "@/store";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateProfile, updateAvatar } = useAuthStore();
  const { repos, fetchRepos } = useRepoStore();
  const { rooms, fetchRooms } = useRoomStore();

  const fileInputRef = useRef(null);

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [username, setUsername] = useState(user?.username || "");
  const [organization, setOrganization] = useState(user?.organization || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    fetchRepos();
    fetchRooms();
  }, [fetchRepos, fetchRooms]);

  const [prevUserId, setPrevUserId] = useState(user?._id);
  if (user && user._id !== prevUserId) {
    setPrevUserId(user._id);
    setFullName(user.fullName || "");
    setUsername(user.username || "");
    setOrganization(user.organization || "");
    setBio(user.bio || "");
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WEBP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    setIsUploadingPhoto(true);
    try {
      await updateAvatar(formData);
      toast.success("Profile picture updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload photo");
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Username cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        username: username.trim(),
        organization: organization.trim(),
        bio: bio.trim(),
      });
      toast.success("Profile saved successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="app-page min-h-screen bg-[#f6f8fb] font-sans text-[#182133] flex flex-col">
      {/* ── Top Header ─────────────────────────────────────────── */}
      <header className="fixed left-0 right-0 top-0 z-40 h-16 border-b border-[#e4e9f1] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="brand-wordmark text-[#182133] hover:opacity-80 transition-opacity cursor-pointer"
          >
            RepoMind
          </button>
          <div className="flex items-center gap-2">
            <UserAvatar user={user} size="sm" />
            <span className="hidden text-xs font-medium text-[#687386] sm:block">
              {user?.username}
            </span>
          </div>
        </div>
      </header>

      {/* ── Sidebar & Content ──────────────────────────────────── */}
      <div className="mx-auto flex w-full max-w-[1440px] flex-1 pt-16">
        <AppSidebar active="profile" repos={repos} navigate={navigate} />

        <main className="mx-auto max-w-4xl flex-1 px-6 pb-20 pt-8 md:ml-64 md:pl-10">
          <div className="mb-8">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
              Account
            </p>
            <h1 className="font-sketch text-4xl font-bold tracking-tight text-[#182133]">
              User Profile
            </h1>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-[#687386]">
              Manage your personal information, profile photo, and view your joined chat groups.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            {/* ── Left Column: Profile Card & Edit Form ─────────── */}
            <div className="rounded-3xl border border-[#e4e9f1] bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgba(24,33,51,0.04)]">
              {/* Avatar Section */}
              <div className="flex flex-col items-center pb-6 sm:flex-row sm:items-center sm:gap-6 border-b border-[#edf1f7]">
                <div className="relative group">
                  <UserAvatar
                    user={user}
                    size="2xl"
                    className="ring-4 ring-blue-50 shadow-md"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    title="Upload profile picture"
                    className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    {isUploadingPhoto ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>

                <div className="mt-4 sm:mt-0 text-center sm:text-left">
                  <h2 className="text-base font-bold text-[#182133]">
                    {user?.fullName || user?.username}
                  </h2>
                  <p className="text-xs font-medium text-blue-600">
                    @{user?.username}
                  </p>
                  {user?.organization && (
                    <p className="mt-1 flex items-center justify-center sm:justify-start gap-1 text-xs text-[#8a94a5]">
                      <Building2 className="h-3.5 w-3.5" />
                      {user.organization}
                    </p>
                  )}
                  <p className="mt-2 text-[11px] text-[#8a94a5]">
                    Click the camera icon to upload a profile picture.
                  </p>
                </div>
              </div>

              {/* Form Details */}
              <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#687386]">
                    Full Name
                  </label>
                  <div className="relative mt-1.5 flex items-center">
                    <span className="absolute left-3.5 text-[#8a94a5]">
                      <UserIcon className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Prince"
                      className="w-full rounded-xl border border-[#d8e0eb] bg-white py-2.5 pl-10 pr-4 text-xs text-[#182133] placeholder-[#9aa3b2] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#687386]">
                    Username
                  </label>
                  <div className="relative mt-1.5 flex items-center">
                    <span className="absolute left-3.5 font-bold text-xs text-[#8a94a5]">
                      @
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username"
                      required
                      className="w-full rounded-xl border border-[#d8e0eb] bg-white py-2.5 pl-10 pr-4 text-xs text-[#182133] placeholder-[#9aa3b2] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#687386]">
                    Current Organization
                  </label>
                  <div className="relative mt-1.5 flex items-center">
                    <span className="absolute left-3.5 text-[#8a94a5]">
                      <Building2 className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. Google / Acme Corp / Freelance"
                      className="w-full rounded-xl border border-[#d8e0eb] bg-white py-2.5 pl-10 pr-4 text-xs text-[#182133] placeholder-[#9aa3b2] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#687386]">
                    Email Address
                  </label>
                  <div className="relative mt-1.5 flex items-center">
                    <span className="absolute left-3.5 text-[#8a94a5]">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="w-full rounded-xl border border-[#e4e9f1] bg-[#f8fafc] py-2.5 pl-10 pr-4 text-xs text-[#8a94a5] cursor-not-allowed"
                    />
                  </div>
                  <span className="mt-1 block text-[10px] text-[#9aa3b2]">
                    Email cannot be changed directly.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#687386]">
                    Bio / Headline
                  </label>
                  <div className="relative mt-1.5 flex items-start">
                    <span className="absolute left-3.5 top-3 text-[#8a94a5]">
                      <FileText className="h-4 w-4" />
                    </span>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      maxLength={250}
                      placeholder="Share a short bio or your tech stack interests…"
                      className="w-full rounded-xl border border-[#d8e0eb] bg-white py-2.5 pl-10 pr-4 text-xs text-[#182133] placeholder-[#9aa3b2] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {isSaving ? "Saving Changes…" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>

            {/* ── Right Column: Joined Chat Groups (Dev Rooms) ── */}
            <div className="flex flex-col rounded-3xl border border-[#e4e9f1] bg-white p-6 shadow-[0_8px_30px_rgba(24,33,51,0.04)]">
              <div className="flex items-center justify-between pb-4 border-b border-[#edf1f7]">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#edf4ff] text-blue-600">
                    <MessagesSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#182133]">
                      My Chat Groups
                    </h2>
                    <p className="text-[11px] text-[#8a94a5]">
                      Rooms you have created or joined
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-[#f1f4f8] px-2.5 py-0.5 text-xs font-bold text-[#182133]">
                  {rooms.length}
                </span>
              </div>

              {/* Rooms List */}
              <div className="mt-4 flex-1 overflow-y-auto divide-y divide-[#f4f7fb] max-h-[480px] pr-1">
                {rooms.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf4ff] text-blue-600">
                      <Hash className="h-5 w-5" />
                    </div>
                    <h3 className="text-xs font-bold text-[#182133]">
                      No joined chat groups
                    </h3>
                    <p className="mt-1 text-[11px] text-[#8a94a5]">
                      Create a room or join one using a QR code.
                    </p>
                    <button
                      onClick={() => navigate("/rooms")}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Go to Dev Rooms
                    </button>
                  </div>
                ) : (
                  rooms.map((room) => {
                    const isCreator =
                      room.creator?._id === user?._id || room.creator === user?._id;

                    return (
                      <div
                        key={room._id}
                        className="flex items-center justify-between py-3 hover:bg-[#fbfdff] transition-colors"
                      >
                        <div className="min-w-0 pr-3">
                          <div className="flex items-center gap-1.5">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#edf4ff] text-[10px] font-bold text-blue-600">
                              #
                            </span>
                            <h3 className="truncate text-xs font-bold text-[#182133]">
                              {room.name}
                            </h3>
                            {isCreator ? (
                              <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.2 text-[9px] font-semibold text-amber-700 shrink-0">
                                <Crown className="h-2.5 w-2.5" />
                                Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-[#f1f4f8] px-1.5 py-0.2 text-[9px] font-medium text-[#687386] shrink-0">
                                <Shield className="h-2.5 w-2.5" />
                                Member
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-[10px] text-[#8a94a5]">
                            <span className="font-mono font-medium text-[#687386]">
                              {room.code}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {room.members?.length || 1}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => navigate(`/rooms/${room._id}`)}
                          className="flex items-center gap-1 rounded-xl border border-[#e4e9f1] bg-white px-3 py-1.5 text-[11px] font-semibold text-blue-600 hover:border-blue-300 hover:bg-[#edf4ff] transition-colors shrink-0 cursor-pointer"
                        >
                          Open Chat
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
