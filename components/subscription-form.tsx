"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

export function SubscriptionForm({ plan }: { plan: any }) {
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
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // جلب الرابط العام للصورة
      const { data: publicUrlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName)

      const imageUrl = publicUrlData.publicUrl

      const { error } = await supabase
        .from('payment_logs')
        .insert([
          { 
            full_name: fullName, 
            phone_number: phone, 
            plan_name: plan.name, 
            plan_price: plan.price,
            payment_method: paymentMethod,
            image_url: imageUrl,
            status: 'pending' 
          }
        ])

      if (error) throw error

      alert("تم إرسال طلبك بنجاح!")
      window.location.href = `/track?phone=${phone}`

    } catch (err: any) {
      alert("خطأ: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-4 border border-gray-800 rounded-lg bg-black/50">
      <div className="grid grid-cols-3 gap-2">
        <button type="button" onClick={() => setPaymentMethod("zaincash")} className={`p-2 text-[10px] rounded border transition-all ${paymentMethod === 'zaincash' ? 'border-red-600 bg-red-600/10 text-white' : 'border-gray-800 text-gray-400'}`}>زين كاش</button>
        <button type="button" onClick={() => setPaymentMethod("superkey")} className={`p-2 text-[10px] rounded border transition-all ${paymentMethod === 'superkey' ? 'border-red-600 bg-red-600/10 text-white' : 'border-gray-800 text-gray-400'}`}>سوبر كي</button>
        <button type="button" onClick={() => setPaymentMethod("fib")} className={`p-2 text-[10px] rounded border transition-all ${paymentMethod === 'fib' ? 'border-red-600 bg-red-600/10 text-white' : 'border-gray-800 text-gray-400'}`}>FIB</button>
      </div>

      <div className="text-center py-4 bg-gray-900/50 rounded-md border border-gray-800">
        <p className="text-gray-400 text-xs">حول المبلغ إلى الرقم:</p>
        <div className="text-2xl font-mono text-red-500 font-bold tracking-wider">
          {paymentMethod === 'superkey' ? '7065169257' : '07714415816'}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" placeholder="الاسم الكامل" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-md text-white outline-none focus:border-red-600 text-sm" required />
        <input type="text" placeholder="رقم الهاتف" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-md text-white outline-none focus:border-red-600 text-sm" required />
        
        <div className="space-y-2">
          <label className="text-[10px] text-gray-500 uppercase">ارفاق صورة الوصل:</label>
          <input type="file" accept="image/*" onChange={(e: any) => setFile(e.target.files?.[0] || null)} className="w-full p-2 bg-gray-900 border border-dashed border-gray-700 rounded-md text-xs text-gray-400" required />
        </div>
        
        <button type="submit" disabled={loading} className="w-full bg-red-600 text-white p-3 rounded-md font-bold text-sm">
          {loading ? "جاري الإرسال..." : "تأكيد وإرسال الطلب"}
        </button>
      </form>
    </div>
  )
}
