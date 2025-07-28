"use client"

import { ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { FindExamCard } from "@/components/find-exam-card"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import Image from "next/image"
import { useSettings } from "@/context/settings-context"

export function HeroSection() {
  const { theme } = useTheme()
  const { settings } = useSettings()
  const [mounted, setMounted] = useState(false)

  // Only render after mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Determine which logo to use based on theme
  const getHeroLogo = () => {
    if (!mounted) return "/logo-full2.png" // Default fallback during SSR
    const currentTheme = settings.theme === 'system' ? theme : settings.theme
    return currentTheme === "light" ? "/logo-full-light.png" : "/logo-full2.png"
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 px-4 py-20 dark:from-emerald-950 dark:to-emerald-900 md:py-28 lg:py-36">
      {/* Enhanced background pattern */}
      <div className="absolute inset-0 -z-10">
        <svg
          className="absolute inset-0 h-full w-full opacity-30 dark:opacity-10"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
        >
          <defs>
            <pattern
              id="grid-pattern"
              patternUnits="userSpaceOnUse"
              width="100"
              height="100"
              patternTransform="scale(0.5) rotate(0)"
            >
              <rect x="0" y="0" width="100%" height="100%" fill="none" />
              <path
                d="M100,0 L100,100 L0,100"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                strokeOpacity="0.3"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      </div>

      {/* Animated background elements */}
      <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl"></div>
      <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-primary/10 blur-3xl"></div>

      {/* Floating logo icons as animated particles */}
      <div className="absolute inset-0 -z-5">
        <motion.div 
          className="absolute left-1/4 top-1/4 opacity-20"
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 5, 0]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Image 
            src="/logo-icon.png" 
            alt="UPV Logo" 
            width={32} 
            height={32}
            className="blur-sm"
          />
        </motion.div>
        <motion.div
          className="absolute left-3/4 top-1/3 opacity-15"
          animate={{ 
            y: [0, -25, 0],
            rotate: [0, -3, 0]
          }}
          transition={{ 
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        >
          <Image 
            src="/logo-icon.png" 
            alt="UPV Logo" 
            width={28} 
            height={28}
            className="blur-sm"
          />
        </motion.div>
        <motion.div
          className="absolute left-1/3 top-2/3 opacity-25"
          animate={{ 
            y: [0, -15, 0],
            rotate: [0, 4, 0]
          }}
          transition={{ 
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        >
          <Image 
            src="/logo-icon.png" 
            alt="UPV Logo" 
            width={24} 
            height={24}
            className="blur-sm"
          />
        </motion.div>
        <motion.div
          className="absolute left-2/3 top-1/2 opacity-20"
          animate={{ 
            y: [0, -30, 0],
            rotate: [0, -2, 0]
          }}
          transition={{ 
            duration: 4.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3
          }}
        >
          <Image 
            src="/logo-icon.png" 
            alt="UPV Logo" 
            width={36} 
            height={36}
            className="blur-sm"
          />
        </motion.div>
      </div>

      <div className="container relative mx-auto max-w-7xl">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center lg:col-span-7 lg:text-left"
          >
            {/* Logo Section */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-6 flex justify-center lg:justify-start"
            >
              <div className="relative">
                <Image 
                  src={getHeroLogo()}
                  alt="UPV Calendario de Exámenes" 
                  width={260} 
                  height={110}
                  className="h-auto w-auto max-w-[260px] drop-shadow-lg"
                  priority
                />
                {/* Subtle glow effect behind logo */}
                <div className="absolute inset-0 -z-10 scale-110 blur-xl bg-primary/20 rounded-lg"></div>
              </div>
            </motion.div>

            <h1 className="mb-5 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl xl:text-6xl">
              Encuentra tu{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-primary">Calendario de Exámenes</span>
                <span className="absolute bottom-2 left-0 z-0 h-4 w-full bg-primary/20"></span>
              </span>
            </h1>
            <p className="mx-auto mb-6 max-w-2xl text-base text-emerald-800/80 dark:text-emerald-100/80 md:text-lg lg:mx-0 lg:text-xl">
              Descubre, filtra y organiza tu calendario de exámenes universitarios de la UPV.
              Nunca más te pierdas una fecha importante de examen.
            </p>

            
          </motion.div>

          {/* Find Your Exam Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="lg:col-span-5"
          >
            <FindExamCard />
          </motion.div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce"
      >
        <ArrowDown className="h-6 w-6 text-primary/70" />
      </motion.div>
    </section>
  )
}
