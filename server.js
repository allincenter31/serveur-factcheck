const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Permet de recevoir de grands volumes de données

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.get('/', (req, res) => {
  res.send('🤖 Serveur FactChecker AI (Texte + OCR Image) est en ligne !');
});

// -------------------------------------------------------------
// 1. ROUTE D'ANALYSE DE TEXTE
// -------------------------------------------------------------
app.post('/api/verify-text', async (req, res) => {
  try {
    const { texteAAnalyser } = req.body;
    if (!texteAAnalyser) return res.status(400).json({ erreur: 'Aucun texte fourni.' });

    const prompt = `
      Tu es un expert mondial en Fact-Checking.
      Analyse le texte suivant et évalue s'il s'agit d'une Fake News, d'une information vérifiée ou douteuse.
      Texte : "${texteAAnalyser}"
      Réponds STRICTEMENT sous ce format JSON :
      {
        "verdict": "CONFIRME" ou "MOYEN" ou "FAKE",
        "score": 85,
        "explication": "Explication claire en 2 phrases max."
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const responseText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    res.json(JSON.parse(responseText));

  } catch (erreur) {
    console.error('❌ Erreur Analyse Texte :', erreur);
    res.status(500).json({ verdict: "MOYEN", explication: "Erreur lors de l'analyse du texte." });
  }
});

// -------------------------------------------------------------
// 2. ROUTE D'ANALYSE D'IMAGE (OCR + FACT-CHECKING)
// -------------------------------------------------------------
app.post('/api/verify-image', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ erreur: "Aucune URL d'image fournie." });

    console.log("📸 Analyse d'image en cours pour :", imageUrl);

    // Télécharger l'image pour la transférer à l'IA
    const imageResponse = await fetch(imageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    const prompt = `
      Tu es un expert en Fact-Checking et analyse visuelle.
      1. Extraits TOUT le texte lisible présent dans cette image (OCR).
      2. Analyse si ce texte ou cette image véhicule une fausse information, une Fake News ou un fait vérifié.
      
      Réponds STRICTEMENT sous ce format JSON :
      {
        "texteExtrait": "Le texte trouvé dans l'image",
        "verdict": "CONFIRME" ou "MOYEN" ou "FAKE",
        "score": 85,
        "explication": "Explication concise sur la véracité de l'image/texte."
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType
          }
        },
        prompt
      ],
    });

    const responseText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const resultat = JSON.parse(responseText);

    console.log("✅ Résultat OCR + Vérification :", resultat);
    res.json(resultat);

  } catch (erreur) {
    console.error("❌ Erreur Analyse Image :", erreur);
    res.status(500).json({ verdict: "MOYEN", explication: "Impossible de lire ou vérifier l'image." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur actif sur http://localhost:${PORT}`);
});