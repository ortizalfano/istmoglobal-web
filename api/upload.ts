import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Initialize S3 Client for Cloudflare R2
const R2 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
});

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.status(200).end();
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { fileName, fileType, fileData } = req.body;

        if (!fileName || !fileType || !fileData) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Convert base64 to buffer
        const buffer = Buffer.from(fileData.split(',')[1], 'base64');

        const key = `uploads/${Date.now()}-${fileName}`;

        // Upload directly to R2 from the server
        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: fileType,
        });

        await R2.send(command);

        // Construct public URL
        const publicUrl = process.env.R2_PUBLIC_URL
            ? `${process.env.R2_PUBLIC_URL}/${key}`
            : `https://${process.env.R2_BUCKET_NAME}.r2.dev/${key}`;

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json({ publicUrl });
    } catch (error) {
        console.error('Error uploading to R2:', error);
        res.status(500).json({ error: 'Error uploading file' });
    }
}
