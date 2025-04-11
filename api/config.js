export default function handler(req, res) {
  res.status(200).json({
    supabaseUrl: process.env.SUPABASE_URL,
    publicAnonKey: process.env.SUPABASE_ANON_KEY,
  });
}
