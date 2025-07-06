"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { AuthDialog } from "@/components/auth/auth-dialog"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Calendar, Loader2, Settings } from "lucide-react"

export function UserButton() {
  const router = useRouter()
  const { user, loading, signOut } = useAuth()
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  // Show a loading state while checking if user is authenticated
  if (loading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Loader2 className="h-5 w-5 animate-spin" />
      </Button>
    )
  }

  // If user is logged in, show the dropdown menu
  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative rounded-full">
            <Icons.user className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1 leading-none">
              {user.user_metadata?.full_name && (
                <p className="font-medium">{user.user_metadata.full_name}</p>
              )}
              {user.email && (
                <p className="w-[200px] truncate text-sm text-muted-foreground">
                  {user.email}
                </p>
              )}
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a 
              href="/saved-calendars"
              className="flex w-full items-center px-2 py-1.5 text-sm cursor-pointer"
            >
              <Calendar className="mr-2 h-4 w-4" />
              My Calendars
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a 
              href="/auth-status"
              className="flex w-full items-center px-2 py-1.5 text-sm cursor-pointer"
            >
              <Settings className="mr-2 h-4 w-4" />
              Auth Status
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-start cursor-pointer"
              onClick={() => signOut()}
            >
              Log out
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // If user is not logged in, show the login button with debug option
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Icons.user className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-start cursor-pointer"
              onClick={() => setShowAuthDialog(true)}
            >
              <Icons.user className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a 
              href="/auth-status"
              className="flex w-full items-center px-2 py-1.5 text-sm cursor-pointer"
            >
              <Settings className="mr-2 h-4 w-4" />
              Debug Auth Issues
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AuthDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog} 
      />
    </>
  )
} 