"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/icons"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  rememberMe: z.boolean().default(true)
})

type FormValues = z.infer<typeof formSchema>

interface LoginFormProps {
  onSuccess: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { signIn, signInWithProvider } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true
    },
  })

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { error } = await signIn(data.email, data.password)
      if (error) {
        setError(error.message)
        return
      }
      
      // If rememberMe is selected, set a longer session in localStorage
      if (data.rememberMe) {
        // Get the actual session
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData && sessionData.session) {
          // Store the actual session object
          localStorage.setItem('supabase.auth.token', JSON.stringify({
            currentSession: sessionData.session
          }));
          console.log("Session stored in localStorage");
        }
      }
      
      onSuccess()
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleProviderSignIn = async (provider: "google" | "github" | "facebook") => {
    setIsLoading(true)
    setError(null)
    
    try {
      await signInWithProvider(provider)
    } catch (err) {
      setError("Failed to sign in with provider. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 py-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your email" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Enter your password" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Remember me for 30 days
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> Please wait
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </Form>
      
      <div className="relative flex items-center">
        <div className="flex-grow border-t"></div>
        <span className="mx-4 flex-shrink text-xs text-muted-foreground">OR CONTINUE WITH</span>
        <div className="flex-grow border-t"></div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          type="button"
          disabled={isLoading}
          onClick={() => handleProviderSignIn("google")}
        >
          <Icons.google className="mr-2 h-4 w-4" />
          Google
        </Button>
        <Button
          variant="outline"
          type="button"
          disabled={isLoading}
          onClick={() => handleProviderSignIn("github")}
        >
          <Icons.github className="mr-2 h-4 w-4" />
          GitHub
        </Button>
      </div>
    </div>
  )
} 