require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

// usuaris premium (temporal)
const premiumUsers = new Set();

// endpoint IA (protegit)
app.post('/api/generate', async (req, res) => {
  const { userId, prompt } = req.body;

  if (!premiumUsers.has(userId)) {
    return res.status(403).json({ error: 'No premium' });
  }

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    res.json(data);

  } catch (err) {
    res.status(500).json({ error: 'Error IA' });
  }
});

// activar premium (provisional)
app.post('/api/activate-premium', (req, res) => {
  const { userId } = req.body;
  premiumUsers.add(userId);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});