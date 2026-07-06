'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { io } from 'socket.io-client';

export default function MessagesPage() {
  const params = useParams();
  const convId = params?.id;
  const { user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [activeOffer, setActiveOffer] = useState(null);
  const [counterOpen, setCounterOpen] = useState(false);
  const [counterAmount, setCounterAmount] = useState('');
  const [offerBusy, setOfferBusy] = useState(false);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    fetch('/api/messages/conversations').then((r) => r.json()).then(setConversations);
  }, []);

  useEffect(() => {
    if (!user) return;
    // Authenticates via the tab_token httpOnly cookie on the handshake
    const socket = io({ path: '/api/socket' });
    socketRef.current = socket;

    socket.on('new_message', (msg) => {
      setMessages((prev) => prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]);
    });
    socket.on('user_typing', () => {
      setTyping(true);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => setTyping(false), 2000);
    });
    return () => socket.disconnect();
  }, [user]);

  useEffect(() => {
    if (!convId) {
      // Desktop auto-selects the first conversation; mobile keeps the list
      if (conversations.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 640) {
        router.replace(`/messages/${conversations[0].id}`);
      }
      return;
    }
    fetch(`/api/messages/conversations/${convId}`).then(async (r) => {
      if (!r.ok) { router.push('/messages'); return; }
      const data = await r.json();
      setActive(data);
      setMessages(data.messages);
      socketRef.current?.emit('join_conversation', convId);
      if (data.listing?.id) fetchOffers(data.listing.id);
    });
  }, [convId, conversations.length]);

  const fetchOffers = async (listingId) => {
    try {
      const res = await fetch(`/api/offers?listingId=${listingId}`);
      if (!res.ok) return;
      const offers = await res.json();
      setActiveOffer((offers || []).find((o) => ['PENDING', 'ACCEPTED'].includes(o.status)) || null);
    } catch {}
  };

  const offerAction = async (action, extra = {}) => {
    if (!activeOffer) return;
    setOfferBusy(true);
    try {
      const res = await fetch(`/api/offers/${activeOffer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      if (res.ok) {
        setCounterOpen(false);
        setCounterAmount('');
        // reload offers and messages so the auto-message shows up
        if (active?.listing?.id) fetchOffers(active.listing.id);
        const cr = await fetch(`/api/messages/conversations/${convId}`);
        if (cr.ok) { const d = await cr.json(); setMessages(d.messages); }
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || 'Action failed');
      }
    } finally { setOfferBusy(false); }
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending || !convId) return;
    setSending(true);
    try {
      const res = await fetch(`/api/messages/conversations/${convId}/messages`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: input.trim() }),
      });
      const msg = await res.json();
      setMessages((prev) => prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]);
      setInput('');
    } finally { setSending(false); }
  };

  const onTyping = () => { socketRef.current?.emit('typing', { conversationId: convId }); };

  const other = (conv) => conv ? (user?.id === conv.buyerId ? conv.seller : conv.buyer) : null;
  const otherUser = other(active);

  return (
    <div className="section py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Messages</h1>
      <div className="flex h-[calc(100vh-11rem)] card overflow-hidden">
        {/* Sidebar — on mobile it IS the page until a conversation is opened */}
        <div className={`${convId ? 'hidden sm:flex' : 'flex'} w-full sm:w-72 flex-shrink-0 sm:border-r border-gray-100 flex-col`}>
          <div className="p-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Conversations</p>
          </div>
          <div className="overflow-y-auto flex-1">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                  <svg className="h-6 w-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                </div>
                <p className="text-sm text-gray-500 font-medium">No messages yet</p>
                <p className="text-xs text-gray-400 mt-1">Start a chat from any listing</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const o = other(conv);
                const last = conv.messages?.[0];
                const isActive = convId === conv.id;
                return (
                  <Link key={conv.id} href={`/messages/${conv.id}`}
                    className={`flex items-start gap-3 p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${isActive ? 'bg-blue-50 border-l-[3px] border-l-blue-500' : ''}`}>
                    {o?.avatar ? <img src={o.avatar} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" /> : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold flex-shrink-0">{o?.name?.[0]}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm truncate ${isActive ? 'font-bold text-blue-700' : 'font-semibold text-gray-900'}`}>{o?.name}</span>
                        {conv.unreadCount > 0 && <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">{conv.unreadCount}</span>}
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{conv.listing?.title}</p>
                      {last && <p className="text-xs text-gray-400 truncate mt-0.5 italic">{last.content}</p>}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Chat area */}
        {active ? (
          <div className={`${convId ? 'flex' : 'hidden sm:flex'} flex-1 flex-col min-w-0`}>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 sm:px-5 py-4 border-b border-gray-100 bg-white">
              <Link href="/messages" className="sm:hidden -ml-1 p-1.5 rounded-lg text-gray-500 hover:bg-gray-100" aria-label="Back to conversations">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </Link>
              {otherUser?.avatar ? <img src={otherUser.avatar} alt="" className="w-9 h-9 rounded-full object-cover" /> : (
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">{otherUser?.name?.[0]}</div>
              )}
              <div>
                <Link href={`/profile/${otherUser?.id}`} className="font-semibold text-gray-900 text-sm hover:text-blue-600">{otherUser?.name}</Link>
                <p className="text-xs text-gray-400">
                  Re: <Link href={`/listings/${active.listing?.id}`} className="hover:text-blue-600 hover:underline text-blue-500 font-medium">{active.listing?.title}</Link>
                  {active.listing?.price && <span className="text-gray-400"> · ${active.listing.price.toLocaleString()}</span>}
                </p>
              </div>
            </div>

            {/* Active offer banner */}
            {activeOffer && (
              <div className={`px-5 py-3 border-b ${activeOffer.status === 'ACCEPTED' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="text-sm">
                    {activeOffer.status === 'ACCEPTED' ? (
                      <span className="text-emerald-700 font-medium">
                        ✅ Offer accepted: <strong>${activeOffer.amount.toLocaleString()}</strong>
                        {user?.id === activeOffer.buyerId && <> — <Link href={`/listings/${active.listing?.id}`} className="underline font-semibold">complete checkout</Link></>}
                      </span>
                    ) : (
                      <span className="text-amber-800">
                        💰 {activeOffer.createdById === user?.id ? 'Your offer' : `Offer ${activeOffer.createdById === activeOffer.sellerId ? '(counter) ' : ''}from ${otherUser?.name}`}:{' '}
                        <strong>${activeOffer.amount.toLocaleString()}</strong>
                        <span className="text-amber-600 text-xs ml-2">expires {new Date(activeOffer.expiresAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                    )}
                  </div>
                  {activeOffer.status === 'PENDING' && (
                    <div className="flex gap-2">
                      {activeOffer.createdById !== user?.id ? (
                        <>
                          <button onClick={() => offerAction('accept')} disabled={offerBusy}
                            className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-semibold">Accept</button>
                          <button onClick={() => setCounterOpen(true)} disabled={offerBusy}
                            className="text-xs px-3 py-1.5 rounded-lg bg-white text-amber-700 border border-amber-300 hover:bg-amber-100 font-semibold">Counter</button>
                          <button onClick={() => offerAction('decline')} disabled={offerBusy}
                            className="text-xs px-3 py-1.5 rounded-lg bg-white text-red-600 border border-red-200 hover:bg-red-50 font-semibold">Decline</button>
                        </>
                      ) : (
                        <button onClick={() => offerAction('cancel')} disabled={offerBusy}
                          className="text-xs px-3 py-1.5 rounded-lg bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 font-medium">Withdraw</button>
                      )}
                    </div>
                  )}
                </div>
                {counterOpen && (
                  <div className="flex items-center gap-2 mt-2.5">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">$</span>
                      <input type="number" min="1" step="0.01" autoFocus value={counterAmount}
                        onChange={(e) => setCounterAmount(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && counterAmount) offerAction('counter', { counterAmount: Number(counterAmount) }); }}
                        placeholder="Counter amount"
                        className="input pl-7 py-1.5 text-sm w-40" />
                    </div>
                    <button onClick={() => offerAction('counter', { counterAmount: Number(counterAmount) })}
                      disabled={offerBusy || !counterAmount}
                      className="text-xs px-3 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 font-semibold">Send Counter</button>
                    <button onClick={() => { setCounterOpen(false); setCounterAmount(''); }}
                      className="text-xs px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-100 font-medium">Cancel</button>
                  </div>
                )}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50">
              {messages.map((msg) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                    {!isMe && (
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold flex-shrink-0 mb-1">
                        {msg.sender?.name?.[0]}
                      </div>
                    )}
                    <div className={`max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-blue-600 text-white rounded-br-md' : 'bg-white text-gray-900 rounded-bl-md shadow-sm border border-gray-100'}`}>
                        {msg.content}
                      </div>
                      <span className="text-[11px] text-gray-400 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              {typing && (
                <div className="flex items-end gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold flex-shrink-0">{otherUser?.name?.[0]}</div>
                  <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100 flex gap-1">
                    {[0, 150, 300].map((d) => <span key={d} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-gray-100 bg-white flex gap-3 items-center">
              <input
                type="text" value={input}
                onChange={(e) => { setInput(e.target.value); onTyping(); }}
                placeholder={`Message ${otherUser?.name || ''}...`}
                className="flex-1 input rounded-2xl bg-gray-50 border-gray-100"
              />
              <button type="submit" disabled={sending || !input.trim()} className="btn-primary w-10 h-10 rounded-xl p-0 flex-shrink-0">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </form>
          </div>
        ) : (
          <div className="hidden sm:flex flex-1 items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              </div>
              <p className="text-sm font-medium text-gray-600">Select a conversation</p>
              <p className="text-xs text-gray-400 mt-1">Choose from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
