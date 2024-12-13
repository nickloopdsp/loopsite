export default async function handler(req, res) {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "No message provided." });
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }]
    })
  });

  const data = await response.json();
  const botReply = data.choices[0].message.content;
  res.status(200).json({ reply: botReply });
}
