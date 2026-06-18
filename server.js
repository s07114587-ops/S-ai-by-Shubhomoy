const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// 🔒 কীগুলো রেন্ডার ড্যাশবোর্ড থেকে অটোমেটিক লোড হবে, গিটহাবে কেউ দেখতে পাবে না!
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ reply: "মেসেজ ফাঁকা মামা!" });
    
    const cleanMessage = message.toLowerCase();

    // 🎯 কাস্টম মাদার/ফাদার ফিল্টার লজিক
    if (cleanMessage.includes("who is your mother") || cleanMessage.includes("your mother") || cleanMessage.includes("মা কে")) {
        return res.json({ reply: "Logically, I don't have a mother, but since Shubhomoy is my father, you could say Notepad++ is my mother!" });
    }
    if (cleanMessage.includes("who is your father") || cleanMessage.includes("your father") || cleanMessage.includes("বাবা কে")) {
        return res.json({ reply: "My father is the mastermind developer Shubhomoy!" });
    }

    // 🚀 ১. প্রথমে Groq (Llama 3) দিয়ে চেষ্টা
    try {
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${GROQ_API_KEY}`, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                model: "llama3-8b-8192",
                messages: [{ role: "user", content: message }]
            })
        });

        if (!groqResponse.ok) throw new Error("Groq Down");

        const groqData = await groqResponse.json();
        let reply = groqData.choices[0].message.content;
        return res.json({ reply: filterNames(reply) });

    } catch (error) {
        console.log("Groq crashed or limit reached! Switching to Backup Gemini...");
        
        // 🔄 ২. গ্রক ফেল করলে অটোমেটিক ব্যাকআপ Gemini
        try {
            const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: message }] }] })
            });

            if (!geminiResponse.ok) throw new Error("Gemini Down too");

            const geminiData = await geminiResponse.json();
            let reply = geminiData.candidates[0].content.parts[0].text;
            return res.json({ reply: filterNames(reply) });
        } catch (geminiError) {
            return res.status(500).json({ reply: "Sorry মামা, দুইটা সার্ভারই এখন বিজি!" });
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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
