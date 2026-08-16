export default async function handler(req, res) {
  // 1. CORS Başlıkları
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // OPTIONS (Preflight) İsteği Yönetimi
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Yalnızca POST Kabul Et
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Yalnızca POST istekleri kabul edilir.' });
  }

  const { text, voiceId } = req.body || {};

  // Girdi Kontrolü
  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Lütfen seslendirilecek bir metin girin.' });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'ELEVENLABS_API_KEY ortam değişkeni Vercel üzerinde tanımlanmamış.' });
  }

  // Varsayılan Ses: George (Garantili Ücretsiz Ses ID: JBFqnCBsd6RMkjVDRZzb)
  const selectedVoice = voiceId || 'JBFqnCBsd6RMkjVDRZzb';

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let parsedError = errorText;
      try {
        const errJson = JSON.parse(errorText);
        parsedError = errJson.detail?.message || errJson.message || errorText;
      } catch (e) {
        // Text olarak kalsın
      }

      return res.status(response.status).json({ 
        error: `ElevenLabs Hatası (${response.status}): ${parsedError}` 
      });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    return res.status(200).send(buffer);

  } catch (error) {
    return res.status(500).json({ error: `Sunucu Hatası: ${error.message}` });
  }
}
