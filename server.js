require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Persistent Storage Helper
// Persistent Storage Helper (Use /tmp in Vercel environment as root is read-only)
const DATA_FILE = process.env.VERCEL
    ? path.join('/tmp', 'data.json')
    : path.join(__dirname, 'data.json');

// Memory fallback if FS fails (common in serverless if /tmp is tricky or cold start issues)
let memoryStore = { bookings: [], contacts: [], subscribers: [] };

function getData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            // Initiate /tmp file if it doesn't exist
            fs.writeFileSync(DATA_FILE, JSON.stringify(memoryStore));
            return memoryStore;
        }
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (err) {
        console.error('[FS READ ERROR] Using in-memory fallback:', err.message);
        return memoryStore;
    }
}

function saveData(data) {
    try {
        memoryStore = data; // Always update memory
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('[FS WRITE ERROR]', err.message);
    }
}

// ... (Email Transporter setup remains the same)
// Email Transporter (Wrapped in try/catch to avoid crash on startup if ENVs missing)
let transporter;
try {
    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_PORT == 465,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
} catch (err) {
    console.error('[NODEMAILER SETUP ERROR]', err.message);
}

// Routes

// 1. Serving Frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 2. Booking API
app.post('/api/book', async (req, res) => {
    try {
        const { name, email, phone, service, date, time } = req.body;

        if (!name || !email || !date || !time) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const data = getData();
        const clash = data.bookings.find(b => b.date === date && b.time === time && b.status !== 'cancelled');
        if (clash) {
            return res.status(409).json({ error: 'This slot has just been booked by someone else.' });
        }

        const cancelToken = uuidv4();
        const booking = {
            id: Date.now(),
            cancelToken,
            name,
            email,
            phone,
            service,
            date,
            time,
            status: 'confirmed',
            createdAt: new Date()
        };
        data.bookings.push(booking);
        saveData(data);

        console.log(`[BOOKING] New appointment saved: ${name}`);

        if (transporter && process.env.EMAIL_USER) {
            const cancelLink = `https://${req.get('host')}/book.html?cancel=${cancelToken}`;
            const mailOptions = {
                from: `"PZ Booking" <${process.env.EMAIL_USER}>`,
                to: process.env.RECEIVER_EMAIL,
                subject: `New Appointment: ${name}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #10B981; padding: 20px; border-radius: 10px;">
                        <h2 style="color: #10B981;">New Appointment Received</h2>
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Phone:</strong> ${phone}</p>
                        <p><strong>Service:</strong> ${service}</p>
                        <p><strong>Date:</strong> ${date}</p>
                        <p><strong>Time:</strong> ${time}</p>
                    </div>`
            };
            await transporter.sendMail(mailOptions);
        }
        return res.status(200).json({ message: 'Booking successful', bookingId: booking.id, cancelToken });
    } catch (err) {
        console.error('[BOOKING API ERROR]', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 1.5. Booking Management APIs
app.get('/api/booked-slots', (req, res) => {
    try {
        const data = getData();
        const slots = data.bookings
            .filter(b => b.status !== 'cancelled')
            .map(b => ({ date: b.date, time: b.time }));
        res.json(slots);
    } catch (err) {
        console.error('[SLOTS API ERROR]', err);
        res.status(500).json([]);
    }
});

app.get('/api/admin/bookings', (req, res) => {
    try {
        const data = getData();
        res.json(data.bookings || []);
    } catch (err) {
        res.status(500).json([]);
    }
});

app.post('/api/cancel-booking', async (req, res) => {
    try {
        const { token, id } = req.body;
        const data = getData();
        const index = data.bookings.findIndex(b => b.cancelToken === token || b.id.toString() === id?.toString());
        if (index === -1) return res.status(404).json({ error: 'Appointment not found' });

        data.bookings[index].status = 'cancelled';
        saveData(data);
        res.json({ message: 'Appointment cancelled successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Cancellation failed' });
    }
});

// 3. Contact Form API
app.post('/api/contact', async (req, res) => {
    // ... (logic remains similar, wrapped in try/catch if needed, but existing is okay-ish. Adding wrap for safety)
    try {
        const { firstName, lastName, email, service, message } = req.body;
        if (!firstName) return res.status(400).json({ error: 'Missing fields' });

        const data = getData();
        data.contacts.push({ id: Date.now(), firstName, lastName, email, service, message });
        saveData(data);

        if (transporter && process.env.EMAIL_USER) {
            await transporter.sendMail({
                from: `"PZ Inquiry" <${process.env.EMAIL_USER}>`,
                to: process.env.RECEIVER_EMAIL,
                subject: `New Inquiry: ${firstName} ${lastName}`,
                html: `<p><strong>Message:</strong> ${message}</p>`
            });
        }
        return res.status(200).json({ message: 'Sent' });
    } catch (err) {
        return res.status(500).json({ error: 'Internal Error' });
    }
});

// 4. Subscribe API
app.post('/api/subscribe', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email required' });

        const data = getData();
        if (!data.subscribers.includes(email)) {
            data.subscribers.push(email);
            saveData(data);
        }
        return res.status(200).json({ message: 'Done' });
    } catch (err) {
        res.status(500).json({ error: 'Internal Error' });
    }
});

// 5. Auth APIs
app.post('/api/login', (req, res) => {
    const { email } = req.body;
    if (email) return res.status(200).json({ token: 'mock-jwt-token', user: { email } });
    return res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/signup', (req, res) => {
    return res.status(200).json({ message: 'User created' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[UNHANDLED ERROR]', err);
    res.status(500).send('Internal Server Error');
});

// Start Server (Only running listen if not in Vercel environment)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
        console.log('Serving static files from /public');
    });
}

// Export for Vercel
module.exports = app;
