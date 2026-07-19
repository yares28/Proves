"use client"

import { useTranslations } from "@/hooks/use-translations"

/**
 * The "Encuentra tus Exámenes" section heading. It lives in a client component
 * because the homepage that hosts it is a server component and cannot read the
 * language chosen in the client-side settings.
 */
export function HomeHeading() {
  const t = useTranslations()
  return (
    <h2 className="mb-12 text-center text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
      {t("home.findPre")} <span className="text-primary">{t("home.findAccent")}</span>
    </h2>
  )
}
