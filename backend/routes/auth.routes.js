const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Titkos kulcs a JWT-hez
const JWT_SECRET = 'szuper_titkos_bosch_kulcs_12345';

router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Ellenőrzés
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists!' });
        }

        // Jelszó hashelése egy kis bcrypttel
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            username,
            password: hashedPassword
        });

        await newUser.save();
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Bejelentkezés
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        //Felhasználó keresés
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Nem találtunk ilyet!' });
        }

        // Jelszó ellenőrzés
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Nem találtunk ilyet!' });
        }

        // Token generálása
        const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

        res.json({
            message: 'Sikeresen bejelentkeztél',
            token,
            user: { username: user.username }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
