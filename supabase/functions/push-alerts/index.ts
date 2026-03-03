import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    // 1. Grab the new notification row sent by the Webhook
    const payload = await req.json()
    const notification = payload.record 

    if (!notification || !notification.user_id) {
      return new Response("Missing record data", { status: 400 })
    }

    // 2. Connect to Supabase as an Admin (bypasses security rules to read the users table)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    )

    // Fetch the Expo Push Token for the specific user
    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select('expo_push_token')
      .eq('id', notification.user_id)
      .single()

    // If the user hasn't logged in on a phone yet, they won't have a token.
    if (error || !userData?.expo_push_token) {
      console.log("No push token found for user:", notification.user_id)
      return new Response("No push token found", { status: 200 }) 
    }

    // 3. Send the message directly to Expo's Push Servers
    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: userData.expo_push_token,
        title: notification.title,
        body: notification.body,
        sound: 'default',
        priority: 'high',
        data: { screen: 'Notifications' }, 
      }),
    })

    const expoResult = await expoResponse.json()
    
    return new Response(JSON.stringify(expoResult), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})