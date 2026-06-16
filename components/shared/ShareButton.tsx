"use client"

import { Share2 } from 'lucide-react'

interface Props {
  text: string       // the compact text to share
  label?: string     // button label (defaults to "Share")
}

const APP_LINK = 'tradeguard.app'
const WA_TAG   = `via TradeGuard AI — ${APP_LINK}`

export default function ShareButton({ text, label = 'Share' }: Props) {
  const shareText = `${text}\n\n${WA_TAG}`

  function handleShare() {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    if (isMobile && navigator.share) {
      navigator.share({ text: shareText }).catch(() => null)
      return
    }
    const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
    window.open(waUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      onClick={handleShare}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '5px 10px',
        background: 'rgba(37,211,102,0.1)',
        border: '1px solid rgba(37,211,102,0.3)',
        borderRadius: '6px',
        color: '#25D366',
        fontSize: '11px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
    >
      <Share2 size={11} />
      {label}
    </button>
  )
}
