import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xdnfvbiicxfvfgwnmqsv.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_SWHcoeauJnMsjY_0I_WvTw_wVPfyfIW";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
