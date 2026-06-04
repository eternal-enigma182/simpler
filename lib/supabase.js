import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://ocddvxpaxyrcrxagbqsq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jZGR2eHBheXlyY3J4YWdicXNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MjMyODYsImV4cCI6MjA5NjA5OTI4Nn0.19M7ZIp6pRHNY3fobkdwseZmeOUHSbDTQXMeewqohnI'
)