const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { answerConversation } = require("./openai");
const connectDB = require('./database/connection');
require('dotenv').config();

// TODO:
// - Retirer le fait qu'elle soit trop bavarde (eviter de relancer la conv pour rien)
// - Apprendre le lore du personnage
// - Utiliser la fonction pour les ticks
// - Fine-Tune SW et siege

// Création du client Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});
client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

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

let groupConversations = {}; // Pour gérer plusieurs conversations par channel
let tokensUsed = {};
let resetTimeouts = {};
const HISTORY_LIMIT = 15;
const MAX_TOKENS = 10000;
let MAX_MESSAGES_NO_RESPONSE = 50; // Nombre de messages sans que le bot ne soit mentionné
let RESET_TIMEOUT = 300000; // 5 minutes d'inactivité avant de réinitialiser la conversation

async function answer(message, channelId) {
    await message.channel.sendTyping();

    // Vérifie si quelqu'un remercie ou clôture la conversation
    if (message.content.toLowerCase().includes("merci")
        || message.content.toLowerCase().includes("c'est tout")
        || message.content.toLowerCase().includes("cimer")
    ) {
        await message.reply(getRandomResponse('thanks'));
        resetConversation(channelId); // Réinitialise la conversation sur un merci ou c'est tout
        return;
    }

    try {
        await message.channel.sendTyping();
        const response = await answerConversation(groupConversations[channelId]);
        const botResponse = response.choices[0].message.content.trim();

        groupConversations[channelId].push({
            role: 'assistant',
            content: botResponse
        });

        tokensUsed[channelId] += response.usage.total_tokens;

        await message.channel.send(botResponse);
        if (tokensUsed[channelId] >= MAX_TOKENS) {
            await message.channel.send(getRandomResponse('tooMuchTalking'));
            resetConversation(channelId); // Réinitialise la conversation
        }
    } catch (error) {
        console.error("Erreur lors de l'appel à l'API OpenAI :", error);
        await message.reply("Désolé, une erreur s'est produite.");
        resetConversation(channelId); // Réinitialise la conversation en cas d'erreur
    }
}

// Timer de réinitialisation après un certain délai (X minutes)
function startResetTimeout(channelId) {
    if (resetTimeouts[channelId]) {
        clearTimeout(resetTimeouts[channelId]);
    }

    resetTimeouts[channelId] = setTimeout(() => {
        const lastMessage = groupConversations[channelId][groupConversations[channelId].length - 1];
        // Ne réinitialise que si le dernier message n'est pas du bot ET que le délai d'inactivité est dépassé
        if (lastMessage.role !== 'assistant') {
            resetConversation(channelId); // Réinitialise la conversation après X minutes d'inactivité
        }
    }, RESET_TIMEOUT); // 5 minutes d'inactivité
}

function resetConversation(channelId) {
    groupConversations[channelId] = [];
    tokensUsed[channelId] = 0;
    clearTimeout(resetTimeouts[channelId]);
}

client.once('ready', async () => {
    await connectDB();
    console.log(`Connecté en tant que ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    const channelId = message.channel.id; // Utilise l'ID du channel pour gérer plusieurs conversations

    // Vérifie si le bot est mentionné
    if (message.mentions.has(client.user)) {
        // Si la conversation n'existe pas encore
        if (!groupConversations[channelId] || !groupConversations[channelId].length) {
            // Initialiser la conversation et le nombre de tokens utilisés
            groupConversations[channelId] = [];
            tokensUsed[channelId] = 0;

            // Récupérer l'historique des messages précédents pour le contexte
            const history = await message.channel.messages.fetch({ limit: HISTORY_LIMIT });
            history.reverse().forEach(msg => {
                groupConversations[channelId].push({
                    role: 'user',
                    content: `${msg.author.globalName}: ${msg.content}`
                });
            });
        } else { // Si la conversation est deja active
            groupConversations[channelId].push({
                role: 'user',
                content: `${message.author.globalName}: ${message.content}`
            });
        }

        await answer(message, channelId);
        // startResponseTimeout(message, channelId); // Démarre le délai pour la réponse automatique
        startResetTimeout(channelId); // Démarre le délai pour la réinitialisation automatique
        return;
    }

    // Si la conversation existe et continue sans mention du bot, on réinitialise le timer d'inactivité
    if (groupConversations[channelId] && groupConversations[channelId].length > 0) {
        groupConversations[channelId].push({
            role: 'user',
            content: `${message.author.globalName}: ${message.content}`
        });

        // startResponseTimeout(message, channelId); // Redémarre le délai pour la réponse automatique
        startResetTimeout(channelId); // Redémarre le délai pour la réinitialisation

        // Si le nombre de messages sans sollicitation dépasse la limite, réinitialise
        const assistantMessages = groupConversations[channelId].filter(msg => msg.role === 'assistant').length;
        if (groupConversations[channelId].length - assistantMessages >= MAX_MESSAGES_NO_RESPONSE) {
            resetConversation(channelId); // Réinitialise après trop de messages sans sollicitation
        }
    }
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

// Connecte le bot à Discord avec le token
client.login(process.env.DISCORD_TOKEN);