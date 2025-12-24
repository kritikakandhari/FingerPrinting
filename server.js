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

function getData() {
    if (!fs.existsSync(DATA_FILE)) {
        // Initializes with empty structure if file missing
        return { bookings: [], contacts: [], subscribers: [] };
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ... (Email Transporter setup remains the same)
// Email Transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Routes
// ... (Rest of routes remain the same)

// 1. Serving Frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ... (Other routes: /api/book, /api/booked-slots, etc. - implied to be here)
// Note: We are replacing the end of the file to handle export

// 2. Booking API
app.post('/api/book', async (req, res) => {
    // ... (logic from original file)
    const { name, email, phone, service, date, time } = req.body;

    if (!name || !email || !date || !time) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const data = getData();

    // Clash Prevention: Check if slot is already taken
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

    // Cancellation Link
    const cancelLink = `http://${req.get('host')}/book.html?cancel=${cancelToken}`;

    // Email to Provider
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
                <hr>
                <div style="background: #fee2e2; padding: 10px; border-radius: 5px; text-align: center;">
                    <a href="${cancelLink}" style="color: #dc2626; font-weight: bold; text-decoration: none;">CANCEL THIS APPOINTMENT</a>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        await transporter.sendMail({
            from: `"Point Zero" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Booking Confirmed - ${date}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px;">
                    <h2 style="color: #10B981;">Your Booking is Confirmed</h2>
                    <p>Hi ${name}, thank you for choosing Point Zero Global Services.</p>
                    <p><strong>Date:</strong> ${date}<br><strong>Time:</strong> ${time}</p>
                    <p>If you need to change or cancel your appointment, please use the link below:</p>
                    <a href="${cancelLink}" style="display: inline-block; padding: 10px 20px; background: #ef4444; color: white; border-radius: 5px; text-decoration: none;">Cancel Appointment</a>
                </div>
            `
        });
    } catch (err) {
        console.error('[EMAIL ERROR]', err.message);
    }

    return res.status(200).json({ message: 'Booking successful', bookingId: booking.id, cancelToken });
});

// 1.5. Booking Management APIs
app.get('/api/booked-slots', (req, res) => {
    const data = getData();
    const slots = data.bookings
        .filter(b => b.status !== 'cancelled')
        .map(b => ({ date: b.date, time: b.time }));
    res.json(slots);
});

app.get('/api/admin/bookings', (req, res) => {
    const data = getData();
    res.json(data.bookings || []);
});

app.post('/api/cancel-booking', async (req, res) => {
    const { token, id } = req.body;
    const data = getData();

    const index = data.bookings.findIndex(b => b.cancelToken === token || b.id.toString() === id?.toString());

    if (index === -1) return res.status(404).json({ error: 'Appointment not found' });

    const booking = data.bookings[index];
    booking.status = 'cancelled';
    saveData(data);

    console.log(`[CANCEL] Booking for ${booking.name} cancelled.`);

    try {
        await transporter.sendMail({
            from: `"PZ System" <${process.env.EMAIL_USER}>`,
            to: process.env.RECEIVER_EMAIL,
            subject: `CANCELLED: Appointment - ${booking.name}`,
            text: `The appointment for ${booking.name} on ${booking.date} at ${booking.time} has been cancelled.`
        });
    } catch (err) { }

    res.json({ message: 'Appointment cancelled successfully' });
});

// 3. Contact Form API
app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, service, message } = req.body;

    if (!firstName || !email || !message) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    const data = getData();
    const contact = { id: Date.now(), firstName, lastName, email, service, message, createdAt: new Date() };
    data.contacts.push(contact);
    saveData(data);

    const mailOptions = {
        from: `"PZ Inquiry" <${process.env.EMAIL_USER}>`,
        to: process.env.RECEIVER_EMAIL,
        subject: `New Inquiry: ${firstName} ${lastName}`,
        html: `<p><strong>Form:</strong> ${firstName} ${lastName} (${email})</p><p><strong>Message:</strong> ${message}</p>`
    };

    try {
        await transporter.sendMail(mailOptions);
        return res.status(200).json({ message: 'Sent' });
    } catch (err) {
        return res.status(500).json({ error: 'Email failed' });
    }
});

// 4. Subscribe API
app.post('/api/subscribe', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const data = getData();
    if (!data.subscribers.includes(email)) {
        data.subscribers.push(email);
        saveData(data);
    }

    const mailOptions = {
        from: `"PZ System" <${process.env.EMAIL_USER}>`,
        to: process.env.RECEIVER_EMAIL,
        subject: `New Subscriber: ${email}`,
        text: `New sub: ${email}`
    };

    try {
        await transporter.sendMail(mailOptions);
        return res.status(200).json({ message: 'Done' });
    } catch (err) {
        return res.status(500).json({ error: 'Failed' });
    }
});

// 5. Auth APIs
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (email) {
        console.log(`[LOGIN] User ${email} logged in.`);
        return res.status(200).json({ token: 'mock-jwt-token', user: { email } });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/signup', (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    console.log(`[SIGNUP] New user: ${firstName} ${lastName}`);
    return res.status(200).json({ message: 'User created' });
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
