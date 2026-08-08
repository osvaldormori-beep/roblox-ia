const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_KEY = process.env.GEMINI_KEY;
const GROQ_KEY = process.env.GROQ_KEY;
const PORTA = process.env.PORT || 3000;

async function perguntarGemini(pergunta) {
    const resposta = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`,
        { contents: [{ parts: [{ text: pergunta }] }], generationConfig: { maxOutputTokens: 2000 } }
    );
    return { ia: 'Gemini', resposta: resposta.data.candidates[0].content.parts[0].text };
}

async function perguntarGroq(pergunta) {
    const resposta = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        { model: 'llama-3.1-70b-versatile', messages: [{ role: 'user', content: pergunta }], max_tokens: 2000 },
        { headers: { 'Authorization': `Bearer ${GROQ_KEY}` } }
    );
    return { ia: 'Groq (Llama 3)', resposta: resposta.data.choices[0].message.content };
}

app.post('/api/gerar', async (req, res) => {
    try {
        const { pergunta } = req.body;
        const [gemini, groq] = await Promise.all([
            perguntarGemini(pergunta),
            perguntarGroq(pergunta)
        ]);
        
        let codigoRoblox = '';
        const p = pergunta.toLowerCase();
        
        if (p.includes('criar') || p.includes('crie') || p.includes('parte') || p.includes('bloco')) {
            let cor = 'Bright blue';
            if (p.includes('vermelho')) cor = 'Bright red';
            if (p.includes('verde')) cor = 'Bright green';
            if (p.includes('amarelo')) cor = 'Bright yellow';
            if (p.includes('roxo')) cor = 'Bright violet';
            
            let tamanho = '10, 2, 10';
            if (p.includes('grande')) tamanho = '20, 5, 20';
            if (p.includes('gigante')) tamanho = '50, 10, 50';
            
            codigoRoblox = `
local parte = Instance.new("Part")
parte.Parent = workspace
parte.Size = Vector3.new(${tamanho})
parte.Position = Vector3.new(0, 5, 0)
parte.Anchored = true
parte.BrickColor = BrickColor.new("${cor}")
parte.Material = Enum.Material.SmoothPlastic
local h = Instance.new("Highlight")
h.Parent = parte
print("Parte criada!")
`;
        }
        
        res.json({
            sucesso: true,
            respostas: [gemini, groq],
            codigoRoblox: codigoRoblox
        });
        
    } catch(erro) {
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

app.get('/', (req, res) => res.send('Servidor Online!'));
app.listen(PORTA, () => console.log('Rodando na porta', PORTA));
