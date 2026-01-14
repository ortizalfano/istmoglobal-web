import { neon } from '@neondatabase/serverless';

// NOTE: In a production environment, database credentials should NEVER be exposed 
// in client-side code. This setup is for demonstration/prototyping purposes only.
// For production, you should use a backend (like Vercel Functions or next.js API routes)
// to handle database connections securely.

const DATABASE_URL = 'postgresql://neondb_owner:npg_9HTvOZ5tuDXR@ep-red-bar-a4mc2ic0-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const sql = neon(DATABASE_URL);

export default sql;
