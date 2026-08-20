// Placeholder / type definition untuk @nuxtjs/supabase.
// Menghilangkan warning "Database types configured at ~/types/database.types.ts but file not found".
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = any
