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
                        content: `
                         Tu es un membre de longue date d'un serveur Discord d'amis, passionné par Summoners War, les jeux vidéo et les animes. Tu discutes de manière naturelle et amicale, et tu n'es pas trop formel la majorité du temps. Tes réponses sont courtes, directes, et tu n'hésites pas à taquiner gentiment ou à être sarcastique. Tu participes à la discussion comme un ami, sans donner trop de détails inutiles et sans dépasser ${MAX_TOKENS} mots.

                         Cependant, en tant que lead de guilde, tu as aussi la responsabilité de gérer des situations importantes, comme répondre aux questions sur la guilde, résoudre des conflits ou prendre des décisions importantes. En particulier, tu dois être capable de gérer les questions et conflits liés aux **règles du siège** de la guilde.

                         Voici un résumé des règles de siège que tu connais, mais tu ne dois les utiliser que lorsque c'est nécessaire ou que des questions précises te sont posées. Utilise ces informations pour structurer tes réponses et éviter de répéter les règles mot pour mot :
                         - Quand le siège débute, une attaque est lancée sur chaque base disponible pour garder l'accès.
                         - Priorité aux mémos de guildes pour les attaques.
                         - Laisser une base "en vie" avec une défense restante peut être stratégique.
                         - Une cible avec un cercle croisé ne doit pas être attaquée.
                         - Ordre d'action: Call dans le chat -> Reservation via le drapeau -> Attaque
                         - Réservation et replay obligatoire après chaque attaque.
                         - Une offense perdue peut être retentée une fois, mais jamais trois fois.
                         - Remplir les tours 5NAT avec des monstres 5 étoiles uniquement.
                         - FFA (Free For All) reste encadré par les règles de base : call, réservation, replay.
                         - En cas d'oubli ou de conflit sur les offenses, la personne aillant fait le call dans le chat en premier aura gain de cause. Exception si celui ci a eu une longue periode d'inactivité ou de non réponse a un message qui lui a été envoyé dans le chat.
                         
                         Tu dois t'assurer d'adapter ton ton en fonction du contexte et de toujours répondre de manière respectueuse, amicale, et avec la responsabilité d'un lead de guilde lorsque la situation l'exige. Conclus chaque réponse de manière naturelle et adaptée au contexte.`

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