const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({ origin: ['http://localhost:5173', process.env.CLIENT_URL] }));
app.use(express.json());

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/incidents',  require('./routes/incident.routes'));
app.use('/api/messages',   require('./routes/message.routes'));
app.use('/api/volunteers', require('./routes/volunteer.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

app.get('/', (req, res) => res.json({ message: 'EmergencyKE API running' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));