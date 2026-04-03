import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  // Fetch initial payments
  const { data: payments } = await supabase
    .from("payment_logs")
    .select("*")
    .order("created_at", { ascending: false })

  return <AdminDashboard initialPayments={payments || []} userEmail={user.email || ""} />
}
