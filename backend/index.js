const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const apiRouter = require('./api');
const { preloadSchemas } = require('./lib/SchemaManager');

app.use(express.static('../frontend/dist'))
app.use(express.json({limit: '200mb'}));
app.use(express.urlencoded({limit: '200mb', extended: true, parameterLimit: 50000}));
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
}));

app.use('/', apiRouter);

app.get('/', async (req, res) => {
    res.sendFile(path.resolve('../frontend/dist/index.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;

async function startServer() {
    await preloadSchemas();
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

startServer();
