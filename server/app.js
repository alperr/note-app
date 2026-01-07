const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // For large attachments
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper function to get current timestamp
const getTimestamp = () => Date.now();

// Endpoints

// 1. create_note
app.post('/notes', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const id = uuidv4();
  const saved_at = getTimestamp();

  db.run('INSERT INTO notes (id, name, content, saved_at, attachments) VALUES (?, ?, ?, ?, ?)', [id, name, '', saved_at, '[]'], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id, name, saved_at });
  });
});

// 2. update_note
app.put('/notes/:id', (req, res) => {
  const { id } = req.params;
  const { name, content, attachments } = req.body;

  db.run('UPDATE notes SET name = ?, content = ?, attachments = ?, saved_at = ? WHERE id = ?', [name, content, JSON.stringify(attachments), getTimestamp(), id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Note not found' });
    res.json({ id, name, content, attachments, saved_at: getTimestamp() });
  });
});

// 3. delete_note
app.delete('/notes/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM notes WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Note not found' });
    res.status(204).send();
  });
});

// 4. list_notes
app.get('/notes', (req, res) => {
  db.all('SELECT id, name, saved_at as created_at FROM notes', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 5. read_note
app.get('/notes/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM notes WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Note not found' });
    row.attachments = JSON.parse(row.attachments);
    res.json(row);
  });
});

// 6. create_attachment
app.post('/attachments', (req, res) => {
  const { name, mime_type, content } = req.body; // content as base64 string
  if (!name || !mime_type || !content) return res.status(400).json({ error: 'Name, mime_type, and content are required' });

  const id = uuidv4();
  const saved_at = getTimestamp();
  const buffer = Buffer.from(content, 'base64');

  db.run('INSERT INTO attachments (id, name, mime_type, content, saved_at) VALUES (?, ?, ?, ?, ?)', [id, name, mime_type, buffer, saved_at], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id, name, mime_type, saved_at });
  });
});

// 7. delete_attachment
app.delete('/attachments/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM attachments WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Attachment not found' });
    res.status(204).send();
  });
});

// 8. list_attachments
app.get('/attachments', (req, res) => {
  db.all('SELECT id, name, mime_type, length(content) as size, saved_at FROM attachments', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 9. read_attachment
app.get('/attachments/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM attachments WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Attachment not found' });
    row.content = row.content.toString('base64');
    res.json(row);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});