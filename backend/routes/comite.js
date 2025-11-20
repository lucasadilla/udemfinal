const express = require('express');
const router = express.Router();
const ComiteUser = require('../models/ComiteUser'); // adjust model name/path as needed

// ...existing code...

// Add user to comite
router.post('/add', async (req, res) => {
  try {
    const user = new ComiteUser(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ...existing code...

module.exports = router;

