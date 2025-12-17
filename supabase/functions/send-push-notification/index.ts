import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  user_ids?: string[];
  role?: "vendor" | "chef";
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const fcmServerKey = Deno.env.get("FCM_SERVER_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: PushPayload = await req.json();
    const { title, body, data, user_ids, role } = payload;

    console.log("Received push notification request:", { title, body, role, user_ids_count: user_ids?.length });

    // Get target user IDs based on role or explicit list
    let targetUserIds: string[] = [];

    if (user_ids && user_ids.length > 0) {
      targetUserIds = user_ids;
    } else if (role) {
      // Get all users with the specified role
      const { data: roleUsers, error: roleError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", role);

      if (roleError) {
        console.error("Error fetching role users:", roleError);
        throw roleError;
      }

      targetUserIds = roleUsers?.map((r) => r.user_id) || [];
    }

    if (targetUserIds.length === 0) {
      console.log("No target users found");
      return new Response(
        JSON.stringify({ success: true, message: "No target users found", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${targetUserIds.length} target users`);

    // Get push tokens for target users
    const { data: tokens, error: tokensError } = await supabase
      .from("push_tokens")
      .select("token, platform, user_id")
      .in("user_id", targetUserIds);

    if (tokensError) {
      console.error("Error fetching tokens:", tokensError);
      throw tokensError;
    }

    if (!tokens || tokens.length === 0) {
      console.log("No push tokens found for target users");
      return new Response(
        JSON.stringify({ success: true, message: "No push tokens found", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${tokens.length} push tokens`);

    // Separate tokens by platform
    const androidTokens = tokens.filter((t) => t.platform === "android").map((t) => t.token);
    const iosTokens = tokens.filter((t) => t.platform === "ios").map((t) => t.token);

    let sentCount = 0;

    // Send to Android via FCM
    if (androidTokens.length > 0 && fcmServerKey) {
      console.log(`Sending to ${androidTokens.length} Android devices`);
      
      const fcmResponse = await fetch("https://fcm.googleapis.com/fcm/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `key=${fcmServerKey}`,
        },
        body: JSON.stringify({
          registration_ids: androidTokens,
          notification: {
            title,
            body,
            sound: "default",
          },
          data: data || {},
        }),
      });

      const fcmResult = await fcmResponse.json();
      console.log("FCM response:", fcmResult);
      sentCount += fcmResult.success || 0;
    }

    // For iOS, we'd use APNS - placeholder for now
    // iOS push notifications require APNS setup with certificates
    if (iosTokens.length > 0) {
      console.log(`Found ${iosTokens.length} iOS devices - APNS not yet configured`);
      // TODO: Implement APNS when credentials are available
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount,
        android_tokens: androidTokens.length,
        ios_tokens: iosTokens.length,
        message: iosTokens.length > 0 ? "iOS notifications pending APNS setup" : "Notifications sent"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending push notification:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
