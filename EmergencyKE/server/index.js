const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({origin: ['http://localhost:5173', process.env.CLIENT_URL,]}));
app.use(express.json());

app.use('/api/auth', require('./routes/auth.routes'));

app.get('/', (req, res) => res.json({ message: 'JioKoa API running' }));

app.listen(5000, () => console.log('Server running on port 5000'));