const { Client, GatewayIntentBits } = require('discord.js');
const { answerConversation } = require("./openai");
require('dotenv').config();

// Création du client Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Variations des messages
const responses = {
    thanks: [
        "Content d'avoir pu éclairer ta lanterne, à bientôt !",
        "Toujours dispo pour aider, tu sais où me trouver !",
        "Ça me fait plaisir de rendre service, à la prochaine !",
        "Bon, mission accomplie, je me retire en silence 😎",
        "Heureux d’avoir pu participer, on se revoit bientôt j’espère !",
        "Je m’envole vers d'autres aventures. À la prochaine ! 🦸‍♂️",
        "Si t’as encore besoin, tu sais où cliquer, hein 😉",
        "Content de t’avoir aidé, mais c’est l’heure pour moi de briller ailleurs ✨",
        "Eh bien, je suppose que c’est tout pour moi, allez ciao !",
        "Une aide de qualité, c’est tout naturel avec moi 😏",
        "Ravi d’avoir pu vous assister, cher ami. Au plaisir !",
        "Je disparais dans les ombres… enfin, jusqu’à la prochaine question !",
        "Allez, un plaisir comme d’hab, on se capte plus tard !",
        "Hé, c’est toujours un honneur d’aider. À bientôt, bande de geeks !",
        "Le bot est mort, vive le bot ! À la prochaine fois 😉",
        "Avec un peu de runes et de chance, on arrive à tout ! À bientôt les invocateurs !",
        "Content d'avoir boosté ton niveau, on se recroise bientôt sur l'arène !",
        "C’était aussi efficace qu’un combo bien placé dans Summoners War. À plus tard !",
        "Toujours là pour filer un coup de main, comme un bon support en arène !",
        "T’as géré comme un héros de shonen, maintenant go farmer des donjons !",
        "Bon, t’es prêt pour ton prochain éveil ? À la prochaine invocation !",
        "Aide terminée, on se revoit après ton prochain scroll mystique !",
        "Je suis pas un personnage 5 étoiles, mais je fais le taf 😉",
        "Ravi d’avoir pu t’épauler, maintenant go grinder ces runes !",
        "Comme un bon vieux power-up d’anime, j’ai fait mon taf. À la revoyure !",
        "Ouais, t'as maîtrisé cette question comme un pro d'arène. À bientôt pour un duel !",
        "Heureux d’avoir aidé, maintenant farm les gemmes !",
        "Mission accomplie, j'suis prêt pour le prochain challenge. À plus dans le Rift !",
        "Bon, t’as maintenant toutes les cartes en main. Prêt pour l’arène ?",
        "C’était aussi satisfaisant qu’un ultimate bien placé. À plus tard !"
    ],
    tooMuchTalking: [
        "Wouah, trop de blabla, j’ai besoin d’une pause là 😴",
        "Ouh là, ça devient intense, je vais prendre du recul !",
        "Vous êtes bavards, je me retire avant que ça devienne trop sérieux.",
        "Eh oh, je vais finir par surchauffer avec tout ça, peace out !",
        "Trop de mots, trop d'infos, j'abandonne 😵",
        "Vous parlez autant que des conférenciers, je vous laisse entre pros 😜",
        "Bon, trop de discussions, je vais prendre une sieste !",
        "Je vous laisse, vous êtes en pleine conférence TED là ou quoi ?",
        "Oubliez pas de respirer entre deux phrases hein !",
        "Vous débattez comme des philosophes. Moi, je sors du game !",
        "Bon, c’est bien beau, mais là, je m’éclipse avant l’explosion neuronale !",
        "Hey, je vous laisse entre bavards, moi je vais regarder des mèmes.",
        "Vous avez trop de choses à dire, moi j’arrête là !",
        "Je vous laisse papoter, moi j’ai besoin d’un café ☕",
        "Ok ok, j'abandonne, trop de dialogue pour moi, bye les intellos !",
        "Ok ok, je m’éclipse avant qu’on se retrouve dans un débat digne de One Piece 😅",
        "Ça commence à ressembler à un épisode filler, je vais farm mes runes ailleurs !",
        "Vous parlez plus qu’un shonen en plein arc narratif, je prends la tangente !",
        "C’est pire qu’un GvG tendu là, je vais prendre un break !",
        "On dirait une discussion de fin de saison d’anime, je vais me poser un peu !",
        "C’est devenu plus intense qu’un combat contre un boss de raid, je me casse !",
        "Trop de blabla, je vais invoquer du calme ailleurs. À plus !",
        "Oulah, ça devient plus long qu’un épisode de Hunter x Hunter. Break time !",
        "On dirait un arc narratif qui ne finit jamais, je prends la porte !",
        "Je vais pas faire un AFK comme dans Summoners War, mais je vous laisse discuter !",
        "Vous êtes plus longs que l'attente entre deux events, moi je vais en arène !",
        "Trop de strats et pas assez d’action, je me déconnecte avant l’overload !",
        "Vous êtes plus bavards qu’un héros de shonen en plein discours !",
        "Je pensais être dans une arène, mais là c'est un marathon de paroles. Pause time !",
        "Vous gérez la conversation comme un boss de raid, mais là je sature. À plus !"
    ]
};

// Sélectionner un message aléatoire
function getRandomResponse(category) {
    const messages = responses[category];
    return messages[Math.floor(Math.random() * messages.length)];
}

let groupConversation = null;
let tokensUsed = 0;
const MAX_TOKENS = 10000;
let conversationTimeout;

async function answer(message) {
    // Déclenche "XX est en train d'écrire..."
    await message.channel.sendTyping();

    // Vérifie si quelqu'un remercie ou clôture la conversation
    if (message.content.toLowerCase().includes("merci") || message.content.toLowerCase().includes("c'est tout")) {
        await message.reply(getRandomResponse('thanks'));
        groupConversation = null; // Réinitialise la conversation de groupe
        tokensUsed = 0;
        return;
    }

    // Ajoute le message de l'utilisateur dans la conversation
    groupConversation.push({
        role: 'user',
        content: `${message.author.username}: ${message.content}`
    });

    // Si au moins 3 messages sont échangés, le bot peut générer une réponse
    if (groupConversation.length >= 3) {
        try {
            // Simule que le bot est en train d'écrire pendant que l'API génère la réponse
            await message.channel.sendTyping();

            const response = await answerConversation(groupConversation);

            const botResponse = response.choices[0].message.content.trim();

            // Enregistre la réponse du bot dans l'historique de la conversation
            groupConversation.push({
                role: 'assistant',
                content: botResponse
            });

            // Incrémente le nombre de tokens utilisés
            tokensUsed += response.usage.total_tokens;

            // Si le nombre maximal de tokens est atteint, arrêter la conversation
            if (tokensUsed >= MAX_TOKENS) {
                await message.channel.send(getRandomResponse('tooMuchTalking'));
                groupConversation = null;
                tokensUsed = 0;
            } else {
                // Sinon, le bot répond au message
                await message.channel.send(botResponse);
            }

        } catch (error) {
            console.error("Erreur lors de l'appel à l'API OpenAI :", error);
            await message.reply("Désolé, une erreur s'est produite en essayant de répondre.");
            groupConversation = null; // Réinitialise la conversation en cas d'erreur
        }
    }
}

// Fonction pour réinitialiser le délai de réponse automatique
function resetConversationTimeout(message) {
    if (conversationTimeout) {
        clearTimeout(conversationTimeout);
    }

    conversationTimeout = setTimeout(async () => {
        // Vérifie si une conversation est active et si le dernier message n'est pas du bot
        if (groupConversation && groupConversation.length > 0) {
            const lastMessage = groupConversation[groupConversation.length - 1];
            if (lastMessage.role === 'assistant') {
                // Le dernier message est du bot, donc on ne répond pas automatiquement
                return;
            }

            // Si le dernier message n'est pas du bot, le bot peut proposer de l'aide après 60 secondes
            await answer(message);
        }
    }, 10000); // Répond après 60 secondes d'inactivité
}

client.once('ready', () => {
    console.log(`Connecté en tant que ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    // Empêche le bot de répondre à ses propres messages
    if (message.author.bot) return;

    // Vérifie si le bot est mentionné avec @ pour commencer ou continuer la conversation
    if (message.mentions.has(client.user)) {
        if (!groupConversation) {
            groupConversation = [];
            tokensUsed = 0; // Réinitialise les tokens utilisés

            // Récupérer l'historique des messages précédents pour le contexte
            const history = await message.channel.messages.fetch({ limit: 10 });
            history.reverse().forEach(msg => {
                groupConversation.push({
                    role: 'user',
                    content: `${msg.author.username}: ${msg.content}`
                });
            });

            await answer(message);
            resetConversationTimeout(message); // Déclenche le délai après la réponse
            return;
        } else {
            await answer(message);
            resetConversationTimeout(message); // Réinitialise le délai après chaque message
            return;
        }
    }

    // Si une conversation de groupe est en cours, mais le bot n'est pas mentionné
    if (groupConversation) {
        groupConversation.push({
            role: 'user',
            content: `${message.author.username}: ${message.content}`
        });

        resetConversationTimeout(message); // Réinitialise le délai après chaque message
    }
});

// Connecte le bot à Discord avec le token
client.login(process.env.DISCORD_TOKEN);