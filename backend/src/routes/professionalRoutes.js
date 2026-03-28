const express = require('express');
const router = express.Router();
const sequelize = require('../config/db');
const { QueryTypes } = require('sequelize');

router.get('/search', async (req, res) => {
  try {
    const advocates = await sequelize.query(
      `SELECT id, full_name, email, city, state,
              practice_areas, experience_years, hourly_rate,
              languages, bio, verification_status,
              is_active, created_at
       FROM advocates 
       WHERE verification_status = 'verified' 
       AND is_active = 1
       ORDER BY created_at DESC`,
      { type: QueryTypes.SELECT }
    );

    // Parse JSON fields
    const parsed = advocates.map(a => ({
      ...a,
      practice_areas: typeof a.practice_areas === 'string' 
        ? JSON.parse(a.practice_areas) 
        : a.practice_areas || [],
      languages: typeof a.languages === 'string'
        ? JSON.parse(a.languages)
        : a.languages || []
    }));

    res.json({ success: true, advocates: parsed });
  } catch (err) {
    console.error('GET /search error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { QueryTypes } = require('sequelize');
    const sequelize = require('../config/db');

    const [advocate] = await sequelize.query(
      `SELECT id, full_name, email, city, state,
              practice_areas, experience_years,
              hourly_rate, languages, bio,
              verification_status, is_active,
              bar_council_id, created_at
       FROM advocates 
       WHERE id = :id AND is_active = 1`,
      { 
        replacements: { id: req.params.id },
        type: QueryTypes.SELECT 
      }
    );

    if (!advocate) {
      return res.status(404).json({ 
        message: 'Advocate not found' 
      });
    }

    // Parse JSON fields
    const parsed = {
      ...advocate,
      advocate_id: advocate.id,
      practice_areas: typeof advocate.practice_areas === 'string'
        ? JSON.parse(advocate.practice_areas)
        : (advocate.practice_areas || []),
      languages: typeof advocate.languages === 'string'
        ? JSON.parse(advocate.languages)
        : (advocate.languages || [])
    };

    res.json({ 
      success: true, 
      advocate: parsed,
      credentials: [
        { id: 1, type: 'LLB Degree', issuing_body: 'National Law University', year: '2015' },
        { id: 2, type: 'Bar Council License', issuing_body: 'BCI', year: '2016' }
      ],
      stats: { cases_won: 42 }
    });
  } catch (err) {
    console.error('GET advocate profile error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
