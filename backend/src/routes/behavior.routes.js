const express = require('express');
const router = express.Router();

// This is a placeholder route
router.get('/', (req, res) => {
    res.send('Route is working');
});

module.exports = router;