import mongoose from 'mongoose';
import 'dotenv/config';
import User from '../app/models/User.js';

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const existing = await User.findOne({ email: 'admin@comercialaraguaia.com' });
        if (existing) {
            console.log('Admin já existe');
            process.exit();
        }

        await User.create({
            name: 'Admin',
            email: 'admin@comercialaraguaia.com',
            password: 'admin123',
            role: 'admin',
        });

        console.log('Admin criado com sucesso');
        process.exit();
    } catch (error) {
        console.error('Erro ao criar admin:', error.message);
        process.exit(1);
    }
};

seed();
