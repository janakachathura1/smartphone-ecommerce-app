import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// Submit a new contact message
router.post('/', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Name, email, and message are required' });
        }

        const newMsg = await prisma.contactMessage.create({
            data: { name, email, subject, message }
        });

        res.json({ success: true, data: newMsg, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Contact error:', error);
        res.status(500).json({ success: false, message: 'Failed to send message' });
    }
});

router.get('/', authenticate, requireAdmin, async (req, res) => {
    try {
        const messages = await prisma.contactMessage.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: messages });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch messages' });
    }
});

// Mark as read or delete
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        await prisma.contactMessage.delete({
            where: { id: req.params.id }
        });
        res.json({ success: true, message: 'Message deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete message' });
    }
});

export default router;
