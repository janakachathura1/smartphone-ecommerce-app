import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();
const getSettingsFile = () => {
    return process.env.VERCEL
        ? path.join('/tmp', 'settings.json')
        : path.join(process.cwd(), 'settings.json');
};

const getSettings = () => {
    const file = getSettingsFile();
    try {
        if (fs.existsSync(file)) {
            return JSON.parse(fs.readFileSync(file, 'utf-8'));
        }
        
        // On Vercel, copy the template settings.json from project root to /tmp if it doesn't exist
        const defaultFile = path.join(process.cwd(), 'settings.json');
        if (fs.existsSync(defaultFile)) {
            const data = fs.readFileSync(defaultFile, 'utf-8');
            if (process.env.VERCEL) {
                fs.writeFileSync(file, data);
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

import { prisma } from '../lib/prisma.js';

router.get('/', async (req, res) => {
    let settings = getSettings();
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

router.post('/', authenticate, requireAdmin, (req, res) => {
    try {
        const file = getSettingsFile();
        const current = getSettings();
        const next = { ...current, ...req.body };
        fs.writeFileSync(file, JSON.stringify(next, null, 2));
        
        const responseData = replaceLocalhostUrls(next, req);
        res.json({ success: true, data: responseData });
    } catch (error) {
        console.error("Error writing settings:", error);
        res.status(500).json({ success: false, message: 'Failed to save settings: ' + error.message });
    }
});

export default router;
