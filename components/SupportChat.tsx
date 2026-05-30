'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SupportChat({ userId, userEmail }: { userId: string, userEmail: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Audio object for the incoming message tick
  const tickSound = typeof window !== 'undefined' ? new Audio('/tick.mp3') : null

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) scrollToBottom()
  }, [messages, isOpen])

  useEffect(() => {
    // 1. Fetch existing messages for this user
    const fetchMessages = async () => {
      // First, find or create the user's support ticket
      let { data: ticket } = await supabase.from('support_tickets').select('id').eq('user_id', userId).single()
      
      if (!ticket) {
        const { data: newTicket } = await supabase.from('support_tickets').insert({ user_id: userId }).select().single()
        ticket = newTicket
      }

      if (ticket) {
        const { data: msgs } = await supabase.from('support_messages').select('*').eq('ticket_id', ticket.id).order('created_at', { ascending: true })
        if (msgs) setMessages(msgs)
      }
    }

    fetchMessages()

    // 2. Listen for Realtime incoming messages
    const channel = supabase
      .channel('support_messages_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, (payload) => {
        const newMsg = payload.new
        setMessages((prev) => [...prev, newMsg])
        
        // Play tick sound if the message was sent by SUPPORT (not the user)
        if (newMsg.sender_id !== userId && isOpen) {
          tickSound?.play().catch(e => console.log('Audio play blocked by browser', e))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const { data: ticket } = await supabase.from('support_tickets').select('id').eq('user_id', userId).single()
    if (!ticket) return

    const msgToSend = newMessage
    setNewMessage('') // Clear input immediately for UX

    await supabase.from('support_messages').insert({
      ticket_id: ticket.id,
      sender_id: userId,
      message: msgToSend
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Math.random()}.${fileExt}`

    try {
      // 1. Upload to storage bucket
      const { error: uploadError } = await supabase.storage.from('chat_attachments').upload(fileName, file)
      if (uploadError) throw uploadError

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage.from('chat_attachments').getPublicUrl(fileName)

      // 3. Send message with image link
      const { data: ticket } = await supabase.from('support_tickets').select('id').eq('user_id', userId).single()
      if (ticket) {
        await supabase.from('support_messages').insert({
          ticket_id: ticket.id,
          sender_id: userId,
          image_url: publicUrl
        })
      }
    } catch (error) {
      alert('Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start pointer-events-none">
      
      {/* ── THE CHAT WINDOW ── */}
      {isOpen && (
        <div className="w-[350px] h-[500px] mb-4 bg-[#070512]/95 border border-[#9b5de5]/30 backdrop-blur-xl rounded-2xl shadow-[0_10px_50px_rgba(0,0,0,0.8),0_0_20px_rgba(155,93,229,0.1)] flex flex-col overflow-hidden pointer-events-auto animate-[fadeUp_0.3s_ease-out]">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#9b5de5]/20 to-transparent p-4 border-b border-white/[0.05] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-[#9b5de5]/20 border border-[#9b5de5]/50 flex items-center justify-center font-bold text-[#9b5de5] font-['Syne',sans-serif]">
                  P
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#10b981] rounded-full border-2 border-[#070512]"></div>
              </div>
              <div>
                <h3 className="text-white text-sm font-bold font-['Syne',sans-serif]">ProMail Support</h3>
                <p className="text-[10px] text-[#10b981] font-bold tracking-wider uppercase">Live</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-[#8a80a0] hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-sm font-['DM_Sans',sans-serif]">
            {messages.length === 0 && (
              <div className="text-center text-[#8a80a0] text-xs mt-10">
                Send us a message and we'll reply instantly.
              </div>
            )}
            
            {messages.map((msg, i) => {
              const isMe = msg.sender_id === userId
              return (
                <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-xl ${isMe ? 'bg-[#9b5de5]/20 border border-[#9b5de5]/30 text-white rounded-br-none' : 'bg-white/[0.05] border border-white/[0.05] text-[#8a80a0] rounded-bl-none'}`}>
                    {msg.image_url && (
                      <img src={msg.image_url} alt="Attachment" className="max-w-full rounded-lg mb-2 cursor-pointer border border-white/10" onClick={() => window.open(msg.image_url, '_blank')} />
                    )}
                    {msg.message && <p className="leading-relaxed">{msg.message}</p>}
                    <div className={`text-[9px] mt-1 opacity-50 font-mono ${isMe ? 'text-right' : 'text-left'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-white/[0.05] bg-black/40 flex items-center gap-2">
            <label className="cursor-pointer shrink-0 p-2 text-[#8a80a0] hover:text-[#9b5de5] transition-colors rounded-lg hover:bg-white/[0.05]">
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
            </label>
            <input 
              type="text" 
              placeholder={isUploading ? "Uploading..." : "Type a message..."} 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isUploading}
              className="flex-1 bg-transparent border-none text-white focus:ring-0 text-sm placeholder:text-[#8a80a0]"
            />
            <button type="submit" disabled={!newMessage.trim() || isUploading} className="shrink-0 p-2 bg-[#9b5de5] text-white rounded-lg disabled:opacity-50 hover:bg-[#8040cc] transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            </button>
          </form>
        </div>
      )}

      {/* ── THE TRIGGER BUTTON (BOTTOM LEFT) ── */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-tr from-[#6c3b9c] to-[#9b5de5] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(155,93,229,0.4)] hover:shadow-[0_0_40px_rgba(155,93,229,0.6)] hover:scale-105 transition-all pointer-events-auto border border-white/20 relative group"
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
        )}
      </button>

    </div>
  )
}