const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const toolRoutes = require('./routes/tool.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Útvonalak
app.use('/auth', authRoutes);
app.use('/tools', toolRoutes);

// MongoDB
let mongoServer;

const startDatabase = async () => {
    try {
        const dbPath = path.join(__dirname, '.db');
        if (!fs.existsSync(dbPath)) {
            fs.mkdirSync(dbPath);
        }
        mongoServer = await MongoMemoryServer.create({
            instance: {
                dbPath: dbPath,
                port: 27017,
                storageEngine: 'wiredTiger'
            }
        });

        const uri = mongoServer.getUri();
        console.log(`✅ MongoDB elindult helyileg: ${uri}`);

        // Csatlakozás
        await mongoose.connect(uri);
        console.log('✅ Mongoose csatlakozva');

        // feltöltés
        const User = require('./models/user.model');
        const Tool = require('./models/tool.model');
        const bcrypt = require('bcryptjs');

        const userCount = await User.countDocuments();
        if (userCount === 0) {
            console.log('Alapértelmezett felhasználó létrehozása(ha kéne)');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password123', salt);
            await User.create({ username: 'admin', password: hashedPassword });
        }

        const toolCount = await Tool.countDocuments();
        if (toolCount === 0) {
            console.log('Alapértelmezett szerszámok létrehozása');
            await Tool.insertMany([
                { name: 'Akkus csavarozó 18V', brand: 'Általános', category: 'Fúró/Csavarozó', price: 45000, quantity: 15 },
                { name: 'Fúrókalapács 800W', brand: 'Általános', category: 'Fúrókalapács', price: 62000, quantity: 8 },
                { name: 'Sarokcsiszoló 125mm', brand: 'Általános', category: 'Sarokcsiszoló', price: 24000, quantity: 22 },
                { name: 'Szúrófűrész 600W', brand: 'Általános', category: 'Szúrófűrész', price: 35000, quantity: 5 }
            ]);
        }

    } catch (error) {
        console.error('Hiba a MongoDB indításakor', error);
        process.exit(1);
    }
};

startDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(` A szerver fut`);
    });
});
