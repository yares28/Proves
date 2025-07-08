// Google Identity Services API types
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfiguration) => void
          prompt: () => void
          cancel: () => void
        }
      }
    }
  }
}

interface GoogleIdConfiguration {
  client_id: string
  callback: (response: CredentialResponse) => void
  nonce?: string
  use_fedcm_for_prompt?: boolean
  auto_select?: boolean
  cancel_on_tap_outside?: boolean
  context?: 'signin' | 'signup' | 'use'
}

interface CredentialResponse {
  credential: string
  select_by?: 'auto' | 'user' | 'user_1tap' | 'user_2tap' | 'btn' | 'btn_confirm' | 'brn_add_session' | 'btn_confirm_add_session'
}

export {}; 