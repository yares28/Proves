"use client"

import * as React from "react"
import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast" 
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { isAuthenticated } from "@/lib/auth/token-manager"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Calendar name is required" })
    .max(50, { message: "Calendar name cannot exceed 50 characters" })
})

type SaveCalendarFormValues = z.infer<typeof formSchema>

interface SaveCalendarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: Record<string, string[]>
  onSave: (name: string) => void
  existingNames?: string[]
}

export function SaveCalendarDialog({
  open,
  onOpenChange,
  filters,
  onSave,
  existingNames = [],
}: SaveCalendarDialogProps) {
  const { user, syncToken } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check if we have any active filters
  const hasActiveFilters = Object.values(filters).some(values => values.length > 0)

  const form = useForm<SaveCalendarFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  })

  async function onSubmit(values: SaveCalendarFormValues) {
    console.log('🔄 Starting calendar save process...');
    
    // Check for duplicate names
    if (existingNames.includes(values.name)) {
      console.log('⚠️ Duplicate calendar name detected:', values.name);
      form.setError("name", { 
        type: "manual", 
        message: "You already have a calendar with this name" 
      })
      return
    }

    // Validation to ensure user is logged in
    if (!user) {
      console.log('❌ Save calendar failed: User not logged in');
      toast({
        title: "Authentication required",
        description: "Please log in to save calendars",
        variant: "destructive",
      })
      onOpenChange(false)
      return
    }
    
    console.log('✅ User authenticated', { userId: user.id });

    setIsSubmitting(true)
    
    try {
      console.log('🔄 Synchronizing authentication tokens before save...');
      // Synchronize auth tokens before performing action
      const tokenSynced = await syncToken();
      
      if (!tokenSynced) {
        console.error('❌ Failed to synchronize authentication tokens');
        throw new Error("Failed to synchronize authentication state. Please log out and log in again.");
      }
      
      console.log('✅ Token synchronization successful');
      
      // Double check authentication after sync
      console.log('🔍 Verifying authentication status...');
      const authValid = await isAuthenticated();
      if (!authValid) {
        console.error('❌ Authentication validation failed after token sync');
        throw new Error("Authentication validation failed. Please log out and log in again.");
      }
      
      // Get auth token from localStorage to pass directly to server
      let authToken = null;
      try {
        const storedAuth = localStorage.getItem('supabase.auth.token');
        if (storedAuth) {
          const authData = JSON.parse(storedAuth);
          if (authData.currentSession?.access_token) {
            authToken = authData.currentSession.access_token;
            console.log("✅ Found auth token for direct server call");
          }
        }
      } catch (e) {
        console.error("Error extracting auth token:", e);
      }
      
      console.log('✅ Authentication verified, proceeding with save');
      console.log('📝 Saving calendar:', { name: values.name, filters: filters });
      
      // Call the parent component's save function with auth token
      onSave(values.name)
      
      // Show success toast
      toast({
        title: "Calendar saved",
        description: `Your calendar "${values.name}" has been saved successfully.`,
      })
      
      console.log('✅ Calendar save completed successfully');
      onOpenChange(false)
    } catch (error) {
      console.error("❌ Error saving calendar:", error)
      
      // Get specific error message if available
      const errorMessage = error instanceof Error ? error.message : 
        "An error occurred while saving your calendar. Please try again.";
      
      // Provide precise error guidance
      if (errorMessage.includes("authentication") || 
          errorMessage.includes("log in") ||
          errorMessage.includes("session")) {
        console.log('⚠️ Authentication-related error detected:', errorMessage);
        toast({
          title: "Session expired",
          description: "Your session has expired. Please log out and log in again to refresh your authentication.",
          variant: "destructive",
        })
      } else {
        console.log('⚠️ General error saving calendar:', errorMessage);
        toast({
          title: "Error saving calendar",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Calendar View</DialogTitle>
          <DialogDescription>
            Give your calendar view a name to save it for future use.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Calendar Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="My Exam Calendar" 
                      {...field} 
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !hasActiveFilters}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 