// All environment variables are read here, once, so the rest of the code never
// touches process.env directly and a missing value fails at startup.
const env = process.env;

export const config = Object.freeze({
  nodeEnv: env.NODE_ENV || 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  port: Number(env.PORT) || 5050,
  dbUri: env.DB_URI,
  jwtSecret: env.JWT_SECRET,
  clientUrl: env.CLIENT_URL || 'http://localhost:5173',
  // Set when running behind a proxy (most hosts), so req.ip is the real client IP.
  trustProxy: env.TRUST_PROXY === 'true',
  stripeSecretKey: env.STRIPE_SECRET_KEY,
  googleApiKey: env.GOOGLE_API_KEY,
  geminiModel: env.GEMINI_MODEL || 'gemini-1.5-flash',
});

const REQUIRED = { dbUri: 'DB_URI', jwtSecret: 'JWT_SECRET' };

/** Throws when a variable the server cannot run without is missing. */
export function assertConfig() {
  const missing = Object.entries(REQUIRED)
    .filter(([key]) => !config[key])
    .map(([, name]) => name);
  if (missing.length) {
    throw new Error(
      `Missing environment variables: ${missing.join(', ')}. ` +
        'Copy server/.env.example to server/.env and fill it in.'
    );
  }
}
