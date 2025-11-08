'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Me() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    // 현재 로그인 사용자 가져오기
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setEmail(data.user?.email ?? null)
    })
    // 로그인/로그아웃 상태 변화 감지
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      supabase.auth.getUser().then(({ data }) => {
        if (mounted) setEmail(data.user?.email ?? null)
      })
    })
    return () => { mounted = false; sub.subscription.unsubscribe() }
  }, [])

  if (!email) {
    // 로그인 안 되어 있으면 로그인 페이지로 가는 링크 표시
    return <a href="/auth" className="underline">로그인</a>
  }

  // 로그인 되어 있으면 이메일 + 로그아웃 버튼
  return (
    <span className="text-sm">
      {email} ·{' '}
      <button onClick={() => supabase.auth.signOut()} className="underline">
        로그아웃
      </button>
    </span>
  )
}
