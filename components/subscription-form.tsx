"use client"

import { useState, useRef } from "react"
import { Upload, X, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plan, formatPrice, PAYMENT_DETAILS, validateIraqiPhone } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"

interface SubscriptionFormProps {
  plan: Plan
  onBack: () => void
  onSuccess: (phoneNumber: string) => void
}

export function SubscriptionForm({ plan, onBack, onSuccess }: SubscriptionFormProps) {
  const [userName, setUserName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("الرجاء رفع صورة فقط")
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("حجم الملف يجب أن يكون أقل من 5 ميجابايت")
        return
      }
      setReceiptFile(file)
      setReceiptPreview(URL.createObjectURL(file))
      setError(null)
    }
  }

  const removeFile = () => {
    setReceiptFile(null)
    if (receiptPreview) {
      URL.revokeObjectURL(receiptPreview)
      setReceiptPreview(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!userName.trim()) {
      setError("الرجاء إدخال الاسم الكامل")
      return
    }
    if (!phoneNumber.trim()) {
      setError("الرجاء إدخال رقم الهاتف")
      return
    }
    if (!validateIraqiPhone(phoneNumber)) {
      setError("الرجاء إدخال رقم هاتف عراقي صحيح (يبدأ بـ +964 أو 07)")
      return
    }
    if (!receiptFile) {
      setError("الرجاء رفع صورة الوصل")
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()

      // Upload receipt to Supabase Storage
      const fileExt = receiptFile.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(fileName, receiptFile)

      if (uploadError) {
        throw new Error("فشل في رفع الوصل")
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("receipts")
        .getPublicUrl(fileName)

      // Insert payment log
      const { error: insertError } = await supabase.from("payment_logs").insert({
        user_name: userName.trim(),
        phone_number: phoneNumber.trim(),
        plan_name: plan.name,
        plan_price: plan.price,
        receipt_url: urlData.publicUrl,
        status: "pending",
      })

      if (insertError) {
        throw new Error("فشل في إرسال الطلب")
      }

      onSuccess(phoneNumber.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ ما")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>إتمام الاشتراك</CardTitle>
        <CardDescription>
          باقة {plan.nameAr} - {formatPrice(plan.price)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="userName">الاسم الكامل</Label>
            <Input
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="أدخل اسمك الكامل"
              disabled={isSubmitting}
              className="text-start"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">رقم الهاتف</Label>
            <Input
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="07XX XXX XXXX"
              disabled={isSubmitting}
              dir="ltr"
              className="text-start"
            />
            <p className="text-xs text-muted-foreground">
              رقم عراقي يبدأ بـ +964 أو 07
            </p>
          </div>

          {/* Payment Details */}
          <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-sm">معلومات الدفع</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">اسم المستفيد:</span>
                <span className="font-medium">{PAYMENT_DETAILS.beneficiary}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">سوبر كي (SuperPay):</span>
                <span className="font-medium" dir="ltr">{PAYMENT_DETAILS.superPay}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">زين كاش:</span>
                <span className="font-medium" dir="ltr">{PAYMENT_DETAILS.zainCash}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">المصرف الإسلامي (FIB):</span>
                <span className="font-medium" dir="ltr">{PAYMENT_DETAILS.fib}</span>
              </div>
            </div>
            <div className="border-t border-border pt-3">
              <div className="flex justify-between font-semibold">
                <span>المبلغ المطلوب:</span>
                <span className="text-primary">{formatPrice(plan.price)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>صورة الوصل</Label>
            <p className="text-sm text-muted-foreground mb-2">
              قم بتحويل {formatPrice(plan.price)} ثم ارفع صورة الوصل
            </p>
            
            {receiptPreview ? (
              <div className="relative rounded-lg border overflow-hidden">
                <img
                  src={receiptPreview}
                  alt="معاينة الوصل"
                  className="w-full h-48 object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 start-2"
                  onClick={removeFile}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  اضغط لرفع صورة الوصل
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG حتى 5 ميجابايت
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isSubmitting}
              className="flex-1"
            >
              رجوع
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                "إرسال الطلب"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
