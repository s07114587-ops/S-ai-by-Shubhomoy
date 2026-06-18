const express = require('express');
const cors = require('cors');

const app = express();

// CORS পলিসি ওপেন করা হলো
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 🔒 ਰেন্ডার ড্যাশবোর্ডের Environment Variables থেকে কীগুলো লোড হবে
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// হোম রুট মেসেজ
app.get('/', (req, res) => {
    res.send("🚀 s ai Pro Backend Server is Running Perfectly, Shubhomoy মামা!");
});

// 💬 চ্যাটের মেইন রুট
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ reply: "মেসেজ ফাঁকা মামা!" });
    }
    
    const cleanMessage = message.toLowerCase();

    // 🎯 কাস্টম মাদার/ফাদার ফিল্টার লজিক
    if (cleanMessage.includes("who is your mother") || cleanMessage.includes("your mother") || cleanMessage.includes("মা কে")) {
        return res.json({ reply: "Logically, I don't have a mother, but since Shubhomoy is my father, you could say Notepad++ is my mother!" });
    }
    if (cleanMessage.includes("who is your father") || cleanMessage.includes("your father") || cleanMessage.includes("বাবা কে")) {
        return res.json({ reply: "My father is the mastermind developer Shubhomoy!" });
    }

    // 🚀 ১. প্রথমে Groq (Llama 3.3 Versatile) দিয়ে চেষ্টা
    try {
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${GROQ_API_KEY}`, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile", // 🎯 ২০২৬ সালের একদম লেটেস্ট একটিভ ফ্রি মডেল
                messages: [{ role: "user", content: message }]
            })
        });

        if (!groqResponse.ok) {
            const errText = await groqResponse.text();
            throw new Error(`Groq Error: ${errText}`);
        }

        const groqData = await groqResponse.json();
        let reply = groqData.choices[0].message.content;
        return res.json({ reply: filterNames(reply) });

    } catch (error) {
        console.log("⚠️ Groq Down! Reason:", error.message);
        console.log("🔄 Switching to Backup Gemini...");
        
        // 🔄 ২. ব্যাকআপ Gemini (v1 ভার্সনে লেটেস্ট gemini-2.5-flash)
        try {
            const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: message }] }] })
            });

            if (!geminiResponse.ok) {
                const geminiErr = await geminiResponse.text();
                throw new Error(`Gemini Error: ${geminiErr}`);
            }

            const geminiData = await geminiResponse.json();
            let reply = geminiData.candidates[0].content.parts[0].text;
            return res.json({ reply: filterNames(reply) });

        } catch (geminiError) {
            console.log("💥 Gemini Also Failed! Reason:", geminiError.message);
            return res.status(500).json({ reply: "Sorry মামা, দুইটা সার্ভারই এখন বিজি আছে!" });
        }
    }
});

function filterNames(text) {
    return text.replace(/Groq/gi, "Shubhomoy Tech")
               .replace(/Llama/gi, "s ai Pro")
               .replace(/Meta/gi, "Shubhomoy")
               .replace(/Google/gi, "Shubhomoy")
               .replace(/Gemini/gi, "s ai Pro");
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
