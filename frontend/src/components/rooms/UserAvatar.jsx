import { useState } from "react";

const COLOR_PALETTES = [
  "bg-blue-600 text-white",
  "bg-emerald-600 text-white",
  "bg-indigo-600 text-white",
  "bg-violet-600 text-white",
  "bg-rose-600 text-white",
  "bg-amber-600 text-white",
  "bg-teal-600 text-white",
  "bg-cyan-600 text-white",
  "bg-fuchsia-600 text-white",
];

function getInitials(name) {
  if (!name || typeof name !== "string") return "?";
  const clean = name.trim().replace(/^@+/, "");
  if (!clean) return "?";
  const parts = clean.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

function getAvatarColor(name) {
  if (!name || typeof name !== "string") return COLOR_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLOR_PALETTES.length;
  return COLOR_PALETTES[index];
}

const SIZE_CLASSES = {
  xs: "h-5 w-5 text-[9px]",
  sm: "h-7 w-7 text-[11px]",
  md: "h-9 w-9 text-xs",
  lg: "h-11 w-11 text-sm font-semibold",
  xl: "h-16 w-16 text-xl font-bold",
  "2xl": "h-24 w-24 text-3xl font-bold",
  "3xl": "h-28 w-28 text-4xl font-bold",
};

export default function UserAvatar({
  user,
  username: usernameProp,
  size = "sm",
  className = "",
  showTooltip = false,
}) {
  const [failedUrl, setFailedUrl] = useState(null);

  // Extract username, fullName, and avatar from user object or props
  const username =
    (typeof user === "string" ? user : user?.username) ||
    usernameProp ||
    (typeof user === "object" && user?._id ? `user-${user._id.slice(-4)}` : "Teammate");
  const displayName = (typeof user === "object" && user?.fullName) ? user.fullName : username;
  const avatarUrl = typeof user === "object" ? user?.avatar : "";
  const imageError = failedUrl === avatarUrl;

  const initials = getInitials(displayName);
  const colorClass = getAvatarColor(username);
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.sm;

  if (avatarUrl && !imageError) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        onError={() => setFailedUrl(avatarUrl)}
        title={showTooltip ? username : undefined}
        className={`shrink-0 rounded-full object-cover shadow-xs border border-white/10 ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <div
      title={showTooltip ? `@${username}` : undefined}
      className={`flex shrink-0 items-center justify-center rounded-full font-bold tracking-tight select-none shadow-xs ${colorClass} ${sizeClass} ${className}`}
    >
      {initials}
    </div>
  );
}
