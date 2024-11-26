const express = require('express');
const router = express.Router();
const humanizeController = require('../controllers/humanizeController');

router.post('/', humanizeController.humanizeContent);

module.exports = router;