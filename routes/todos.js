const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const todos = await Todo.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { text, dueDate } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Text is required' });
    const todo = new Todo({ text: text.trim(), owner: req.user.id, dueDate: dueDate ? new Date(dueDate) : null });
    await todo.save();
    res.status(201).json(todo);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, completed, dueDate } = req.body;
    const updates = {};
    if (typeof text === 'string') updates.text = text.trim();
    if (typeof completed === 'boolean') updates.completed = completed;
    if (dueDate !== undefined) updates.dueDate = dueDate ? new Date(dueDate) : null;
    const todo = await Todo.findOneAndUpdate({ _id: id, owner: req.user.id }, updates, { new: true });
    if (!todo) return res.status(404).json({ error: 'Todo not found' });
    res.json(todo);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const todo = await Todo.findOneAndDelete({ _id: id, owner: req.user.id });
    if (!todo) return res.status(404).json({ error: 'Todo not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

module.exports = router;
