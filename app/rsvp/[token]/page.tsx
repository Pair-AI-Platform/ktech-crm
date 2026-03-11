'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type RsvpState = 'loading' | 'ready' | 'confirming' | 'confirmed' | 'already_confirmed' | 'expired' | 'error'

interface RsvpData {
  event_title: string
  event_date: string | null
  event_location: string | null
  lead_name: string
}

export default function RsvpPage() {
  const { token } = useParams<{ token: string }>()
  const [state, setState] = useState<RsvpState>('loading')
  const [data, setData] = useState<RsvpData | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    async function fetchRsvp() {
      try {
        const res = await fetch(`/api/rsvp/details?token=${token}`)
        if (!res.ok) {
          const err = await res.json()
          if (res.status === 410) {
            setState('expired')
          } else {
            setState('error')
            setErrorMsg(err.error || 'Invalid link')
          }
          return
        }
        const result = await res.json()
        if (result.already_confirmed) {
          setState('already_confirmed')
        } else {
          setState('ready')
        }
        setData(result)
      } catch {
        setState('error')
        setErrorMsg('Something went wrong')
      }
    }
    fetchRsvp()
  }, [token])

  async function handleConfirm() {
    setState('confirming')
    try {
      const res = await fetch('/api/rsvp/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (!res.ok) {
        const err = await res.json()
        setState('error')
        setErrorMsg(err.error || 'Failed to confirm')
        return
      }
      setState('confirmed')
    } catch {
      setState('error')
      setErrorMsg('Something went wrong')
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">KTECH</h1>
          <p className="text-sm text-slate-500">Kuwait Technical College</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          {state === 'loading' && (
            <div className="p-8 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
              <p className="mt-4 text-slate-500">Loading...</p>
            </div>
          )}

          {state === 'ready' && data && (
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-slate-900">{data.event_title}</h2>
                <p className="text-slate-500 mt-1">You&apos;re invited!</p>
              </div>

              <div className="space-y-3 mb-8">
                {data.lead_name && (
                  <div className="flex items-center gap-3 text-sm">
                    <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-slate-700">{data.lead_name}</span>
                  </div>
                )}
                {data.event_date && (
                  <div className="flex items-center gap-3 text-sm">
                    <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-slate-700">{formatDate(data.event_date)}</span>
                  </div>
                )}
                {data.event_location && (
                  <div className="flex items-center gap-3 text-sm">
                    <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-slate-700">{data.event_location}</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleConfirm}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
              >
                Confirm Attendance
              </button>
            </div>
          )}

          {state === 'confirming' && (
            <div className="p-8 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
              <p className="mt-4 text-slate-500">Confirming...</p>
            </div>
          )}

          {(state === 'confirmed' || state === 'already_confirmed') && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-900">
                {state === 'already_confirmed' ? 'Already Confirmed' : 'You\'re Confirmed!'}
              </h2>
              <p className="text-slate-500 mt-2">
                {state === 'already_confirmed'
                  ? 'You have already confirmed your attendance.'
                  : 'Your attendance has been confirmed. We look forward to seeing you!'}
              </p>
              {data?.event_date && (
                <p className="text-sm text-slate-400 mt-4">{formatDate(data.event_date)}</p>
              )}
              {data?.event_location && (
                <p className="text-sm text-slate-400 mt-1">{data.event_location}</p>
              )}
            </div>
          )}

          {state === 'expired' && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Link Expired</h2>
              <p className="text-slate-500 mt-2">This RSVP link has expired. Please contact the admissions team.</p>
            </div>
          )}

          {state === 'error' && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Something Went Wrong</h2>
              <p className="text-slate-500 mt-2">{errorMsg}</p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Kuwait Technical College &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
