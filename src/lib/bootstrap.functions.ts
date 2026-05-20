import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const DEMO_SCHOOL_ID = "11111111-1111-1111-1111-111111111111";

/**
 * On first login, if the user has no school and no roles assigned,
 * attach them to the demo school as a school_admin so they can
 * explore the full app immediately. Production deployments should
 * replace this with an invite/onboarding flow.
 */
export const bootstrapUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, school_id")
      .eq("id", userId)
      .maybeSingle();

    if (!profile) {
      // trigger should have created it; do nothing
      return { ok: true, assigned: false };
    }

    if (profile.school_id) {
      return { ok: true, assigned: false };
    }

    const { data: existingRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (!existingRoles || existingRoles.length === 0) {
      await supabaseAdmin
        .from("profiles")
        .update({ school_id: DEMO_SCHOOL_ID })
        .eq("id", userId);
      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role: "school_admin", school_id: DEMO_SCHOOL_ID });
      return { ok: true, assigned: true };
    }

    return { ok: true, assigned: false };
  });
