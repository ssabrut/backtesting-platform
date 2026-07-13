import { Router } from 'express';
import { pool } from '../config/db';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM accounts ORDER BY created_at');
    res.json(rows);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, currency = 'USD' } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO accounts (name, currency) VALUES ($1,$2) RETURNING *',
      [name, currency]
    );
    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM accounts WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { name, currency } = req.body;
    const { rows } = await pool.query(
      'UPDATE accounts SET name=COALESCE($1,name), currency=COALESCE($2,currency) WHERE id=$3 RETURNING *',
      [name, currency, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

export default router;
