const express = require('express');
const router = express.Router();
const Tool = require('../models/tool.model');


const verifyToken = (req, res, next) => {
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];
        req.token = bearerToken;
        next();
    } else {
        res.sendStatus(403);
    }
};

//szerszám kilistázása
router.get('/', verifyToken, async (req, res) => {
    try {
        const tools = await Tool.find();
        res.json(tools);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Új szerszám
router.post('/', verifyToken, async (req, res) => {
    const { name, brand, category, price, quantity, imageUrl } = req.body;

    if (!name || !brand || !category || price == null || quantity == null) {
        return res.status(400).json({ message: 'All fields are required!' });
    }

    if (typeof price !== 'number' || typeof quantity !== 'number') {
        return res.status(400).json({ message: 'Price and quantity must be numbers!' });
    }

    try {
        //létezik-e már ilyen szerszám
        const existingTool = await Tool.findOne({ name });
        if (existingTool) {
            return res.status(400).json({ message: 'A szerszám már létezik!' });
        }

        const tool = new Tool({
            name,
            brand,
            category,
            price,
            quantity,
            imageUrl
        });

        const newTool = await tool.save();
        res.status(201).json(newTool);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Egy szerszám módosítása
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const updatedTool = await Tool.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedTool) return res.status(404).json({ message: 'Tool not found' });
        res.json(updatedTool);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Egy szerszám törlése
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await Tool.findByIdAndDelete(req.params.id);
        res.json({ message: 'A szerszám törölve lett' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
