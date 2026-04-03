"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Tv, LogOut, Bell, Clock, CheckCircle2, XCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PaymentLog, formatPrice } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { PaymentTable } from "./payment-table"
import { toast } from "sonner"

interface AdminDashboardProps {
  initialPayments: PaymentLog[]
  userEmail: string
}

export function AdminDashboard({ initialPayments, userEmail }: AdminDashboardProps) {
  const router = useRouter()
  const [payments, setPayments] = useState<PaymentLog[]>(initialPayments)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [newPaymentCount, setNewPaymentCount] = useState(0)

  const fetchPayments = useCallback(async () => {
    setIsRefreshing(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("payment_logs")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setPayments(data as PaymentLog[])
    }
    setIsRefreshing(false)
  }, [])

  useEffect(() => {
    // Set up real-time subscription for new payments
    const supabase = createClient()
    const channel = supabase
      .channel("admin_payment_updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "payment_logs",
        },
        (payload) => {
          const newPayment = payload.new as PaymentLog
          setPayments((prev) => [newPayment, ...prev])
          setNewPaymentCount((prev) => prev + 1)
          
          // Show toast notification
          toast.info("New Payment Received", {
            description: `${newPayment.user_name} submitted a ${newPayment.plan_name} plan payment`,
          })
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "payment_logs",
        },
        (payload) => {
          const updatedPayment = payload.new as PaymentLog
          setPayments((prev) =>
            prev.map((p) => (p.id === updatedPayment.id ? updatedPayment : p))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/admin/login")
    router.refresh()
  }

  const pendingPayments = payments.filter((p) => p.status === "pending")
  const approvedPayments = payments.filter((p) => p.status === "approved")
  const rejectedPayments = payments.filter((p) => p.status === "rejected")

  const totalRevenue = approvedPayments.reduce((sum, p) => sum + p.plan_price, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tv className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">TOTV+</span>
            <Badge variant="secondary" className="ml-2">Admin</Badge>
          </div>
          <div className="flex items-center gap-4">
            {newPaymentCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                <Bell className="h-3 w-3 mr-1" />
                {newPaymentCount} new
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">{userEmail}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingPayments.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedPayments.length}</div>
              <p className="text-xs text-muted-foreground">Active subscriptions</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rejectedPayments.length}</div>
              <p className="text-xs text-muted-foreground">Declined payments</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <span className="text-primary font-bold">$</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">Total approved</p>
            </CardContent>
          </Card>
        </div>

        {/* Payments Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Payment Requests</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchPayments()
                setNewPaymentCount(0)
              }}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
              <TabsList className="mb-4">
                <TabsTrigger value="pending">
                  Pending ({pendingPayments.length})
                </TabsTrigger>
                <TabsTrigger value="approved">
                  Approved ({approvedPayments.length})
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  Rejected ({rejectedPayments.length})
                </TabsTrigger>
                <TabsTrigger value="all">
                  All ({payments.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="pending">
                <PaymentTable
                  payments={pendingPayments}
                  showActions
                  onUpdate={fetchPayments}
                />
              </TabsContent>
              
              <TabsContent value="approved">
                <PaymentTable payments={approvedPayments} />
              </TabsContent>
              
              <TabsContent value="rejected">
                <PaymentTable payments={rejectedPayments} />
              </TabsContent>
              
              <TabsContent value="all">
                <PaymentTable payments={payments} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
