'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Paperclip, Send } from 'lucide-react';
import { getSocket } from '../../lib/socket';
import { listChatMessages, sendChatMessage } from '../../lib/realtime-api';
import { getToken } from '../../lib/api';

export function ObjectChat({ entityType, objectId, currentUserId, currentUserName }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typingUser, setTypingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!objectId) return;
    listChatMessages(entityType, objectId)
      .then(setMessages)
      .finally(() => setLoading(false));
  }, [entityType, objectId]);

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
      scrollToBottom();
    }

    function onTyping({ userId, userName, isTyping }) {
      if (userId === currentUserId) return;
      setTypingUser(isTyping ? userName : null);
    }

    socket.on('message', onMessage);
    socket.on('typing', onTyping);

    return () => {
      socket.emit('leave', { entityType, entityId: objectId });
      socket.off('message', onMessage);
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
    const encoded = await Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result.split(',')[1];
              resolve({ filename: file.name, mimeType: file.type, data: base64 });
            };
            reader.readAsDataURL(file);
          }),
      ),
    );
    setPendingFiles((prev) => [...prev, ...encoded]);
    e.target.value = '';
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() && !pendingFiles.length) return;
    setSending(true);
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
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted">No messages yet. Start the conversation.</p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.userId === currentUserId;
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
                      📎 {att.filename}
                    </button>
                  ))}
                  <p className={`mt-1 text-[10px] ${isMine ? 'text-white/70' : 'text-muted'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </p>
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
        <div className="border-t border-border px-4 py-2 text-xs text-muted">
          {pendingFiles.map((f) => f.filename).join(', ')}
        </div>
      )}

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-border p-3">
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
