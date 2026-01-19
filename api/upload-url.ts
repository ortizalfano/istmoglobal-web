import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 Client for Cloudflare R2
const R2 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
});

export default async function handler(req: any, res: any) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { fileName, fileType } = req.query;

    if (!fileName || !fileType) {
        return res.status(400).json({ error: 'Missing fileName or fileType' });
    }

    try {
        const key = `uploads/${Date.now()}-${fileName}`;
        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            ContentType: fileType,
        });

        const uploadUrl = await getSignedUrl(R2, command, { expiresIn: 3600 });

        // Construct public URL (assuming public access is enabled on the bucket or via custom domain)
        // If user provided a custom domain, use it. Otherwise fall back to R2 dev URL logic if possible or just the raw key.
        const publicUrl = process.env.R2_PUBLIC_URL
            ? `${process.env.R2_PUBLIC_URL}/${key}`
            : `https://${process.env.R2_BUCKET_NAME}.r2.dev/${key}`; // Default R2.dev structure

        res.status(200).json({ uploadUrl, publicUrl });
    } catch (error) {
        console.error('Error generating signed URL:', error);
        res.status(500).json({ error: 'Error generating upload URL' });
    }
}
