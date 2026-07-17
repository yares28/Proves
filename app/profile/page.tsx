"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/context/auth-context"
import { useSettings } from "@/context/settings-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/utils/supabase/client"
import { 
  User, 
  Mail, 
  Calendar, 
  Settings, 
  ArrowLeft,
  Moon,
  Sun,
  Globe,
  Shield,
  Palette,
  Clock,
  List,
  Lock,
  Eye,
  EyeOff,
  Camera
} from "lucide-react"
import React from "react"


interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  last_sign_in_at?: string
  provider?: string
}

interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  language: 'es' | 'en'
  notifications: boolean
  examReminders: {
    oneHour: boolean
    oneDay: boolean
    oneWeek: boolean
  }
  viewMode: 'calendar' | 'list'
}

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const { settings, updateSettings } = useSettings()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [showUsernameDialog, setShowUsernameDialog] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isChangingEmail, setIsChangingEmail] = useState(false)
  const [isChangingUsername, setIsChangingUsername] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Redirect if not authenticated
  useEffect(() => {
    // Only redirect if we're not loading and there's definitely no user
    if (!loading && !user) {
      console.log('🔄 No authenticated user found, redirecting to home...')
      // Add a small delay to ensure session restoration has time to complete
      const redirectTimer = setTimeout(() => {
        router.push('/')
      }, 100)
      
      return () => clearTimeout(redirectTimer)
    }
  }, [user, loading, router])

  // Load user profile data
  useEffect(() => {
    if (user) {
      const userProfile: UserProfile = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.user_metadata?.name,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        provider: user.app_metadata?.provider
      }
      setProfile(userProfile)
    }
  }, [user])

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  // Don't render anything if user is not authenticated (will redirect)
  if (!user) {
    return null
  }

  // Refresh user data after updates
  const refreshUserData = async () => {
    try {
      const { data: { user: updatedUser }, error } = await supabase.auth.getUser()
      if (!error && updatedUser) {
        const userProfile: UserProfile = {
          id: updatedUser.id,
          email: updatedUser.email || '',
          full_name: updatedUser.user_metadata?.full_name || updatedUser.user_metadata?.name,
          avatar_url: updatedUser.user_metadata?.avatar_url || updatedUser.user_metadata?.picture,
          created_at: updatedUser.created_at,
          last_sign_in_at: updatedUser.last_sign_in_at,
          provider: updatedUser.app_metadata?.provider
        }
        setProfile(userProfile)
      }
    } catch (error) {
      console.error('Error refreshing user data:', error)
    }
  }

  // Upload a new avatar directly from the browser to Supabase Storage.
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file later
    if (!file || !user) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "El archivo debe ser una imagen.",
        variant: "destructive",
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen no puede superar los 5 MB.",
        variant: "destructive",
      })
      return
    }

    setIsUploadingAvatar(true)
    try {
      const ext = file.name.split('.').pop() || 'png'
      const filePath = `${user.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      })

      if (updateError) throw updateError

      setProfile((prev) => (prev ? { ...prev, avatar_url: publicUrl } : prev))
      await refreshUserData()

      toast({
        title: "Foto actualizada",
        description: "Tu foto de perfil se ha actualizado correctamente.",
      })
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "No se pudo subir la imagen. Intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  // Get provider badge
  const getProviderBadge = () => {
    if (!profile?.provider) return null
    
    const providers = {
      google: { label: 'Google', color: 'bg-blue-100 text-blue-800' },
      email: { label: 'Email', color: 'bg-gray-100 text-gray-800' }
    }
    
    const provider = providers[profile.provider as keyof typeof providers]
    return provider ? (
      <Badge className={provider.color}>
        {provider.label}
      </Badge>
    ) : null
  }

  // Handle password change
  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden.",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres.",
        variant: "destructive",
      })
      return
    }

    if (!currentPassword) {
      toast({
        title: "Error",
        description: "Por favor introduce tu contraseña actual.",
        variant: "destructive",
      })
      return
    }

    setIsChangingPassword(true)
    try {
      // First verify current password
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: profile?.email || '',
        password: currentPassword
      })

      if (verifyError) {
        toast({
          title: "Error",
          description: "La contraseña actual es incorrecta.",
          variant: "destructive",
        })
        return
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) {
        console.error('Error changing password:', error)
        toast({
          title: "Error",
          description: error.message || "No se pudo actualizar la contraseña. Intenta de nuevo.",
          variant: "destructive",
        })
        return
      }
      
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña se ha actualizado correctamente.",
      })
      
      setShowPasswordDialog(false)
      setNewPassword('')
      setConfirmPassword('')
      setCurrentPassword('')
      setShowPassword(false)
      setShowConfirmPassword(false)
      setShowCurrentPassword(false)
      
    } catch (error) {
      console.error('Error changing password:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la contraseña. Intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Handle email change
  const handleEmailChange = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast({
        title: "Error",
        description: "Por favor introduce un email válido.",
        variant: "destructive",
      })
      return
    }

    setIsChangingEmail(true)
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      })
      
      if (error) {
        console.error('Error changing email:', error)
        toast({
          title: "Error",
          description: error.message || "No se pudo actualizar el email. Intenta de nuevo.",
          variant: "destructive",
        })
        return
      }
      
      toast({
        title: "Email actualizado",
        description: "Se ha enviado un correo de confirmación a tu nueva dirección de email.",
      })
      
      setShowEmailDialog(false)
      setNewEmail('')
      
      // Refresh user data to get updated email
      await refreshUserData()
      
    } catch (error) {
      console.error('Error changing email:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el email. Intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsChangingEmail(false)
    }
  }

  // Handle username change
  const handleUsernameChange = async () => {
    if (!newUsername || newUsername.trim().length < 2) {
      toast({
        title: "Error",
        description: "El nombre de usuario debe tener al menos 2 caracteres.",
        variant: "destructive",
      })
      return
    }

    setIsChangingUsername(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: newUsername.trim()
        }
      })
      
      if (error) {
        console.error('Error changing username:', error)
        toast({
          title: "Error",
          description: error.message || "No se pudo actualizar el nombre de usuario. Intenta de nuevo.",
          variant: "destructive",
        })
        return
      }
      
      // Update local profile state
      if (profile) {
        setProfile({
          ...profile,
          full_name: newUsername.trim()
        })
      }
      
      toast({
        title: "Usuario actualizado",
        description: "Tu nombre de usuario se ha actualizado correctamente.",
      })
      
      setShowUsernameDialog(false)
      setNewUsername('')
      
      // Refresh user data to ensure consistency
      await refreshUserData()
      
    } catch (error) {
      console.error('Error changing username:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el nombre de usuario. Intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsChangingUsername(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Perfil de Usuario</h1>
          <p className="text-muted-foreground">Gestiona tu información personal y configuración</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
            <CardDescription>
              Tu información de perfil y avatar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={profile?.avatar_url}
                  alt="Avatar del usuario"
                />
                <AvatarFallback className="text-lg">
                  {profile?.full_name ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : profile?.email?.slice(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  ) : (
                    <Camera className="h-4 w-4 mr-2" />
                  )}
                  {isUploadingAvatar ? 'Subiendo...' : 'Cambiar foto'}
                </Button>
                <p className="text-xs text-muted-foreground">JPG o PNG, máx 5 MB</p>
              </div>
            </div>

            <Separator />

            {/* User Details */}
            <div className="flex flex-col gap-6">
              {/* Email */}
              <div className="flex items-center gap-5">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 flex flex-col gap-1">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex gap-3">
                    <Input
                      id="email"
                      value={profile?.email || ''}
                      disabled
                      className="flex-1 h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Usuario */}
              <div className="flex items-center gap-5">
                <User className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 flex flex-col gap-1">
                  <Label htmlFor="name">Usuario</Label>
                  <div className="flex gap-3">
                    <Input
                      id="name"
                      value={profile?.full_name || ''}
                      disabled
                      className="flex-1 h-10"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 min-w-[140px] px-4"
                      onClick={() => setShowUsernameDialog(true)}
                    >
                      Cambiar usuario
                    </Button>
                  </div>
                </div>
              </div>

              {/* Cuenta creada */}
              <div className="flex items-center gap-5">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 flex flex-col gap-1">
                  <Label>Cuenta creada</Label>
                  <p className="text-sm text-muted-foreground h-10 flex items-center">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('es-ES') : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Contraseña */}
              <div className="flex items-center gap-5">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 flex items-center gap-3">
                  <Label className="whitespace-nowrap">Contraseña:</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 min-w-[140px] px-4"
                    onClick={() => setShowPasswordDialog(true)}
                  >
                    Cambiar contraseña
                  </Button>
                </div>
              </div>

              {/* Password Change Dialog */}
              <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Cambiar contraseña</DialogTitle>
                    <DialogDescription>
                      Introduce tu contraseña actual y la nueva contraseña. La nueva contraseña debe tener al menos 6 caracteres.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Contraseña actual</Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Contraseña actual"
                          className="h-10 pr-12"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          tabIndex={-1}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">Nueva contraseña</Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Nueva contraseña"
                          className="h-10 pr-12"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirmar contraseña"
                          className="h-10 pr-12"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPasswordDialog(false)
                        setNewPassword('')
                        setConfirmPassword('')
                        setCurrentPassword('')
                        setShowPassword(false)
                        setShowConfirmPassword(false)
                        setShowCurrentPassword(false)
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handlePasswordChange}
                      disabled={isChangingPassword || !newPassword || !confirmPassword || !currentPassword}
                    >
                      {isChangingPassword ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : null}
                      {isChangingPassword ? 'Actualizando...' : 'Actualizar contraseña'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Email Change Dialog */}
              <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Cambiar correo</DialogTitle>
                    <DialogDescription>
                      Introduce tu nuevo email. Recibirás un correo de confirmación.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-email">Nuevo email</Label>
                      <Input
                        id="new-email"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="nuevo@email.com"
                        className="h-10"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowEmailDialog(false)
                        setNewEmail('')
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleEmailChange}
                      disabled={isChangingEmail || !newEmail}
                    >
                      {isChangingEmail ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : null}
                      {isChangingEmail ? 'Actualizando...' : 'Actualizar email'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Username Change Dialog */}
              <Dialog open={showUsernameDialog} onOpenChange={setShowUsernameDialog}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Cambiar nombre de usuario</DialogTitle>
                    <DialogDescription>
                      Introduce tu nuevo nombre de usuario.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-username">Nuevo nombre de usuario</Label>
                      <Input
                        id="new-username"
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="Nuevo nombre de usuario"
                        className="h-10"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowUsernameDialog(false)
                        setNewUsername('')
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleUsernameChange}
                      disabled={isChangingUsername || !newUsername}
                    >
                      {isChangingUsername ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : null}
                      {isChangingUsername ? 'Actualizando...' : 'Actualizar usuario'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* App Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración de la Aplicación
            </CardTitle>
            <CardDescription>
              Personaliza tu experiencia de usuario
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme Settings */}
            <div className="space-y-4">
                             <div className="flex items-start gap-2">
                 <Palette className="h-4 w-4 text-muted-foreground mt-2" />
                 <div className="flex-1">
                   <Label>Tema</Label>
                   <div className="flex gap-2 mt-2">
                     {(['light', 'dark',] as const).map((theme) => (
                       <Button
                         key={theme}
                         variant={settings.theme === theme ? "default" : "outline"}
                         size="sm"
                         onClick={() => updateSettings({ theme })}
                       >
                         {theme === 'light' && <Sun className="h-4 w-4 mr-1" />}
                         {theme === 'dark' && <Moon className="h-4 w-4 mr-1" />}
                         {theme === 'light' ? 'Claro' : theme === 'dark' ? 'Oscuro' : ''}
                       </Button>
                     ))}
                   </div>
                 </div>
               </div>

               <div className="flex items-start gap-2">
                 <Globe className="h-4 w-4 text-muted-foreground mt-2" />
                 <div className="flex-1">
                   <Label>Idioma</Label>
                   <div className="flex gap-2 mt-2">
                     {(['es', 'en'] as const).map((lang) => (
                       <Button
                         key={lang}
                         variant={settings.language === lang ? "default" : "outline"}
                         size="sm"
                         onClick={() => updateSettings({ language: lang })}
                       >
                         {lang === 'es' ? '🇪🇸 Español' : '🇺🇸 English'}
                       </Button>
                     ))}
                   </div>
                 </div>
               </div>
            </div>

            <Separator />

                         {/* Notification Settings */}
             <div className="space-y-4">
               

               {/* Exam Reminders */}
               <div className="space-y-3">
                 <div className="flex items-center gap-2">
                   <Clock className="h-4 w-4 text-muted-foreground" />
                   <div>
                     <Label>Recordatorios de exámenes</Label>
                     <p className="text-xs text-muted-foreground">
                       Configura cuándo recibir recordatorios
                     </p>
                   </div>
                 </div>
                 <div className="ml-6 space-y-3">
                   <div className="flex items-center justify-between">
                     <div>
                       <Label className="text-sm">1 hora antes</Label>
                     </div>
                     <Switch
                       checked={settings.examReminders.oneHour}
                       onCheckedChange={(checked) => updateSettings({ 
                         examReminders: { ...settings.examReminders, oneHour: checked }
                       })}
                     />
                   </div>
                   <div className="flex items-center justify-between">
                     <div>
                       <Label className="text-sm">1 día antes</Label>
                     </div>
                     <Switch
                       checked={settings.examReminders.oneDay}
                       onCheckedChange={(checked) => updateSettings({ 
                         examReminders: { ...settings.examReminders, oneDay: checked }
                       })}
                     />
                   </div>
                   <div className="flex items-center justify-between">
                     <div>
                       <Label className="text-sm">1 semana antes</Label>
                     </div>
                     <Switch
                       checked={settings.examReminders.oneWeek}
                       onCheckedChange={(checked) => updateSettings({ 
                         examReminders: { ...settings.examReminders, oneWeek: checked }
                       })}
                     />
                   </div>
                 </div>
               </div>
                <div className="flex items-start gap-2">
                  <List className="h-4 w-4 text-muted-foreground mt-4" />
                  <div className="flex-1">
                    <Label>Modo de visualización</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Elige cómo prefieres ver los exámenes
                    </p>
                    <SegmentedControl
                      value={settings.viewMode}
                      onValueChange={(value) => updateSettings({ viewMode: value as 'calendar' | 'list' })}
                      className="w-full"
                    >
                      <SegmentedControlItem value="calendar" className="flex-1">
                        <Calendar className="h-4 w-4 mr-2" />
                        Calendario
                      </SegmentedControlItem>
                      <SegmentedControlItem value="list" className="flex-1">
                        <List className="h-4 w-4 mr-2" />
                        Lista
                      </SegmentedControlItem>
                    </SegmentedControl>
                  </div>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 