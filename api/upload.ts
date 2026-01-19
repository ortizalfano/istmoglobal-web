import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Initialize S3 Client for Cloudflare R2
const R2 = new S3Client({
    region: 'us-east-1', // R2 requires a region, us-east-1 is the standard fallback
    endpoint: `https://${process.env.R2_ACCOUNT_ID?.trim()}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID?.trim() || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY?.trim() || '',
    },
    // Removing forcePathStyle: true as it can cause Access Denied on some R2 configurations
});

console.log('R2 Config:', {
    hasAccountId: !!process.env.R2_ACCOUNT_ID,
    hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
    hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET_NAME
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
        let buffer: Buffer;
        try {
            const base64Content = fileData.includes(',') ? fileData.split(',')[1] : fileData;
            buffer = Buffer.from(base64Content, 'base64');
        } catch (e) {
            return res.status(400).json({ error: 'Invalid file data format' });
        }

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
    } catch (error: any) {
        console.error('Error uploading to R2:', error);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(500).json({
            error: 'Error uploading file',
            details: error.message,
            stack: error.stack
        });
    }
}
