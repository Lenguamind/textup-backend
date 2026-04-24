require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');

const app = express();
app.use(cors());
app.use(express.json());

// ⚠️ PORT dinàmic per Render
const PORT = process.env.PORT || 3000;

// 🔐 Google Play API (Service Account)
let androidpublisher = null;

async function initGoogleAuth() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: '/etc/secrets/service-account.json',
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    });

    androidpublisher = google.androidpublisher({
      version: 'v3',
      auth,
    });

    console.log('✅ Google Play API inicialitzada correctament');
  } catch (error) {
    console.error('❌ Error inicialitzant Google Play API:', error.message);
  }
}

initGoogleAuth();

// ✅ Ruta de test
app.get('/', (req, res) => {
  res.send('Backend OK 🚀');
});

// ✅ Validar subscripció amb Google Play
app.post('/api/validate-subscription', async (req, res) => {
  const { packageName, subscriptionId, purchaseToken } = req.body;

  if (!androidpublisher) {
    return res.status(500).json({ error: 'Google Play API no inicialitzada' });
  }

  if (!packageName || !subscriptionId || !purchaseToken) {
    return res.status(400).json({ error: 'Falten dades' });
  }

  try {
    const response = await androidpublisher.purchases.subscriptions.get({
      packageName,
      subscriptionId,
      token: purchaseToken,
    });

    const isActive = response.data.paymentState === 1;
    const expiryTime = response.data.expiryTimeMillis;

    console.log(`📱 Validació: ${isActive ? 'Premium ✅' : 'No premium ❌'}`);

    res.json({
      isPremium: isActive,
      expiryTime: expiryTime,
    });
  } catch (error) {
    console.error('Error validant subscripció:', error.message);
    res.status(500).json({ error: 'Error validant subscripció' });
  }
});

// 🚀 IA protegida (valida subscripció real)
app.post('/api/generate', async (req, res) => {
  const { packageName, subscriptionId, purchaseToken, prompt } = req.body;

  if (!packageName || !subscriptionId || !purchaseToken || !prompt) {
    return res.status(400).json({ error: 'Falten dades' });
  }

  if (!androidpublisher) {
    return res.status(500).json({ error: 'Google Play API no inicialitzada' });
  }

  try {
    // Validar subscripció amb Google Play
    const response = await androidpublisher.purchases.subscriptions.get({
      packageName,
      subscriptionId,
      token: purchaseToken,
    });

    const isActive = response.data.paymentState === 1;

    if (!isActive) {
      return res.status(403).json({ error: 'PREMIUM_REQUIRED' });
    }

    // Si és premium, cridar Gemini
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Falta API KEY' });
    }

    const fetchResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await fetchResponse.json();
    console.log("Resposta IA:", JSON.stringify(data));
    res.json(data);

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Error intern' });
  }
});

// 🔧 Endpoint per activar premium (provisional, només per tests)
app.post('/api/activate-premium', (req, res) => {
  res.status(501).json({ error: 'Mètode deprecated. Usa validate-subscription amb purchaseToken real' });
});

// 🚀 Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor en port ${PORT}`);
});