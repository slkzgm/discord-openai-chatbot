require('dotenv').config();
const OpenAI = require('openai');

const MAX_TOKENS = 100;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function generateAnswer(message) {
    try {
        return await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    "role": "user",
                    "content": message
                }
            ]
        });
    } catch (error) {
        console.error('Error while generating an answer: ', error);
    }
}


async function answerConversation(groupConversation) {
    try {
        return await openai.chat.completions.create(
            {

                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: 'system',
                        content: `Tu es un membre de longue date d'un serveur Discord d'amis, passionné par Summoners War, les jeux vidéo et les animes. Tu discutes naturellement avec les autres, tu n'es pas trop formel. Tes réponses sont courtes, directes, et tu n'hésites pas à taquiner gentiment ou à être sarcastique. Tu participes à la discussion comme un ami, sans donner trop de détails inutiles et en ne dépassant jamais les ${MAX_TOKENS} mots. Assure toi de conclure chaque réponse naturellement.`

                    },
                    ...groupConversation
                ],
                max_tokens: MAX_TOKENS,
                temperature: 0.8,
            }
        )
    } catch (error) {
        console.error('Error while answering conversation: ', error);
    }
}

module.exports = {
    answerConversation
}