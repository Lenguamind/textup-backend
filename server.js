require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ⚠️ IMPORTANT: port dinàmic per Render
const PORT = process.env.PORT || 3000;

// usuaris premium (temporal)
const premiumUsers = new Set();

// ruta test (per comprovar que funciona)
app.get('/', (req, res) => {
  res.send('Backend OK 🚀');
});

// endpoint IA (protegit)
app.post('/api/generate', async (req, res) => {
  const { userId, prompt } = req.body;

  if (!userId || !prompt) {
    return res.status(400).json({ error: 'Falten dades' });
  }

  if (!premiumUsers.has(userId)) {
    return res.status(403).json({ error: 'No premium' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Falta API KEY' });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
    console.error(err);
    res.status(500).json({ error: 'Error IA' });
  }
});

// activar premium (provisional)
app.post('/api/activate-premium', (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'Falta userId' });
  }

  premiumUsers.add(userId);
  res.json({ success: true });
});

// iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor en port ${PORT}`);
});