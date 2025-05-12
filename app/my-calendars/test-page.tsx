"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function TestPage() {
  const router = useRouter()
  
  return (
    <div className="container py-8 text-center">
      <h1 className="text-3xl font-bold mb-4">Test Page</h1>
      <p className="mb-4">This is a test page to verify routing is working correctly.</p>
      <Button onClick={() => router.push("/")}>Go Home</Button>
    </div>
  )
} 