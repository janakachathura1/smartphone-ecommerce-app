import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

const getSettings = async () => {
    try {
        const record = await prisma.systemSetting.findUnique({
            where: { id: 'default' }
        });
        if (record) {
            return JSON.parse(record.value);
        }
        
        // Try resolving settings.json relative to process.cwd() or backend subdirectory
        let defaultFile = path.join(process.cwd(), 'settings.json');
        if (!fs.existsSync(defaultFile)) {
            defaultFile = path.join(process.cwd(), 'backend', 'settings.json');
        }

        if (fs.existsSync(defaultFile)) {
            const data = fs.readFileSync(defaultFile, 'utf-8');
            try {
                // Seed the database with the file content
                await prisma.systemSetting.upsert({
                    where: { id: 'default' },
                    update: { value: data },
                    create: { id: 'default', value: data }
                });
            } catch (seedErr) {
                console.error("Error seeding settings to DB:", seedErr);
            }
            return JSON.parse(data);
        }
    } catch (e) {
        console.error("Error reading settings:", e);
    }
    // Default video
    return {
        homepageVideoUrl: "https://www.w3schools.com/html/mov_bbb.mp4"
    };
};

const replaceLocalhostUrls = (settings, req) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const baseUrl = process.env.BASE_URL || `${protocol}://${req.get('host')}`;
    
    try {
        const settingsStr = JSON.stringify(settings);
        const updatedStr = settingsStr.replace(/http:\/\/localhost:5000/g, baseUrl);
        return JSON.parse(updatedStr);
    } catch (e) {
        return settings;
    }
};

router.get('/', async (req, res) => {
    let settings = await getSettings();
    settings = replaceLocalhostUrls(settings, req);
    try {
        const admin = await prisma.user.findFirst({
            where: { role: 'admin', isActive: true }
        });
        settings.adminPhone = settings.contactPhone || admin?.phone || '+880 170 000 0000';
        settings.adminEmail = settings.contactEmail || admin?.email || 'support@techpulse.com';
        settings.adminName = admin ? `${admin.firstName} ${admin.lastName}` : 'TechPulse Support';
        res.json({ success: true, data: settings });
    } catch (e) {
        res.json({ success: true, data: settings });
    }
});

router.post('/', authenticate, requireAdmin, async (req, res) => {
    try {
        const current = await getSettings();
        const next = { ...current, ...req.body };
        
        await prisma.systemSetting.upsert({
            where: { id: 'default' },
            update: { value: JSON.stringify(next) },
            create: { id: 'default', value: JSON.stringify(next) }
        });
        
        const responseData = replaceLocalhostUrls(next, req);
        res.json({ success: true, data: responseData });
    } catch (error) {
        console.error("Error writing settings:", error);
        res.status(500).json({ success: false, message: 'Failed to save settings: ' + error.message });
    }
});

export default router;
