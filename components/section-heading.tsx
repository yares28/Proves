"use client"

import { motion } from "framer-motion"
import { useTranslations } from "@/hooks/use-translations"

/** The animated heading of the statistics section. */
export function SectionHeading() {
  const t = useTranslations()
  return (
    <div className="mb-16 text-center">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl"
      >
        {t("stats.headingPre")} <span className="text-primary">{t("stats.headingAccent")}</span>
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mx-auto max-w-2xl text-lg text-muted-foreground"
      >
        {t("stats.subtitle")}
      </motion.p>
    </div>
  )
}
