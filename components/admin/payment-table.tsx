"use client"

import { useState } from "react"
import { ExternalLink, Check, X, Eye, Copy, Loader2 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { PaymentLog, formatPrice, generateActivationCode } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface PaymentTableProps {
  payments: PaymentLog[]
  showActions?: boolean
  onUpdate?: () => void
}

export function PaymentTable({ payments, showActions, onUpdate }: PaymentTableProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const handleApprove = async (payment: PaymentLog) => {
    setProcessingId(payment.id)
    
    try {
      const supabase = createClient()
      const activationCode = generateActivationCode()
      
      const { error } = await supabase
        .from("payment_logs")
        .update({
          status: "approved",
          activation_code: activationCode,
        })
        .eq("id", payment.id)

      if (error) throw error

      toast.success("Payment Approved", {
        description: `Activation code: ${activationCode}`,
      })
      
      onUpdate?.()
    } catch (error) {
      toast.error("Failed to approve payment")
      console.error(error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (payment: PaymentLog) => {
    setProcessingId(payment.id)
    
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from("payment_logs")
        .update({ status: "rejected" })
        .eq("id", payment.id)

      if (error) throw error

      toast.success("Payment Rejected")
      onUpdate?.()
    } catch (error) {
      toast.error("Failed to reject payment")
      console.error(error)
    } finally {
      setProcessingId(null)
    }
  }

  const copyToClipboard = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
    toast.success("Activation code copied")
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
    }
    return (
      <Badge variant={variants[status] || "secondary"} className="capitalize">
        {status}
      </Badge>
    )
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No payments found.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Receipt</TableHead>
            <TableHead>Date</TableHead>
            {(showActions || payments.some(p => p.activation_code)) && (
              <TableHead>Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-medium">{payment.user_name}</TableCell>
              <TableCell>{payment.phone_number}</TableCell>
              <TableCell>{payment.plan_name}</TableCell>
              <TableCell>{formatPrice(payment.plan_price)}</TableCell>
              <TableCell>{getStatusBadge(payment.status)}</TableCell>
              <TableCell>
                {payment.receipt_url ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Payment Receipt</DialogTitle>
                      </DialogHeader>
                      <div className="relative">
                        <img
                          src={payment.receipt_url}
                          alt="Payment receipt"
                          className="w-full rounded-lg"
                        />
                        <a
                          href={payment.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute top-2 right-2"
                        >
                          <Button size="sm" variant="secondary">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Open
                          </Button>
                        </a>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <span className="text-muted-foreground">No receipt</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(payment.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {showActions && payment.status === "pending" && (
                  <div className="flex items-center gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="default"
                          disabled={processingId === payment.id}
                        >
                          {processingId === payment.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Approve Payment?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will generate an activation code for {payment.user_name}&apos;s 
                            {" "}{payment.plan_name} plan subscription.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleApprove(payment)}>
                            Approve
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={processingId === payment.id}
                        >
                          {processingId === payment.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reject Payment?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will reject {payment.user_name}&apos;s payment request. 
                            They will need to submit a new payment.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleReject(payment)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Reject
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
                {payment.activation_code && (
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {payment.activation_code}
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(payment.activation_code!)}
                    >
                      {copiedCode === payment.activation_code ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
