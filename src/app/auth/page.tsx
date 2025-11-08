'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function send() {
    setErr(null)
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) setErr(error.message)
    else setSent(true)
  }

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>이메일로 로그인</h1>
      <p style={{ color: '#555' }}>메일에 도착한 링크를 누르면 로그인됩니다.</p>
      <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
        <input
          placeholder="you@example.com"
          value={email}
          onChange={e=>setEmail(e.target.value)}
          style={{ padding:8, border:'1px solid #ddd', borderRadius:8 }}
        />
        <button onClick={send} style={{ padding:'8px 12px', borderRadius:8, background:'black', color:'white' }}>
          로그인 링크 보내기
        </button>
        {sent && <div style={{ color:'green' }}>메일을 확인하세요.</div>}
        {err && <div style={{ color:'crimson' }}>{err}</div>}
      </div>
    </div>
  )
}
