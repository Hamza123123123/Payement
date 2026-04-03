"use client"

import { useState } from "react"
import { createClient } from "@supabase/supabase-js"

// إنشاء اتصال مباشر بالسوبابيس لتجنب أخطاء المسارات
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SubscriptionForm({ plan }: { plan: any }) {
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [file, setFile] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState("zaincash")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return alert("يرجى رفع صورة وصل التحويل")
    setLoading(true)

    try {
      // 1. رفع الصورة
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // 2. جلب رابط الصورة
      const { data: publicUrlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName)

      const imageUrl = publicUrlData.publicUrl

      // 3. خزن البيانات في الجدول
      const { error } = await supabase
        .from('payment_logs')
        .insert([
          { 
            full_name: fullName, 
            phone_number: phone, 
            plan_name: plan?.name || "Premium", 
            plan_price: plan?.price || 0,
            payment_method: paymentMethod,
            image_url: imageUrl,
            status: 'pending' 
          }
        ])

      if (error) throw error

      alert("تم إرسال طلبك بنجاح!")
      window.location.href = `/track?phone=${phone}`

    } catch (err: any) {
      alert("حدث خطأ: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#000', padding: '20px', borderRadius: '8px', border: '1px solid #333' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button type="button" onClick={() => setPaymentMethod("zaincash")} style={{ flex: 1, padding: '10px', fontSize: '12px', background: paymentMethod === 'zaincash' ? '#e11d48' : '#111', color: '#fff', border: '1px solid #333', borderRadius: '4px' }}>زين كاش</button>
        <button type="button" onClick={() => setPaymentMethod("superkey")} style={{ flex: 1, padding: '10px', fontSize: '12px', background: paymentMethod === 'superkey' ? '#e11d48' : '#111', color: '#fff', border: '1px solid #333', borderRadius: '4px' }}>سوبر كي</button>
        <button type="button" onClick={() => setPaymentMethod("fib")} style={{ flex: 1, padding: '10px', fontSize: '12px', background: paymentMethod === 'fib' ? '#e11d48' : '#111', color: '#fff', border: '1px solid #333', borderRadius: '4px' }}>FIB</button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '20px', padding: '15px', background: '#0a0a0a', border: '1px solid #222' }}>
        <p style={{ color: '#888', fontSize: '12px' }}>حول المبلغ المطلوب إلى الرقم:</p>
        <div style={{ color: '#e11d48', fontSize: '24px', fontWeight: 'bold' }}>
          {paymentMethod === 'superkey' ? '7065169257' : '07714415816'}
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input type="text" placeholder="الاسم الكامل" value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ padding: '12px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} required />
        <input type="text" placeholder="رقم الهاتف" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ padding: '12px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} required />
        
        <div>
          <label style={{ color: '#555', fontSize: '10px', display: 'block', marginBottom: '5px' }}>ارفاق صورة الوصل:</label>
          <input type="file" accept="image/*" onChange={(e: any) => setFile(e.target.files?.[0] || null)} style={{ color: '#555', fontSize: '12px' }} required />
        </div>
        
        <button type="submit" disabled={loading} style={{ padding: '12px', background: '#e11d48', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          {loading ? "جاري الإرسال..." : "تأكيد وإرسال الطلب"}
        </button>
      </form>
    </div>
  )
}
