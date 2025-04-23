export const corsConfig = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: process.env.CORS_METHODS || 'GET, POST, PUT, DELETE, OPTIONS',
  headers: process.env.CORS_HEADERS || 'Content-Type, Authorization',
  maxAge: process.env.CORS_MAX_AGE || '86400',
  credentials: process.env.CORS_CREDENTIALS === 'true',
};

export function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': corsConfig.origin,
    'Access-Control-Allow-Methods': corsConfig.methods,
    'Access-Control-Allow-Headers': corsConfig.headers,
    'Access-Control-Max-Age': corsConfig.maxAge,
    ...(corsConfig.credentials && { 'Access-Control-Allow-Credentials': 'true' }),
  };
} 