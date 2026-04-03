export interface Plan {
  id: string
  name: string
  nameAr: string
  price: number
  duration: string
  durationAr: string
  features: string[]
  featuresAr: string[]
  popular?: boolean
}

export interface PaymentLog {
  id: string
  user_name: string
  phone_number: string
  plan_name: string
  plan_price: number
  receipt_url: string | null
  status: "pending" | "approved" | "rejected"
  activation_code: string | null
  created_at: string
  updated_at: string
}

export const PLANS: Plan[] = [
  {
    id: "monthly",
    name: "Monthly",
    nameAr: "شهري",
    price: 5000,
    duration: "1 month",
    durationAr: "شهر واحد",
    features: ["HD streaming", "1 device", "Full library"],
    featuresAr: ["بث بجودة HD", "جهاز واحد", "المكتبة الكاملة"],
  },
  {
    id: "quarterly",
    name: "3 Months",
    nameAr: "3 أشهر",
    price: 13000,
    duration: "3 months",
    durationAr: "ثلاثة أشهر",
    features: ["Full HD streaming", "2 devices", "Full library", "Downloads"],
    featuresAr: ["بث بجودة Full HD", "جهازين", "المكتبة الكاملة", "تحميل المحتوى"],
    popular: true,
  },
  {
    id: "yearly",
    name: "Yearly",
    nameAr: "سنوي",
    price: 45000,
    duration: "1 year",
    durationAr: "سنة كاملة",
    features: ["4K + HDR streaming", "4 devices", "Full library", "Downloads", "Early access"],
    featuresAr: ["بث بجودة 4K + HDR", "4 أجهزة", "المكتبة الكاملة", "تحميل المحتوى", "وصول مبكر للمحتوى"],
  },
]

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("ar-IQ").format(price) + " د.ع"
}

export const PAYMENT_DETAILS = {
  beneficiary: "Haider isam",
  superPay: "يبدأ برقم 7",
  zainCash: "+964 771 441 5816",
  fib: "+964 771 441 5816",
}

export function validateIraqiPhone(phone: string): boolean {
  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, "")
  // Check for Iraqi format: +964 or 07
  return /^(\+964|07)[0-9]{9,10}$/.test(cleaned)
}

export function formatIraqiPhone(phone: string): string {
  const cleaned = phone.replace(/[\s-]/g, "")
  if (cleaned.startsWith("07")) {
    return "+964 " + cleaned.slice(1)
  }
  return cleaned
}

export function generateActivationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += "-"
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
