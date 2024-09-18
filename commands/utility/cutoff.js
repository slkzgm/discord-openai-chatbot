const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cutoff')
        .setDescription('Récupérer les cutoffs de chaque rang en RTA.'),

    async execute(interaction) {
        try {
            const response = await fetch("https://m.swranking.com/api/player/nowline", {
                "headers": {
                    "accept": "*/*",
                    "accept-language": "en,fr;q=0.9",
                    "authentication": "null",
                    "sec-ch-ua": "\"Chromium\";v=\"128\", \"Not;A=Brand\";v=\"24\", \"Google Chrome\";v=\"128\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "\"Windows\"",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin"
                },
                "referrer": "https://m.swranking.com/",
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": null,
                "method": "GET",
                "mode": "cors",
                "credentials": "omit"
            });

            const data = await response.json();

            if (data.retCode !== 0) {
                await interaction.reply('Erreur lors de la récupération des cutoffs.');
                return;
            }

            // Construction du message avec les informations récupérées
            const cutoffMessage = `
                **Cutoffs RTA :**\n<:rating_30:1285929150288367679>: \`${data.data.c1.score} points\`\n<:rating_30:1285929150288367679>: \`${data.data.c2.score} points\`\n<:rating_30:1285929150288367679>: \`${data.data.c3.score} points\`\n\n<:rating_35:1285929187613474826>: \`${data.data.s1.score} points\`\n<:rating_35:1285929187613474826>: \`${data.data.s2.score} points\`\n<:rating_35:1285929187613474826>: \`${data.data.s3.score} points\`\n\n<:rating_40:1285929197881004053>: \`${data.data.g1.score} points\`\n<:rating_40:1285929197881004053>: \`${data.data.g2.score} points\`\n<:rating_40:1285929197881004053>: \`${data.data.g3.score} points\`
                `;

            await interaction.reply(cutoffMessage);

        } catch (error) {
            await interaction.reply('Erreur lors de la récupération des cutoffs RTA.');
        }
    },
};