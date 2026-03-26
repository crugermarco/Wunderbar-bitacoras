// /api/proxy.js
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
    // Obtener la URL original de la solicitud
    const originalUrl = req.url;
    
    // Construir la URL destino con los mismos query parameters
    let targetUrl = 'https://script.google.com/macros/s/AKfycbyzZuYw3IBC6w8-02-zMlU6QB3lImGtiWslPX86vn_Yi6pLJfMmdRMMq9Z4MWt-QrLn/exec';
    
    // Si hay query parameters en la solicitud original, agregarlos
    if (originalUrl.includes('?')) {
      const queryString = originalUrl.split('?')[1];
      targetUrl += '?' + queryString;
    }
    
    console.log('Proxy request to:', targetUrl);
    
    // Preparar las opciones para fetch
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    // Si es POST y hay body, agregarlo
    if (req.method === 'POST' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }
    
    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.json();
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
