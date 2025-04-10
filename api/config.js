// /api/config.js
export default function handler(req, res) {
  res.status(200).json({
    supabaseUrl: process.env.SUPABASE_URL,
    // gib NICHT den service_role_key aus!
    publicAnonKey: process.env.SUPABASE_ANON_KEY // das ist der Key für den Client
  });
}
