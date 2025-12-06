const express = require('express');
const { Department } = require('../../models');

const router = express.Router();

// GET /api/v1/departments - List all departments
router.get('/', async (req, res) => {
  try {
    const departments = await Department.findAll({
      attributes: ['id', 'name', 'code', 'faculty'],
      order: [['name', 'ASC']],
    });
    return res.json(departments);
  } catch (err) {
    console.error('List departments error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
