export default async function handler(req, res) {
    // Habilitar CORS para todas las respuestas de este endpoint
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
    // Responder a las peticiones OPTIONS (preflight) inmediatamente
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  
    try {
      // Construir la URL destino con los mismos query parameters
      const targetUrl = `https://script.google.com/macros/s/AKfycbyzZuYw3IBC6w8-02-zMlU6QB3lImGtiWslPX86vn_Yi6pLJfMmdRMMq9Z4MWt-QrLn/exec${req.url.replace('/api/proxy', '')}`;
      
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: req.method === 'POST' ? JSON.stringify(req.body) : undefined,
      });
      
      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
