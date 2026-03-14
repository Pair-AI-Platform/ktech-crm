"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import type { Profile } from "@/types"

const messageStyles: Record<string, { label: string; icon: string; messages: string[] }> = {
  funny: {
    label: 'ضحك 😂',
    icon: '😂',
    messages: [
      "القهوة ما وصلت بعد؟ يعني بعدنا ما بدينا",
      "اللي يسأل وين كنت.. كنت أتفاوض مع المنبه",
      "المكيف بارد والشغل حار.. التوازن",
      "أهم شي اني يايك مو متأخر.. واجد",
      "الواتساب فاضي؟ يعني اليوم يوم حلو",
      "plan اليوم: قهوة، شغل، قهوة ثانية، نروح",
      "نبدأ بإيجابية.. وين القهوة",
      "أحس اليوم بيكون productive.. أو بس القهوة ساحبة",
      "باجر اجازة؟ لا؟ يلا عادي نكمل",
      "لا تقولي في meeting الصبح",
      "الدنيا حر بس المبيعات أحر",
      "ما في شي اسمه يوم عادي، في بس يوم ما شربت فيه قهوة",
      "خلص الحليب من المطبخ.. اليوم يوم أسود",
      "لو كل lead يرد جان صرنا أثرياء",
      "حطيت alarm ٥ مرات وقمت على ضميري",
      "يا حلاة الدوام لما يكون في فطور",
      "أول ما وصلت سألت الساعة كم نطلع",
      "الشاي خلص.. يعني الدوام خلاص انتهى صح؟",
      "طالع من البيت والحر ذابحني بس يلا مشوار رزق",
      "الغدا وين؟ هذا أهم سؤال اليوم",
      "ربع ساعة وانا ادور باركنق",
      "يوم ما أحد يرسلي صوتية يوم حلو",
      "الراتب نزل؟ لا بعد؟ يلا نكمل على الأمل",
      "شفت الزحمة الصبح؟ اللي وصل بوقته بطل",
      "أتوقع اليوم بيكون زين.. بس خل نشوف",
      "ودي أشتغل بس الجو يقولي قعد بالبيت",
      "كل يوم أقول باجر أنظم وقتي.. باجر",
      "ماكل مجبوس الصبح، مستعد لأي شي",
      "اللي يبي شي من الجمعية يقول الحين",
      "تأخرت بس يبت معاي دونات.. نتفاهم؟",
    ],
  },
  hype: {
    label: 'تحفيز 🔥',
    icon: '🔥',
    messages: [
      "يلا نخلص اللي علينا ونريح بالنا",
      "خل اليوم يكون أحسن من أمس بس بشوي",
      "ركز على أول شغلة وكمل منها",
      "اللي تسويه اليوم يفرق، صدقني",
      "ما يبيلها كثير، بس ابدأ",
      "الشغل مو سهل بس انت أصعب",
      "كل lead جديد فرصة، لا تطنشها",
      "خلّص اللي عندك وبعدين ارتاح بضمير مرتاح",
      "نص الشغل يخلص لما تبدأ",
      "اللي يشتغل صح يبين، خله يبين",
      "مو لازم تكون الأفضل، بس لازم تكون أحسن من أمسك",
      "الفرق بين عادي وممتاز: follow up واحد زيادة",
    ],
  },
  chill: {
    label: 'ريلاكس 😮‍💨',
    icon: '😮‍💨',
    messages: [
      "يوم ثقيل؟ خذها شغلة شغلة",
      "اشرب مويتك وكمل على كيفك",
      "مو كل يوم لازم يكون يوم خارق",
      "ارتاح شوي ورجع كمل",
      "عادي تكون tired، بس لا تنسى تكمل",
      "الدنيا ما تستاهل stress زيادة",
      "خذ بريك، ارجع، وكمل بهدوء",
      "مو شرط تخلص كل شي اليوم",
      "شي واحد بس اليوم وبكرة نكمل",
      "على كيفك، بس لا توقف",
    ],
  },
  genz: {
    label: 'Gen Z 💅',
    icon: '💅',
    messages: [
      "slay the leads today bestie",
      "no thoughts just closing deals",
      "it's giving top performer energy",
      "pov: you actually hit your target this month",
      "the pipeline looking real cute ngl",
      "main character at the office today fr",
      "unhinged productivity era",
      "delulu is the solulu — aim high",
      "rent is due so we grind",
      "not me actually being productive on a weekday",
      "giving corporate baddie vibes today",
      "plot twist: you close every lead",
      "okay but like.. let's actually crush it",
      "no cap this quarter is yours",
      "the grind don't stop but at least there's coffee",
    ],
  },
}

export function GreetingHeader({ profile }: { profile: Profile | null }) {
  const firstName = profile?.full_name?.split(' ')[0] || ''
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const [messageStyle, setMessageStyle] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dashboard-message-style') || 'funny'
    }
    return 'funny'
  })
  const [showStylePicker, setShowStylePicker] = useState(false)
  const currentMessages = messageStyles[messageStyle]?.messages || messageStyles.funny.messages

  const [sayingIndex, setSayingIndex] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setSayingIndex(prev => (prev + 1) % currentMessages.length)
    }, 10000)
    return () => clearInterval(interval)
  }, [currentMessages.length])

  return (
    <Header
      user={profile}
      title={`${greeting}${firstName ? `, ${firstName}` : ''}`}
      subtitle={currentMessages[sayingIndex]}
      subtitleExtra={
        <div className="relative inline-block">
          <button
            onClick={() => setShowStylePicker(!showStylePicker)}
            className="ml-2 text-xs px-1.5 py-0.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            {messageStyles[messageStyle]?.icon || '😂'}
          </button>
          {showStylePicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowStylePicker(false)} />
              <div className="absolute top-full mt-1 left-0 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg shadow-lg z-50 min-w-[160px] py-1">
                {Object.entries(messageStyles).map(([key, style]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setMessageStyle(key)
                      setSayingIndex(0)
                      setShowStylePicker(false)
                      localStorage.setItem('dashboard-message-style', key)
                    }}
                    className={`w-full text-right px-3 py-2 text-xs hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 ${messageStyle === key ? 'text-[var(--primary)] font-medium bg-[var(--primary)]/5' : 'text-[var(--text-secondary)]'}`}
                  >
                    <span>{style.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      }
    />
  )
}
