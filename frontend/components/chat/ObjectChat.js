'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { CheckCheck, Paperclip, Send, Smile, X } from 'lucide-react';
import { getSocket } from '../../lib/socket';
import { listChatMessages, markChatMessageRead, sendChatMessage } from '../../lib/realtime-api';
import { getToken } from '../../lib/api';

const EMOJI_OPTIONS = ['😀', '😊', '👍', '👏', '🙏', '🎉', '🔥', '✅', '🚀', '❤️'];
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

function formatBytes(bytes = 0) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function ObjectChat({ entityType, objectId, currentUserId, currentUserName }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typingUser, setTypingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const markMessagesRead = useCallback(
    (items) => {
      if (!currentUserId) return;
      const unread = items.filter(
        (msg) =>
          msg.id &&
          msg.userId !== currentUserId &&
          !(msg.readBy || []).some((entry) => entry.userId === currentUserId),
      );
      unread.forEach((msg) => {
        markChatMessageRead(msg.id).catch(() => {});
      });
    },
    [currentUserId],
  );

  useEffect(() => {
    if (!objectId) return;
    listChatMessages(entityType, objectId)
      .then((items) => {
        setMessages(items);
        markMessagesRead(items);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [entityType, objectId, markMessagesRead]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !objectId) return;

    if (!socket.connected) socket.connect();

    socket.emit('join', { entityType, entityId: objectId });

    function onMessage(msg) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      if (msg.userId !== currentUserId) markChatMessageRead(msg.id).catch(() => {});
      scrollToBottom();
    }

    function onRead(receipt) {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== receipt.messageId) return msg;
          const readBy = msg.readBy || [];
          if (readBy.some((entry) => entry.userId === receipt.userId)) return msg;
          return { ...msg, readBy: [...readBy, receipt] };
        }),
      );
    }

    function onTyping({ userId, userName, isTyping }) {
      if (userId === currentUserId) return;
      setTypingUser(isTyping ? userName : null);
    }

    socket.on('message', onMessage);
    socket.on('message:read', onRead);
    socket.on('typing', onTyping);

    return () => {
      socket.emit('leave', { entityType, entityId: objectId });
      socket.off('message', onMessage);
      socket.off('message:read', onRead);
      socket.off('typing', onTyping);
    };
  }, [entityType, objectId, currentUserId, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  function emitTyping(isTyping) {
    const socket = getSocket();
    socket?.emit('typing', { entityType, entityId: objectId, isTyping });
  }

  function handleInputChange(value) {
    setText(value);
    emitTyping(true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => emitTyping(false), 1200);
  }

  async function handleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    const tooLarge = files.find((file) => file.size > MAX_ATTACHMENT_BYTES);
    if (tooLarge) {
      setError(`${tooLarge.name} is larger than 10 MB.`);
      e.target.value = '';
      return;
    }
    setError('');
    const encoded = await Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result.split(',')[1];
              resolve({ filename: file.name, mimeType: file.type, size: file.size, data: base64 });
            };
            reader.readAsDataURL(file);
          }),
      ),
    );
    setPendingFiles((prev) => [...prev, ...encoded]);
    e.target.value = '';
  }

  function removePendingFile(index) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function insertEmoji(emoji) {
    setText((value) => `${value}${emoji}`);
    setShowEmojiPicker(false);
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() && !pendingFiles.length) return;
    setSending(true);
    setError('');
    emitTyping(false);
    try {
      const msg = await sendChatMessage({
        entityType,
        objectId,
        body: text.trim(),
        attachments: pendingFiles,
      });
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      setText('');
      setPendingFiles([]);
    } catch (err) {
      setError(err.message || 'Message failed to send.');
    } finally {
      setSending(false);
    }
  }

  async function downloadAttachment(att, e) {
    e.preventDefault();
    const id = att.url?.match(/attachments\/([^/]+)\/download/)?.[1];
    if (!id) return;
    const res = await fetch(`/api/chat/attachments/${id}/download`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = att.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading chat…</p>;
  }

  return (
    <div className="flex h-[420px] flex-col rounded-2xl border border-border bg-card">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {error ? <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p> : null}
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted">No messages yet. Start the conversation.</p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.userId === currentUserId;
            const readByOthers = (msg.readBy || []).filter((entry) => entry.userId !== currentUserId);
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    isMine ? 'bg-brand text-white' : 'bg-surface-elevated text-foreground'
                  }`}
                >
                  {!isMine && <p className="mb-0.5 text-xs font-semibold opacity-80">{msg.userName}</p>}
                  {msg.body && <p className="whitespace-pre-wrap">{msg.body}</p>}
                  {msg.attachments?.map((att) => (
                    <button
                      key={att.id}
                      type="button"
                      onClick={(e) => downloadAttachment(att, e)}
                      className={`mt-1 block text-xs underline ${isMine ? 'text-white/90' : 'text-brand'}`}
                    >
                      📎 {att.filename} {att.size ? `(${formatBytes(att.size)})` : ''}
                    </button>
                  ))}
                  <div className={`mt-1 flex items-center gap-1 text-[10px] ${isMine ? 'text-white/70' : 'text-muted'}`}>
                    <span>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                    {isMine ? (
                      <>
                        <CheckCheck className="h-3 w-3" />
                        <span>{readByOthers.length ? `Read by ${readByOthers.map((r) => r.userName).join(', ')}` : 'Sent'}</span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {typingUser && (
          <p className="text-xs text-muted">{typingUser} is typing…</p>
        )}
        <div ref={bottomRef} />
      </div>

      {pendingFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-border px-4 py-2 text-xs text-muted">
          {pendingFiles.map((file, index) => (
            <span key={`${file.filename}-${index}`} className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-2 py-1">
              {file.filename} ({formatBytes(file.size)})
              <button type="button" onClick={() => removePendingFile(index)} className="text-muted hover:text-danger" aria-label={`Remove ${file.filename}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-border p-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker((value) => !value)}
            className="rounded-lg border border-border p-2 text-muted hover:bg-surface"
            aria-label="Add emoji"
          >
            <Smile className="h-4 w-4" />
          </button>
          {showEmojiPicker ? (
            <div className="absolute bottom-11 left-0 grid w-48 grid-cols-5 gap-1 rounded-xl border border-border bg-card p-2 shadow-lg">
              {EMOJI_OPTIONS.map((emoji) => (
                <button key={emoji} type="button" onClick={() => insertEmoji(emoji)} className="rounded-md p-1 text-lg hover:bg-surface">
                  {emoji}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <label className="cursor-pointer rounded-lg border border-border p-2 text-muted hover:bg-surface">
          <Paperclip className="h-4 w-4" />
          <input type="file" className="hidden" multiple onChange={handleFileSelect} />
        </label>
        <input
          value={text}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <button
          type="submit"
          disabled={sending}
          className="rounded-xl bg-brand p-2 text-white disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
