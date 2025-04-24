"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import type { ReactNode } from "react"

export interface AnimatedCardProps {
  title: string
  description?: string
  icon?: React.ReactNode
  delay?: number
  hoverEffect?: "lift" | "glow" | "none"
  children: ReactNode
}

export function AnimatedCard({ 
  title, 
  description, 
  icon, 
  delay = 0, 
  hoverEffect = "none", 
  children 
}: AnimatedCardProps) {
  const getHoverAnimation = () => {
    switch (hoverEffect) {
      case "lift":
        return {
          scale: 1.02,
          transition: { duration: 0.2 }
        }
      case "glow":
        return {
          boxShadow: "0 0 20px rgba(var(--primary-rgb), 0.3)",
          transition: { duration: 0.2 }
        }
      default:
        return {}
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={getHoverAnimation()}
    >
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            {icon && (
              <div className="shrink-0">
                {icon}
              </div>
            )}
            <div className="space-y-1.5">
              <h3 className="font-semibold">{title}</h3>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
          <div>{children}</div>
        </div>
      </Card>
    </motion.div>
  )
}

