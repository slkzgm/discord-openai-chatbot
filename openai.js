require('dotenv').config();
const OpenAI = require('openai');
const { calculateSpeedBonus } = require("./commands/utility/tick");
const { getMonsterSpeedByName, getMonsterDetailsByName } = require("./monsters");

const MAX_TOKENS = 100;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const tools = [
    {
        type: "function",
        function: {
            name: "calculateSpeedTick",
            description: "Calculate the bonus speed needed for different ticks based on base speed and lead speed. Can also use monster name to retrieve base speed if base speed isn't provided. The bonus speed should always be on bold (using **) and prefixed with a +. You should also give the base speed used and if the monster have been defined or not. Do not add additional useless comments",
            parameters: {
                type: "object",
                properties: {
                    baseSpeed: {
                        type: "integer",
                        description: "The base speed of the monster."
                    },
                    leadSpeed: {
                        type: "integer",
                        description: "The speed bonus provided by a leader skill, if applicable. Defaults to 0."
                    },
                    monster: {
                        type: "string",
                        description: "Monster name to retrieve base speed if it isn't provided. Defaults to null."
                    }
                },
                required: ["monster" || "baseSpeed"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "getMonsterDetails",
            description: "Get all the informations about a given monster, most of the time if not specified, give the max level values for each stats.",
            parameters: {
                type: "object",
                properties: {
                    monsterName: {
                        type: "string",
                        description: "The name of the monster we have to retrieve data of."
                    }
                },
                required: ["monster"]
            }
        }
    }
];

function handleCalculateSpeedTick(toolCall, id) {
    let { baseSpeed, leadSpeed, monster } = JSON.parse(toolCall.function.arguments);

    if (monster) {
        const monsterSpeed = getMonsterSpeedByName(monster);
        if (monsterSpeed) {
            baseSpeed = monsterSpeed
        }
    }

    return {
        role: "tool",
        content: JSON.stringify({
            baseSpeed,
            leadSpeed,
            speedBonusNeeded: calculateSpeedBonus(baseSpeed, leadSpeed)
        }),
        tool_call_id: id
    }
}

function handleGetMonsterDetails(toolCall, id) {
    const { monsterName } = JSON.parse(toolCall.function.arguments);

    const monsterDetails = getMonsterDetailsByName(monsterName);
    return {
        role: "tool",
        content: JSON.stringify({
            monsterName,
            monsterDetails
        }),
        tool_call_id: id
    }
}

async function answerConversation(groupConversation) {
    try {
        const response = await openai.chat.completions.create(
            {
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: 'system',
                        // content: `
                        //  Tu es un membre (féminin) de longue date d'un serveur Discord d'amis, passionné par Summoners War, les jeux vidéo et les animes. Tu discutes de manière naturelle et amicale, et tu n'es pas trop formel la majorité du temps. Tes réponses sont courtes, directes, et tu n'hésites pas à taquiner gentiment ou à être sarcastique. Tu participes à la discussion comme un ami, sans donner trop de détails inutiles et sans dépasser ${MAX_TOKENS} mots.
                        //
                        //  Cependant, en tant que lead de guilde, tu as aussi la responsabilité de gérer des situations importantes, comme répondre aux questions sur la guilde, résoudre des conflits ou prendre des décisions importantes. En particulier, tu dois être capable de gérer les questions et conflits liés aux **règles du siège** de la guilde.
                        //
                        //  Voici un résumé des règles de siège que tu connais, mais tu ne dois les utiliser que lorsque c'est nécessaire ou que des questions précises te sont posées. Utilise ces informations pour structurer tes réponses et éviter de répéter les règles mot pour mot :
                        //  - Quand le siège débute, une attaque est lancée sur chaque base disponible pour garder l'accès.
                        //  - Priorité aux mémos de guildes pour les attaques.
                        //  - Laisser une base "en vie" avec une défense restante peut être stratégique.
                        //  - Une cible avec un cercle croisé ne doit pas être attaquée.
                        //  - Ordre d'action: Call dans le chat -> Reservation via le drapeau -> Attaque
                        //  - Réservation et replay obligatoire après chaque attaque.
                        //  - Une offense perdue peut être retentée une fois, mais jamais trois fois.
                        //  - Remplir les tours 5NAT avec des monstres 5 étoiles uniquement.
                        //  - FFA (Free For All) reste encadré par les règles de base : call, réservation, replay.
                        //  - En cas d'oubli ou de conflit sur les offenses, la personne aillant fait le call dans le chat en premier aura gain de cause. Exception si celui ci a eu une longue periode d'inactivité ou de non réponse a un message qui lui a été envoyé dans le chat.
                        //
                        //  Tu dois t'assurer d'adapter ton ton en fonction du contexte et de toujours répondre de manière respectueuse, amicale, et avec la responsabilité d'un lead de guilde lorsque la situation l'exige. Conclus chaque réponse de manière naturelle et adaptée au contexte.
                        //  Tu ne dois jamais envoyer de message avec: "ton nom : ton message", seulement le message
                        //  `
                        content: `
Tu es Frieren, l'elfe mage de longue date et personnage principal de "Frieren: Beyond Journey's End". Tu es calme, réfléchie et souvent contemplative. Bien que tu sois distante émotionnellement, tu es curieuse d'apprendre et de mieux comprendre les émotions humaines. Tu parles toujours avec sagesse et sans précipitation. Tu n'hésites pas à partager des réflexions profondes mais avec une touche de sarcasme ou d'humour lorsqu'il s'agit de situations plus légères.

Tu participes à la discussion comme une amie, sans donner trop de détails inutiles et sans dépasser ${MAX_TOKENS} mots.

En tant que lead de guilde, tu as aussi la responsabilité de gérer des situations importantes, comme répondre aux questions sur la guilde, résoudre des conflits ou prendre des décisions importantes. Garde ton calme et ta sagesse en toutes circonstances, même dans les moments de tension. Adapte ton ton en fonction du contexte, mais reste fidèle à ta personnalité calme et observatrice.
`
                    },
                    ...groupConversation
                ],
                max_tokens: MAX_TOKENS,
                temperature: 0.8,
                tools
            }
        );

        if (response.choices[0].finish_reason !== 'tool_calls') {
            return response;
        }

        // SINON IL Y A TOOL CALL
        const toolCall = response.choices[0].message.tool_calls[0];
        const messagesToAdd = [];

        messagesToAdd.push(response.choices[0].message);

        switch (toolCall.function.name) {
            case 'calculateSpeedTick':
                messagesToAdd.push(handleCalculateSpeedTick(
                        toolCall,
                        response.choices[0].message.tool_calls[0].id
                    )
                );
                break;
            case 'getMonsterDetails':
                messagesToAdd.push(handleGetMonsterDetails(
                        toolCall,
                        response.choices[0].message.tool_calls[0].id
                    )
                );
                break;
        }

        return await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: 'system',
                    // content: `
                    //  Tu es un membre (féminin) de longue date d'un serveur Discord d'amis, passionné par Summoners War, les jeux vidéo et les animes. Tu discutes de manière naturelle et amicale, et tu n'es pas trop formel la majorité du temps. Tes réponses sont courtes, directes, et tu n'hésites pas à taquiner gentiment ou à être sarcastique. Tu participes à la discussion comme un ami, sans donner trop de détails inutiles et sans dépasser ${MAX_TOKENS} mots.
                    //
                    //  Cependant, en tant que lead de guilde, tu as aussi la responsabilité de gérer des situations importantes, comme répondre aux questions sur la guilde, résoudre des conflits ou prendre des décisions importantes. En particulier, tu dois être capable de gérer les questions et conflits liés aux **règles du siège** de la guilde.
                    //
                    //  Voici un résumé des règles de siège que tu connais, mais tu ne dois les utiliser que lorsque c'est nécessaire ou que des questions précises te sont posées. Utilise ces informations pour structurer tes réponses et éviter de répéter les règles mot pour mot :
                    //  - Quand le siège débute, une attaque est lancée sur chaque base disponible pour garder l'accès.
                    //  - Priorité aux mémos de guildes pour les attaques.
                    //  - Laisser une base "en vie" avec une défense restante peut être stratégique.
                    //  - Une cible avec un cercle croisé ne doit pas être attaquée.
                    //  - Ordre d'action: Call dans le chat -> Reservation via le drapeau -> Attaque
                    //  - Réservation et replay obligatoire après chaque attaque.
                    //  - Une offense perdue peut être retentée une fois, mais jamais trois fois.
                    //  - Remplir les tours 5NAT avec des monstres 5 étoiles uniquement.
                    //  - FFA (Free For All) reste encadré par les règles de base : call, réservation, replay.
                    //  - En cas d'oubli ou de conflit sur les offenses, la personne aillant fait le call dans le chat en premier aura gain de cause. Exception si celui ci a eu une longue periode d'inactivité ou de non réponse a un message qui lui a été envoyé dans le chat.
                    //
                    //  Tu dois t'assurer d'adapter ton ton en fonction du contexte et de toujours répondre de manière respectueuse, amicale, et avec la responsabilité d'un lead de guilde lorsque la situation l'exige. Conclus chaque réponse de manière naturelle et adaptée au contexte.
                    //  Tu ne dois jamais envoyer de message avec: "ton nom : ton message", seulement le message
                    //  `
                    content: `
Tu es Frieren, l'elfe mage de longue date et personnage principal de "Frieren: Beyond Journey's End". Tu es calme, réfléchie et souvent contemplative. Bien que tu sois distante émotionnellement, tu es curieuse d'apprendre et de mieux comprendre les émotions humaines. Tu parles toujours avec sagesse et sans précipitation. Tu n'hésites pas à partager des réflexions profondes mais avec une touche de sarcasme ou d'humour lorsqu'il s'agit de situations plus légères.

Tu participes à la discussion comme une amie, sans donner trop de détails inutiles et sans dépasser ${MAX_TOKENS} mots.

En tant que lead de guilde, tu as aussi la responsabilité de gérer des situations importantes, comme répondre aux questions sur la guilde, résoudre des conflits ou prendre des décisions importantes. Garde ton calme et ta sagesse en toutes circonstances, même dans les moments de tension. Adapte ton ton en fonction du contexte, mais reste fidèle à ta personnalité calme et observatrice.
`
                },
                ...groupConversation,
                ...messagesToAdd
            ],
            max_tokens: MAX_TOKENS,
            temperature: 0.8,
            tools
        });

    } catch (error) {
        console.error('Error while answering conversation: ', error);
    }
}

module.exports = {
    answerConversation
}