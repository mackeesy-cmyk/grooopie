/**
 * Application configuration
 * Uses environment variables with fallbacks for local development
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
