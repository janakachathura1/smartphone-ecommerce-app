import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();
const SETTINGS_FILE = path.join(process.cwd(), 'settings.json');

const getSettings = () => {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
        }
    } catch (e) {}
    // Default video
    return {
        homepageVideoUrl: "https://www.w3schools.com/html/mov_bbb.mp4"
    };
};

import { prisma } from '../lib/prisma.js';

router.get('/', async (req, res) => {
    const settings = getSettings();
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
    const current = getSettings();
    const next = { ...current, ...req.body };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(next, null, 2));
    res.json({ success: true, data: next });
});

export default router;
