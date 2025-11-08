'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Item = { id: string; title: string; price: number; image_path: string | null }

export default function Home() {
  const [items, setItems] = useState<Item[]>([])
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState<number>(0)
  const [userId, setUserId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  // 검색/정렬
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<'recent' | 'priceAsc' | 'priceDesc'>('recent')

  // 로그인 사용자 로드
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
    })
    return () => { sub.subscription.unsubscribe() }
  }, [])

  async function load() {
    const { data, error } = await supabase
      .from('items')
      .select('id,title,price,image_path')
      .order('created_at', { ascending: false })
    if (!error && data) setItems(data as Item[])
  }
  useEffect(() => { load() }, [])

async function uploadImage(): Promise<string | null> {
  const file = fileRef.current?.files?.[0]
  if (!file) return null
  if (!userId) { alert('이미지 업로드는 로그인 필요'); return null }

  // 파일명 완전 안전화 (ASCII만 남기기 + 확장자 보존)
  const original = file.name || 'image'
  const dot = original.lastIndexOf('.')
  const base = (dot > -1 ? original.slice(0, dot) : original)
    .normalize('NFKD')
    .replace(/[^\w\-]+/g, '_')         // 영문/숫자/_/- 만
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase() || 'image'
  const ext = (dot > -1 ? original.slice(dot + 1) : 'jpg')
    .normalize('NFKD')
    .replace(/[^\w]+/g, '')
    .toLowerCase() || 'jpg'

  // 유일 경로 (중복 방지 + 경로 세그먼트는 따로 조립)
  const key = `${userId}/${Date.now()}-${base}.${ext}`

  // 실제 업로드 (contentType 지정 + 에러 로그)
  const { data, error } = await supabase
    .storage.from('item-images')
    .upload(key, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || (ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'),
    })

  if (error) {
    console.error('upload error', { key, error })
    alert(`업로드 실패: ${error.message}\n키: ${key}`)
    return null
  }
  return key
}


  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (!title) return
    let image_path: string | null = null
    if (fileRef.current?.files?.length) {
      image_path = await uploadImage()
    }
    const payload: any = {
      title,
      price: Number(price) || 0,
      image_path,
    }
    if (userId) payload.seller_id = userId

    const { error } = await supabase.from('items').insert(payload)
    if (!error) {
      setTitle('')
      setPrice(0)
      if (fileRef.current) fileRef.current.value = ''
      load()
    }
  }

  const visible = useMemo(() => {
    let v = items
    if (q.trim()) {
      const needle = q.trim().toLowerCase()
      v = v.filter(it => it.title.toLowerCase().includes(needle))
    }
    if (sort === 'priceAsc') v = [...v].sort((a,b)=>a.price-b.price)
    if (sort === 'priceDesc') v = [...v].sort((a,b)=>b.price-a.price)
    return v
  }, [items, q, sort])

  const imageURL = (path: string) =>
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/item-images/${path}`

  return (
    <div style={{ maxWidth: 760, margin: '20px auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>중고거래</h1>

      {/* 등록 폼 */}
      <form onSubmit={addItem} style={{ display: 'grid', gap: 8, marginTop: 16 }}>
        <input
          placeholder="제목"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ padding: 8, border: '1px solid #ddd', borderRadius: 8 }}
        />
        <input
          placeholder="가격"
          type="number"
          value={price}
          onChange={e => setPrice(Number(e.target.value))}
          style={{ padding: 8, border: '1px solid #ddd', borderRadius: 8 }}
        />
        <input type="file" accept="image/*" ref={fileRef}
          style={{ padding: 8, border: '1px solid #ddd', borderRadius: 8 }} />
        <button
          type="submit"
          style={{ padding: '8px 12px', borderRadius: 8, background: 'black', color: 'white' }}
        >
          등록
        </button>
        <div style={{ color:'#666', fontSize:13 }}>
          이미지 업로드는 로그인 필요 · <a href="/auth" style={{ textDecoration:'underline' }}>로그인 하러 가기</a>
        </div>
      </form>

      {/* 검색/정렬 바 */}
      <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
        <input
          placeholder="검색(제목)"
          value={q}
          onChange={e=>setQ(e.target.value)}
          style={{ flex: 1, padding: 8, border: '1px solid #ddd', borderRadius: 8 }}
        />
        <select
          value={sort}
          onChange={e=>setSort(e.target.value as any)}
          style={{ padding: 8, border: '1px solid #ddd', borderRadius: 8 }}
        >
          <option value="recent">최신순</option>
          <option value="priceAsc">가격↑</option>
          <option value="priceDesc">가격↓</option>
        </select>
      </div>

      {/* 목록 */}
      <ul style={{ marginTop: 16, display: 'grid', gap: 8 }}>
        {visible.map(it => (
          <li key={it.id} style={{ border:'1px solid #eee', borderRadius: 8, padding: 12, display:'grid', gridTemplateColumns:'96px 1fr', gap:12 }}>
            <div style={{ width:96, height:96, background:'#f3f3f3', borderRadius:8, overflow:'hidden' }}>
              {it.image_path
                ? <img src={imageURL(it.image_path)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                : <div style={{ fontSize:12, color:'#888', padding:8 }}>이미지 없음</div>}
            </div>
            <div>
              <div style={{ fontWeight:600 }}>{it.title}</div>
              <div>{it.price.toLocaleString()}원</div>
            </div>
          </li>
        ))}
        {visible.length === 0 && <div style={{ color:'#666' }}>결과가 없습니다.</div>}
      </ul>
    </div>
  )
}
