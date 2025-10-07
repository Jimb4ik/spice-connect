/**
 * Text Translation API using OpenAI GPT
 * Translates text to specified target language
 */

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: 'Method not allowed',
            success: false 
        });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
        return res.status(500).json({ 
            error: 'OpenAI API key not configured',
            success: false 
        });
    }

    try {
        const { text, targetLanguage = 'English' } = req.body;

        if (!text || typeof text !== 'string') {
            return res.status(400).json({ 
                error: 'Text is required and must be a string',
                success: false 
            });
        }

        // Skip translation for very short texts
        if (text.length < 10) {
            return res.status(200).json({
                success: true,
                translatedText: text,
                skipped: true,
                reason: 'Text too short'
            });
        }

        // console.log('[TRANSLATE] Translating text:', text.substring(0, 100) + '...');

        // Call OpenAI API for translation
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: `You are a professional translator. Translate the given text to ${targetLanguage}. If the text is already in ${targetLanguage}, return it as is. Only return the translated text, no explanations or additional comments.`
                    },
                    {
                        role: 'user',
                        content: text
                    }
                ],
                max_tokens: 500,
                temperature: 0.3
            })
        });

        if (!openaiResponse.ok) {
            const errorData = await openaiResponse.text();
            console.error('[TRANSLATE] OpenAI API error:', openaiResponse.status, errorData);
            return res.status(500).json({ 
                error: 'Translation service error',
                success: false,
                details: `OpenAI API returned ${openaiResponse.status}`
            });
        }

        const openaiData = await openaiResponse.json();

        if (!openaiData.choices || !openaiData.choices[0] || !openaiData.choices[0].message) {
            console.error('[TRANSLATE] Invalid OpenAI response:', openaiData);
            return res.status(500).json({ 
                error: 'Invalid translation response',
                success: false 
            });
        }

        const translatedText = openaiData.choices[0].message.content.trim();

        // console.log('[TRANSLATE] Translation successful');

        res.status(200).json({
            success: true,
            translatedText: translatedText,
            originalText: text,
            targetLanguage: targetLanguage
        });

    } catch (error) {
        console.error('[TRANSLATE] Error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            success: false,
            details: error.message 
        });
    }
}
