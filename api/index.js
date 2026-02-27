const express = require('express');
const cors = require('cors');
const { YoutubeTranscript } = require('youtube-transcript');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS - Autoriser le frontend
app.use(cors({
  origin: '*',
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Extraire l'ID vidéo
function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Endpoint principal
app.post('/api/transcript', async (req, res) => {
  try {
    const { url, language = 'fr' } = req.body;
    
    const videoId = extractVideoId(url);
    if (!videoId) {
      return res.status(400).json({ error: 'URL YouTube invalide' });
    }

    // Récupérer le transcript
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: language
    });

    if (!transcript || transcript.length === 0) {
      // Essayer sans langue spécifiée
      const fallbackTranscript = await YoutubeTranscript.fetchTranscript(videoId);
      if (!fallbackTranscript || fallbackTranscript.length === 0) {
        return res.status(404).json({ 
          error: 'Aucun transcript trouvé pour cette vidéo',
          suggestion: 'Vérifiez que la vidéo a des sous-titres activés'
        });
      }
      return formatAndSend(res, videoId, fallbackTranscript, 'auto');
    }

    return formatAndSend(res, videoId, transcript, language);

  } catch (error) {
    console.error('Erreur:', error.message);
    res.status(500).json({ 
      error: 'Erreur lors de l\'extraction',
      message: error.message
    });
  }
});

function formatAndSend(res, videoId, transcript, language) {
  // Formater avec timestamps [MM:SS]
  const formattedLines = transcript.map(entry => {
    const seconds = Math.floor(entry.offset / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const timestamp = `[${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}]`;
    return `${timestamp} ${entry.text}`;
  });

  const fullText = formattedLines.join('\n');
  const plainText = transcript.map(t => t.text).join(' ');

  res.json({
    success: true,
    videoId,
    language,
    transcript: fullText,
    plainText,
    wordCount: plainText.split(/\s+/).filter(w => w.length > 0).length,
    charCount: fullText.length,
    duration: Math.floor(transcript[transcript.length - 1]?.offset / 1000) || 0
  });
}

// Version sans timestamps
app.post('/api/transcript/clean', async (req, res) => {
  try {
    const { url, language = 'fr' } = req.body;
    
    const videoId = extractVideoId(url);
    if (!videoId) {
      return res.status(400).json({ error: 'URL YouTube invalide' });
    }

    const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: language });
    const plainText = transcript.map(t => t.text).join(' ');

    res.json({
      success: true,
      videoId,
      language,
      text: plainText,
      wordCount: plainText.split(/\s+/).filter(w => w.length > 0).length,
      charCount: plainText.length
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ API Transcript démarrée sur le port ${PORT}`);
  console.log(`📝 Endpoint: POST /api/transcript`);
  console.log(`🧹 Clean: POST /api/transcript/clean`);
});
