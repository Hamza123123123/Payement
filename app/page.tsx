"use client"

import { useState } from "react"
import Link from "next/link"
import { Tv, Search, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PlanCard } from "@/components/plan-card"
import { SubscriptionForm } from "@/components/subscription-form"
import { StatusChecker } from "@/components/status-checker"
import { Plan, PLANS } from "@/lib/types"

type Step = "plans" | "form" | "status"

export default function Home() {
  const [step, setStep] = useState<Step>("plans")
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [checkPhoneNumber, setCheckPhoneNumber] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan)
  }

  const handleContinue = () => {
    if (selectedPlan) {
      setStep("form")
    }
  }

  const handleFormSuccess = (phone: string) => {
    setPhoneNumber(phone)
    setStep("status")
  }

  const handleCheckStatus = () => {
    if (checkPhoneNumber.trim()) {
      setPhoneNumber(checkPhoneNumber.trim())
      setStep("status")
      setIsDialogOpen(false)
    }
  }

  const handleBack = () => {
    if (step === "form") {
      setStep("plans")
    } else if (step === "status") {
      setStep("plans")
      setSelectedPlan(null)
      setPhoneNumber("")
    }
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tv className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">TOTV+ العراق</span>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4 ms-2" />
                تتبع الطلب
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>تتبع حالة الدفع</DialogTitle>
                <DialogDescription>أدخل رقم هاتفك للتحقق من حالة طلبك</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="أدخل رقم هاتفك"
                  value={checkPhoneNumber}
                  onChange={(e) => setCheckPhoneNumber(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCheckStatus()}
                  dir="ltr"
                  className="text-start"
                />
                <Button onClick={handleCheckStatus} className="w-full">
                  تتبع الحالة
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {step === "plans" && (
          <div className="max-w-5xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
                ترفيه بلا حدود في متناول يدك
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
                اختر باقتك المفضلة وابدأ مشاهدة آلاف الأفلام والمسلسلات 
                والمحتوى الحصري اليوم.
              </p>
            </div>

            {/* Plans Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {PLANS.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  selected={selectedPlan?.id === plan.id}
                  onSelect={handlePlanSelect}
                />
              ))}
            </div>

            {/* Continue Button */}
            <div className="text-center">
              <Button
                size="lg"
                onClick={handleContinue}
                disabled={!selectedPlan}
                className="px-12"
              >
                {selectedPlan ? `متابعة مع باقة ${selectedPlan.nameAr}` : "اختر باقة للمتابعة"}
              </Button>
            </div>
          </div>
        )}

        {step === "form" && selectedPlan && (
          <SubscriptionForm
            plan={selectedPlan}
            onBack={handleBack}
            onSuccess={handleFormSuccess}
          />
        )}

        {step === "status" && (
          <StatusChecker phoneNumber={phoneNumber} onBack={handleBack} />
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} TOTV+ العراق. جميع الحقوق محفوظة.
            </p>
            <Link href="/admin/login">
              <Button variant="outline" size="sm" className="gap-2">
                <Shield className="h-4 w-4" />
                دخول المشرف
              </Button>
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
