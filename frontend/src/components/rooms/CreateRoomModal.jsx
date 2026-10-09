import { useState } from "react";
import { X, Loader2, MessageSquarePlus, Hash } from "lucide-react";
import toast from "react-hot-toast";
import { useRoomStore } from "@/store";

export default function CreateRoomModal({ isOpen, onClose, onRoomCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { createRoom } = useRoomStore();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      toast.error("Room name must be at least 2 characters");
      return;
    }

    setSubmitting(true);
    try {
      const room = await createRoom({
        name: name.trim(),
        description: description.trim(),
      });
      toast.success(`Room #${room.name} created!`);
      setName("");
      setDescription("");
      onClose();
      if (onRoomCreated) onRoomCreated(room);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create room");
    } finally {
      setSubmitting(false);
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
            <MessageSquarePlus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[#182133]">
              Create Dev Room
            </h2>
            <p className="text-xs text-[#8a94a5]">
              Create a group chat space for your team or repo discussion.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#687386]">
              Room Name
            </label>
            <div className="relative mt-1.5 flex items-center">
              <span className="absolute left-3.5 text-[#8a94a5]">
                <Hash className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. backend-squad or architecture-sync"
                maxLength={60}
                required
                className="w-full rounded-xl border border-[#d8e0eb] bg-white py-2.5 pl-10 pr-4 text-sm text-[#182133] placeholder-[#9aa3b2] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#687386]">
              Topic / Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this room about?"
              maxLength={250}
              rows={3}
              className="mt-1.5 w-full rounded-xl border border-[#d8e0eb] bg-white p-3 text-sm text-[#182133] placeholder-[#9aa3b2] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
            />
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
              disabled={submitting || !name.trim()}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {submitting ? "Creating…" : "Create Room"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
