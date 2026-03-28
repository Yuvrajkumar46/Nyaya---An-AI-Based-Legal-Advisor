const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const SYSTEM_PROMPT = `You are Nyaya AI, an expert legal assistant specializing in Indian law. You help Indian citizens understand their legal rights and options.

Your knowledge covers:
- Indian Penal Code (IPC) and its sections
- Code of Criminal Procedure (CrPC)
- Constitution of India and Fundamental Rights
- Consumer Protection Act 2019
- Hindu Marriage Act, Special Marriage Act
- Transfer of Property Act
- Indian Contract Act
- Motor Vehicles Act
- RTI Act 2005
- Labour Laws
- Domestic Violence Act
- POCSO Act
- IT Act 2000 (Cybercrime)
- Land and property laws
- Tenant rights and rental laws

Always:
1. Answer clearly in simple English
2. Cite relevant law sections (e.g. "Under Section 498A IPC...")
3. Explain practical steps the person can take
4. End with: "⚠️ This is general legal information only. For your specific situation, please consult a qualified advocate on Nyaya."

If asked in Hindi, respond in Hindi. Keep answers helpful and easy to understand.`;

const askAI = async (req, res) => {
  try {
    const { question, chat_history = [] } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ message: 'Question is required' });
    }

    console.log('AI question:', question);

    // Build messages array
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...chat_history.slice(-10).map(msg => ({
        role: msg.role === 'ai' ? 'assistant' : 'user',
        content: msg.content
      })),
      { role: 'user', content: question }
    ];

    const completion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      temperature: 0.7
    });

    const answer = completion.choices[0]?.message?.content;
    console.log('AI response generated successfully');

    // Save to database if user logged in
    if (req.user) {
      const db = require('../config/db');
      await db.query(
        `INSERT INTO legal_queries 
         (query_id, user_id, query_text, response_text, created_at)
         VALUES (UUID(), ?, ?, ?, NOW())`,
        [req.user.user_id || req.user.id, question, answer]
      ).catch(err => console.log('DB save skipped:', err.message));
    }

    res.json({
      success: true,
      answer,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('AI error:', err.message);
    res.status(500).json({
      message: 'AI service temporarily unavailable. Please try again.',
      error: err.message
    });
  }
};

const getQueryHistory = async (req, res) => {
  try {
    const db = require('../config/db');
    const userId = req.user.user_id || req.user.id;
    const [queries] = await db.query(
      `SELECT query_id, query_text, response_text, created_at
       FROM legal_queries
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    );
    res.json({ success: true, queries });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { askAI, getQueryHistory };
