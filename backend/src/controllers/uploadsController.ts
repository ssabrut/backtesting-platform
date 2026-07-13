import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/db';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export async function uploadScreenshot(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { account_id } = req.body;
    const id = uuidv4();
    const url = `/uploads/${req.file.filename}`;

    await pool.query(
      `INSERT INTO uploads (id, account_id, filename, filepath, mime_type, size_bytes)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, account_id ?? null, req.file.originalname, req.file.path,
       req.file.mimetype, req.file.size]
    );

    res.json({ id, url, filename: req.file.filename });
  } catch (e) { next(e); }
}
