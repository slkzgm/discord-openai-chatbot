const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect("mongodb+srv://kaiju:PlDSzmb19ucQwSdh@cluster0.guat93h.mongodb.net/sw?retryWrites=true&w=majority&appName=Cluster0");
        console.log('MongoDB connecté');
    } catch (error) {
        console.error('Erreur de connexion à MongoDB', error);
    }
};

module.exports = connectDB;