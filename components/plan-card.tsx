"use client"

import { Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plan, formatPrice } from "@/lib/types"
import { cn } from "@/lib/utils"

interface PlanCardProps {
  plan: Plan
  selected: boolean
  onSelect: (plan: Plan) => void
}

export function PlanCard({ plan, selected, onSelect }: PlanCardProps) {
  return (
    <Card
      className={cn(
        "relative cursor-pointer transition-all duration-200 hover:border-primary/50",
        selected && "border-primary ring-2 ring-primary/20",
        plan.popular && "border-primary/30"
      )}
      onClick={() => onSelect(plan)}
    >
      {plan.popular && (
        <Badge className="absolute -top-3 start-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
          الأكثر شيوعاً
        </Badge>
      )}
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{plan.nameAr}</CardTitle>
        <CardDescription>{plan.durationAr}</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <div className="mb-6">
          <span className="text-4xl font-bold">{formatPrice(plan.price)}</span>
        </div>
        <ul className="space-y-3 text-start">
          {plan.featuresAr.map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          variant={selected ? "default" : "outline"}
          className="w-full"
          onClick={(e) => {
            e.stopPropagation()
            onSelect(plan)
          }}
        >
          {selected ? "تم الاختيار" : "اختر الباقة"}
        </Button>
      </CardFooter>
    </Card>
  )
}
