import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Hash,
  Plus,
  QrCode,
  Send,
  Users,
  Search,
  LogIn,
  Code,
  MoreVertical,
  LogOut,
  Loader2,
  ChevronLeft,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import AppSidebar from "@/components/AppSidebar";
import QRCodeModal from "@/components/rooms/QRCodeModal";
import CreateRoomModal from "@/components/rooms/CreateRoomModal";
import JoinRoomModal from "@/components/rooms/JoinRoomModal";
import RoomInfoModal from "@/components/rooms/RoomInfoModal";
import UserProfileModal from "@/components/rooms/UserProfileModal";
import UserAvatar from "@/components/rooms/UserAvatar";
import { useAuthStore, useRepoStore, useRoomStore } from "@/store";
import {
  connectSocket,
  joinRoomSocket,
  leaveRoomSocket,
  sendRoomMessageSocket,
  emitTypingStart,
  emitTypingStop,
} from "@/lib/socket";

export default function RoomsPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { repos, fetchRepos } = useRepoStore();
  const {
    rooms,
    activeRoom,
    messages,
    isLoadingRooms,
    isLoadingMessages,
    typingUsers,
    fetchRooms,
    fetchRoom,
    fetchMessages,
    setActiveRoom,
    addMessage,
    setUserTyping,
    removeUserTyping,
    leaveRoom,
  } = useRoomStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const [isCodeMode, setIsCodeMode] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [showRoomOptions, setShowRoomOptions] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load repositories for sidebar and user rooms
  useEffect(() => {
    fetchRepos();
    fetchRooms();
  }, [fetchRepos, fetchRooms]);

  // Set up socket listeners once
  useEffect(() => {
    const socket = connectSocket();

    const handleNewMessage = (msg) => {
      addMessage(msg);
      // Auto-scroll on new message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    };

    const handleUserTyping = ({ roomId: rid, user: typingUser }) => {
      if (activeRoom && activeRoom._id === rid) {
        setUserTyping(typingUser);
      }
    };

    const handleUserStoppedTyping = ({ roomId: rid, userId }) => {
      if (activeRoom && activeRoom._id === rid) {
        removeUserTyping(userId);
      }
    };

    const handleError = ({ message }) => {
      toast.error(message || "Real-time communication error");
    };

    socket.on("new_message", handleNewMessage);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stopped_typing", handleUserStoppedTyping);
    socket.on("error_message", handleError);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stopped_typing", handleUserStoppedTyping);
      socket.off("error_message", handleError);
    };
  }, [activeRoom, addMessage, setUserTyping, removeUserTyping]);

  // If roomId in URL changes, select that room
  useEffect(() => {
    if (roomId) {
      fetchRoom(roomId)
        .then((room) => {
          setActiveRoom(room);
          setMobileShowChat(true);
        })
        .catch(() => {
          toast.error("Could not load room");
          navigate("/rooms");
        });
    }
  }, [roomId, fetchRoom, setActiveRoom, navigate]);

  // When activeRoom changes, join socket room and fetch messages
  useEffect(() => {
    if (!activeRoom) return;

    joinRoomSocket(activeRoom._id);
    fetchMessages(activeRoom._id).then(() => {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      }, 100);
    });

    return () => {
      leaveRoomSocket(activeRoom._id);
    };
  }, [activeRoom, fetchMessages]);

  // Handle typing debounce
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!activeRoom) return;

    emitTypingStart(activeRoom._id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      emitTypingStop(activeRoom._id);
    }, 1500);
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !activeRoom) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      emitTypingStop(activeRoom._id);
    }

    sendRoomMessageSocket({
      roomId: activeRoom._id,
      content: inputText.trim(),
      messageType: isCodeMode ? "code" : "text",
      codeLanguage: isCodeMode ? "javascript" : "",
    });

    setInputText("");
    if (isCodeMode) setIsCodeMode(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSelectRoom = (room) => {
    navigate(`/rooms/${room._id}`);
    setActiveRoom(room);
    setMobileShowChat(true);
  };

  const handleLeaveRoom = async () => {
    if (!activeRoom) return;
    if (!window.confirm(`Are you sure you want to leave #${activeRoom.name}?`))
      return;

    try {
      await leaveRoom(activeRoom._id);
      toast.success(`Left #${activeRoom.name}`);
      setShowRoomOptions(false);
      navigate("/rooms");
    } catch {
      toast.error("Failed to leave room");
    }
  };

  const filteredRooms = rooms.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
              title="View my profile"
            >
              <UserAvatar user={user} size="sm" />
              <span className="hidden text-xs font-medium text-[#687386] sm:block">
                {user?.username}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Sidebar & Main Split Layout ─────────────────────────── */}
      <div className="mx-auto flex w-full max-w-[1440px] flex-1 pt-16">
        <AppSidebar active="rooms" repos={repos} navigate={navigate} />

        {/* ── Main Rooms Area ───────────────────────────────────── */}
        <main className="flex flex-1 overflow-hidden md:ml-64 h-[calc(100vh-4rem)]">
          {/* ── Left Column: Rooms Channel List ─────────────────── */}
          <section
            className={`w-full flex-col border-r border-[#e4e9f1] bg-white md:flex md:w-80 lg:w-96 ${
              mobileShowChat ? "hidden md:flex" : "flex"
            }`}
          >
            {/* Header & Actions */}
            <div className="border-b border-[#edf1f7] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-base font-bold tracking-tight text-[#182133]">
                    Dev Rooms
                  </h1>
                  <p className="text-xs text-[#8a94a5]">
                    Real-time team chat & collaboration
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsJoinModalOpen(true)}
                    title="Join with Code / QR"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e4e9f1] text-[#687386] hover:bg-[#f1f4f8] hover:text-[#182133] transition-colors cursor-pointer"
                  >
                    <LogIn className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    title="Create New Room"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative mt-3 flex items-center">
                <Search className="absolute left-3 h-3.5 w-3.5 text-[#9aa3b2]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter rooms or search code…"
                  className="w-full rounded-xl border border-[#edf1f7] bg-[#f8fafc] py-2 pl-9 pr-3 text-xs text-[#182133] placeholder-[#9aa3b2] focus:border-blue-400 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Rooms List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#f4f7fb]">
              {isLoadingRooms ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-[#9aa3b2]" />
                </div>
              ) : filteredRooms.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf4ff] text-blue-600">
                    <Hash className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#182133]">
                    No rooms found
                  </h3>
                  <p className="mt-1 text-xs text-[#8a94a5] leading-relaxed">
                    Create a new room or join an existing one using an invite code / QR code.
                  </p>
                  <div className="mt-4 flex justify-center gap-2">
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      Create Room
                    </button>
                    <button
                      onClick={() => setIsJoinModalOpen(true)}
                      className="rounded-lg border border-[#e4e9f1] px-3 py-1.5 text-xs font-semibold text-[#182133] hover:bg-[#f1f4f8] transition-colors cursor-pointer"
                    >
                      Join with Code
                    </button>
                  </div>
                </div>
              ) : (
                filteredRooms.map((room) => {
                  const isActive = activeRoom?._id === room._id;
                  const lastMsg = room.lastMessage;
                  return (
                    <button
                      key={room._id}
                      onClick={() => handleSelectRoom(room)}
                      className={`flex w-full items-start gap-3 p-3.5 text-left transition-colors cursor-pointer ${
                        isActive
                          ? "bg-[#edf4ff] border-l-4 border-l-blue-600"
                          : "hover:bg-[#f8fafc]"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                          isActive
                            ? "bg-blue-600 text-white"
                            : "bg-[#edf4ff] text-blue-600"
                        }`}
                      >
                        <Hash className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4
                            className={`truncate text-xs font-bold ${
                              isActive ? "text-blue-700" : "text-[#182133]"
                            }`}
                          >
                            {room.name}
                          </h4>
                          <span className="font-mono text-[10px] text-[#9aa3b2]">
                            {room.code}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-[#8a94a5]">
                          {lastMsg
                            ? `${lastMsg.sender?.username ? lastMsg.sender.username + ": " : ""}${lastMsg.content}`
                            : room.description || "No messages yet"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Quick action footer */}
            <div className="border-t border-[#edf1f7] bg-[#fbfdff] p-3 text-center">
              <button
                onClick={() => setIsJoinModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                <QrCode className="h-3.5 w-3.5" />
                Scan or enter QR invite code
              </button>
            </div>
          </section>

          {/* ── Right Column: Chat Conversation ─────────────────── */}
          <section
            className={`flex-1 flex-col bg-[#f6f8fb] ${
              mobileShowChat ? "flex" : "hidden md:flex"
            }`}
          >
            {activeRoom ? (
              <>
                {/* Chat Room Header */}
                <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#e4e9f1] bg-white px-6">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setMobileShowChat(false)}
                      className="rounded-lg p-1.5 text-[#687386] hover:bg-[#f1f4f8] md:hidden cursor-pointer"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf4ff] text-blue-600 font-bold">
                      <Hash className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-[#182133]">
                          #{activeRoom.name}
                        </h2>
                        <span className="rounded-md border border-[#e4e9f1] bg-[#f8fafc] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#687386]">
                          {activeRoom.code}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[#8a94a5]">
                        <button
                          type="button"
                          onClick={() => setIsInfoModalOpen(true)}
                          title="View joined members"
                          className="flex items-center gap-1.5 rounded-lg px-1.5 py-0.5 -ml-1.5 hover:bg-[#f1f4f8] transition-colors cursor-pointer"
                        >
                          {activeRoom.members?.length > 0 && (
                            <div className="flex -space-x-1.5 overflow-hidden">
                              {activeRoom.members.slice(0, 4).map((m, idx) => (
                                <UserAvatar
                                  key={m.user?._id || idx}
                                  user={m.user}
                                  size="xs"
                                  className="ring-2 ring-white"
                                  showTooltip
                                />
                              ))}
                            </div>
                          )}
                          <span className="flex items-center gap-1 font-medium text-[#687386]">
                            <Users className="h-3 w-3" />
                            {activeRoom.members?.length || 1} member
                            {(activeRoom.members?.length || 1) === 1 ? "" : "s"}
                          </span>
                        </button>
                        {activeRoom.description && (
                          <span className="truncate max-w-xs text-[#687386]">
                            · {activeRoom.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Header Actions */}
                  <div className="flex items-center gap-2">
                    {/* Room Info & Members Button */}
                    <button
                      onClick={() => setIsInfoModalOpen(true)}
                      title="Room Info & Members"
                      className="flex items-center gap-1.5 rounded-xl border border-[#e4e9f1] bg-white px-3 py-1.5 text-xs font-semibold text-[#182133] hover:bg-[#f1f4f8] transition-colors shadow-xs cursor-pointer"
                    >
                      <Info className="h-3.5 w-3.5 text-blue-600" />
                      <span className="hidden sm:inline">Info</span>
                    </button>

                    {/* Invite via QR Code Button */}
                    <button
                      onClick={() => setIsQRModalOpen(true)}
                      className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-[#edf4ff] px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition-colors shadow-sm cursor-pointer"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Invite via QR</span>
                    </button>

                    {/* Room Options Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setShowRoomOptions((v) => !v)}
                        className="rounded-lg p-2 text-[#8a94a5] hover:bg-[#f1f4f8] hover:text-[#182133] transition-colors cursor-pointer"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {showRoomOptions && (
                        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-[#e4e9f1] bg-white py-1 shadow-xl z-20">
                          <button
                            onClick={() => {
                              setShowRoomOptions(false);
                              setIsInfoModalOpen(true);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-[#182133] hover:bg-[#f1f4f8] cursor-pointer"
                          >
                            <Info className="h-3.5 w-3.5 text-blue-600" />
                            Room Info & Members
                          </button>
                          <button
                            onClick={() => {
                              setShowRoomOptions(false);
                              setIsQRModalOpen(true);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-[#182133] hover:bg-[#f1f4f8] cursor-pointer"
                          >
                            <QrCode className="h-3.5 w-3.5 text-blue-600" />
                            Show QR Code & Link
                          </button>
                          <button
                            onClick={handleLeaveRoom}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 cursor-pointer"
                          >
                            <LogOut className="h-3.5 w-3.5" />
                            Leave Room
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages Timeline */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                  {isLoadingMessages ? (
                    <div className="flex justify-center py-20">
                      <Loader2 className="h-7 w-7 animate-spin text-[#9aa3b2]" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-[#e4e9f1] text-[#9aa3b2] shadow-sm">
                        <Hash className="h-6 w-6" />
                      </div>
                      <h3 className="text-sm font-semibold text-[#182133]">
                        No messages yet in #{activeRoom.name}
                      </h3>
                      <p className="mt-1 max-w-xs text-xs text-[#8a94a5]">
                        Say hello to your teammates or share the QR code to invite others!
                      </p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isSelf =
                        msg.sender?._id === user?._id ||
                        msg.sender === user?._id;
                      const isSystem = msg.messageType === "system";

                      if (isSystem) {
                        return (
                          <div
                            key={msg._id || index}
                            className="flex justify-center my-2"
                          >
                            <span className="rounded-full border border-blue-100 bg-[#edf4ff] px-3.5 py-1 text-[11px] font-medium text-blue-700 shadow-xs">
                              {msg.content}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={msg._id || index}
                          className={`flex items-end gap-2.5 ${
                            isSelf ? "justify-end" : "justify-start"
                          }`}
                        >
                          {!isSelf && (
                            <UserAvatar
                              user={msg.sender}
                              size="sm"
                              className="mb-0.5 cursor-pointer hover:opacity-85 transition-opacity"
                              onClick={() => setSelectedProfileUser(msg.sender)}
                              showTooltip
                            />
                          )}

                          <div
                            className={`max-w-md sm:max-w-lg rounded-2xl p-3.5 text-xs shadow-xs ${
                              isSelf
                                ? "bg-blue-600 text-white rounded-br-xs"
                                : "bg-white border border-[#e4e9f1] text-[#182133] rounded-bl-xs"
                            }`}
                          >
                            {!isSelf && (
                              <button
                                type="button"
                                onClick={() => setSelectedProfileUser(msg.sender)}
                                className="mb-1 block font-semibold text-[11px] text-blue-600 hover:underline cursor-pointer text-left"
                                title={`View @${msg.sender?.username || "user"}'s profile`}
                              >
                                @{msg.sender?.username || "Teammate"}
                              </button>
                            )}

                            {msg.messageType === "code" ? (
                              <div className="mt-1 overflow-x-auto rounded-lg bg-[#0a0a0a] p-3 font-mono text-[11px] text-emerald-400">
                                <pre className="whitespace-pre-wrap">
                                  {msg.content}
                                </pre>
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap leading-relaxed">
                                {msg.content}
                              </p>
                            )}

                            <span
                              className={`mt-1 block text-right text-[10px] ${
                                isSelf ? "text-blue-200" : "text-[#9aa3b2]"
                              }`}
                            >
                              {msg.createdAt
                                ? new Date(msg.createdAt).toLocaleTimeString(
                                    [],
                                    { hour: "2-digit", minute: "2-digit" }
                                  )
                                : "just now"}
                            </span>
                          </div>

                          {isSelf && (
                            <UserAvatar
                              user={user}
                              size="sm"
                              className="mb-0.5 cursor-pointer hover:opacity-85 transition-opacity"
                              onClick={() => setSelectedProfileUser(user)}
                              showTooltip
                            />
                          )}
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Real-time Typing Status */}
                {typingUsers.length > 0 && (
                  <div className="px-6 py-1 text-[11px] text-[#687386] italic animate-pulse">
                    {typingUsers.map((u) => u.username).join(", ")}{" "}
                    {typingUsers.length === 1 ? "is" : "are"} typing…
                  </div>
                )}

                {/* Message Input Box */}
                <div className="border-t border-[#e4e9f1] bg-white p-4">
                  {isCodeMode && (
                    <div className="mb-2 flex items-center justify-between rounded-lg bg-[#f0f4fa] px-3 py-1 text-xs text-blue-600">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Code className="h-3.5 w-3.5" />
                        Code snippet mode enabled
                      </span>
                      <button
                        onClick={() => setIsCodeMode(false)}
                        className="text-[11px] text-[#687386] hover:underline cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  <form
                    onSubmit={handleSendMessage}
                    className="flex items-end gap-2"
                  >
                    <button
                      type="button"
                      onClick={() => setIsCodeMode((v) => !v)}
                      title="Share code snippet"
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors cursor-pointer ${
                        isCodeMode
                          ? "border-blue-600 bg-blue-50 text-blue-600"
                          : "border-[#e4e9f1] text-[#687386] hover:bg-[#f1f4f8]"
                      }`}
                    >
                      <Code className="h-4 w-4" />
                    </button>

                    <div className="relative flex-1">
                      <textarea
                        value={inputText}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        placeholder={
                          isCodeMode
                            ? "Paste or write code snippet here…"
                            : `Message #${activeRoom.name}… (Enter to send)`
                        }
                        className={`w-full rounded-xl border border-[#d8e0eb] bg-white py-2.5 pl-3.5 pr-10 text-xs text-[#182133] placeholder-[#9aa3b2] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none ${
                          isCodeMode ? "font-mono" : ""
                        }`}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!inputText.trim()}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm hover:bg-blue-700 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              /* No Room Selected State */
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#edf4ff] text-blue-600 shadow-sm">
                  <Hash className="h-8 w-8" />
                </div>
                <h2 className="font-sketch text-3xl font-bold tracking-tight text-[#182133]">
                  Select or Create a Dev Room
                </h2>
                <p className="mt-2 max-w-sm text-xs leading-relaxed text-[#8a94a5]">
                  Dev Rooms let your team discuss code, share snippets, and coordinate
                  tasks in real time.
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Create New Room
                  </button>
                  <button
                    onClick={() => setIsJoinModalOpen(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-[#e4e9f1] bg-white px-4 py-2.5 text-xs font-semibold text-[#182133] hover:bg-[#f1f4f8] transition-colors cursor-pointer"
                  >
                    <QrCode className="h-4 w-4 text-blue-600" />
                    Join with Code / QR
                  </button>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* ── Modals ─────────────────────────────────────────────── */}
      <QRCodeModal
        room={activeRoom}
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
      />

      <RoomInfoModal
        room={activeRoom}
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        onOpenQR={() => setIsQRModalOpen(true)}
      />

      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onRoomCreated={(newRoom) => {
          navigate(`/rooms/${newRoom._id}`);
          setActiveRoom(newRoom);
          setMobileShowChat(true);
        }}
      />

      <JoinRoomModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onRoomJoined={(joinedRoom) => {
          navigate(`/rooms/${joinedRoom._id}`);
          setActiveRoom(joinedRoom);
          setMobileShowChat(true);
        }}
      />

      {/* User Profile Modal when clicking avatars or usernames */}
      <UserProfileModal
        user={selectedProfileUser}
        isOpen={!!selectedProfileUser}
        onClose={() => setSelectedProfileUser(null)}
      />
    </div>
  );
}
