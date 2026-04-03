"use client"

import { useEffect, useState, useCallback } from "react"
import { Clock, CheckCircle2, XCircle, Copy, Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PaymentLog, formatPrice } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"

interface StatusCheckerProps {
  phoneNumber: string
  onBack: () => void
}

const STATUS_LABELS: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "تمت الموافقة",
  rejected: "مرفوض",
}

export function StatusChecker({ phoneNumber, onBack }: StatusCheckerProps) {
  const [payments, setPayments] = useState<PaymentLog[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const fetchPayments = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("payment_logs")
      .select("*")
      .eq("phone_number", phoneNumber)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setPayments(data as PaymentLog[])
    }
    setLoading(false)
  }, [phoneNumber])

  useEffect(() => {
    fetchPayments()

    // Set up real-time subscription
    const supabase = createClient()
    const channel = supabase
      .channel("payment_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payment_logs",
          filter: `phone_number=eq.${phoneNumber}`,
        },
        () => {
          fetchPayments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [phoneNumber, fetchPayments])

  const copyToClipboard = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-warning" />
      case "approved":
        return <CheckCircle2 className="h-5 w-5 text-success" />
      case "rejected":
        return <XCircle className="h-5 w-5 text-destructive" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
    }
    return (
      <Badge variant={variants[status] || "secondary"}>
        {STATUS_LABELS[status] || status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="py-8 text-center">
          <div className="animate-pulse">جاري تحميل طلباتك...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>حالة الطلب</CardTitle>
        <CardDescription>تتبع الطلبات للرقم <span dir="ltr">{phoneNumber}</span></CardDescription>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد طلبات لهذا الرقم.
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(payment.status)}
                    <span className="font-medium">باقة {payment.plan_name}</span>
                  </div>
                  {getStatusBadge(payment.status)}
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p>المبلغ: {formatPrice(payment.plan_price)}</p>
                  <p>تاريخ الإرسال: {new Date(payment.created_at).toLocaleDateString("ar-IQ")}</p>
                </div>

                {payment.status === "approved" && payment.activation_code && (
                  <div className="bg-success/10 border border-success/20 rounded-lg p-3">
                    <p className="text-sm font-medium text-success mb-2">
                      كود التفعيل الخاص بك:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-background px-3 py-2 rounded text-sm font-mono text-center" dir="ltr">
                        {payment.activation_code}
                      </code>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyToClipboard(payment.activation_code!)}
                      >
                        {copiedCode === payment.activation_code ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {payment.status === "rejected" && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    <p className="text-sm text-destructive">
                      لم تتم الموافقة على طلبك. الرجاء التواصل مع الدعم أو المحاولة مرة أخرى.
                    </p>
                  </div>
                )}

                {payment.status === "pending" && (
                  <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                    <p className="text-sm text-warning-foreground">
                      طلبك قيد المراجعة. ستحصل على كود التفعيل بعد الموافقة.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <Button variant="outline" onClick={onBack} className="w-full mt-6">
          العودة للباقات
        </Button>
      </CardContent>
    </Card>
  )
}
