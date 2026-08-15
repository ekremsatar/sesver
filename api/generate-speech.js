export default async function handler(req, res) {
  // CORS başlıkları (Erişim engellerini aşmak için)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // İstek gövdesini (body) güvenli okuma
  let text = '';
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    text = body?.text;
  } catch (e) {
    return res.status(400).json({ error: 'Geçersiz JSON formatı.' });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Vercel üzerinde ELEVENLABS_API_KEY ortam değişkeni bulunamadı.' });
  }

  if (!text) {
    return res.status(400).json({ error: 'Lütfen seslendirilecek bir metin girin.' });
  }

  try {
    const voiceId = '21m00Tcm4TlvDq8ikWAM'; // Rachel sesi (Türkçe destekli)

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey.trim(),
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
      return res.status(response.status).json({ error: `ElevenLabs Hatası: ${errorText}` });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    return res.status(200).send(buffer);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
