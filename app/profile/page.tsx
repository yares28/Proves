"use client"

import { useState, useEffect } from "react"
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
import { useToast } from "@/hooks/use-toast"
import { 
  User, 
  Mail, 
  Calendar, 
  Settings, 
  Camera, 
  Upload, 
  Trash2, 
  Save,
  ArrowLeft,
  Bell,
  Moon,
  Sun,
  Globe,
  Shield,
  Download,
  Palette,
  Clock,
  List
} from "lucide-react"


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
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [newAvatar, setNewAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
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



  // Handle avatar file selection
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Por favor selecciona un archivo de imagen válido.",
          variant: "destructive",
        })
        return
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "La imagen debe ser menor a 5MB.",
          variant: "destructive",
        })
        return
      }

      setNewAvatar(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Upload avatar using API route
  const uploadAvatar = async () => {
    if (!newAvatar || !user) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', newAvatar)

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const { avatar_url } = await response.json()

      // Update local profile
      setProfile(prev => prev ? { ...prev, avatar_url } : null)
      setNewAvatar(null)
      setAvatarPreview(null)

      toast({
        title: "Avatar actualizado",
        description: "Tu foto de perfil se ha actualizado correctamente.",
      })

    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el avatar. Intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Remove avatar using API route
  const removeAvatar = async () => {
    if (!user) return

    setIsUploading(true)
    try {
      const response = await fetch('/api/profile/avatar', {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Remove failed')
      }

      setProfile(prev => prev ? { ...prev, avatar_url: undefined } : null)
      setNewAvatar(null)
      setAvatarPreview(null)

      toast({
        title: "Avatar removido",
        description: "Tu foto de perfil se ha removido correctamente.",
      })

    } catch (error) {
      console.error('Error removing avatar:', error)
      toast({
        title: "Error",
        description: "No se pudo remover el avatar. Intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Get user initials
  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    return profile?.email?.slice(0, 2).toUpperCase() || 'U'
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
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
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage 
                    src={avatarPreview || profile?.avatar_url} 
                    alt="Avatar del usuario"
                  />
                  <AvatarFallback className="text-lg">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="outline"
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                  onClick={() => document.getElementById('avatar-input')?.click()}
                  disabled={isUploading}
                >
                  <Camera className="h-4 w-4" />
                </Button>
                <input
                  id="avatar-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  {newAvatar && (
                    <>
                      <Button
                        size="sm"
                        onClick={uploadAvatar}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Guardar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setNewAvatar(null)
                          setAvatarPreview(null)
                        }}
                      >
                        Cancelar
                      </Button>
                    </>
                  )}
                  {profile?.avatar_url && !newAvatar && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={removeAvatar}
                      disabled={isUploading}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remover
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {newAvatar ? 'Nueva imagen seleccionada' : 'Haz clic en la cámara para cambiar tu foto'}
                </p>
              </div>
            </div>

            <Separator />

            {/* User Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profile?.email || ''}
                    disabled
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input
                    id="name"
                    value={profile?.full_name || ''}
                    disabled
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <Label>Cuenta creada</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('es-ES') : 'N/A'}
                  </p>
                </div>
              </div>

              {getProviderBadge() && (
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <Label>Método de autenticación</Label>
                    <div className="mt-1">
                      {getProviderBadge()}
                    </div>
                  </div>
                </div>
              )}
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
                     {(['light', 'dark', 'system'] as const).map((theme) => (
                       <Button
                         key={theme}
                         variant={settings.theme === theme ? "default" : "outline"}
                         size="sm"
                         onClick={() => updateSettings({ theme })}
                       >
                         {theme === 'light' && <Sun className="h-4 w-4 mr-1" />}
                         {theme === 'dark' && <Moon className="h-4 w-4 mr-1" />}
                         {theme === 'system' && <Settings className="h-4 w-4 mr-1" />}
                         {theme === 'light' ? 'Claro' : theme === 'dark' ? 'Oscuro' : 'Sistema'}
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

                               {/* View Mode */}
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