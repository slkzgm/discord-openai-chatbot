const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLatestGuildSiege } = require('../../database/controllers/GuildSiegeController');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('siege')
        .setDescription('Récupérer les infos sur le siège en cours.'),

    async execute(interaction) {
        const latestSiege = await getLatestGuildSiege();
        const myGuildInfo = latestSiege.guildList.find(guild => guild.memberInfoList.length);

        if (!myGuildInfo) {
            return await interaction.reply("No data found for your guild.");
        }

        // Formater les timestamps pour Discord
        const started = `<t:${latestSiege.startTime}:R>`;
        const estimatedEnd = `<t:${latestSiege.finishTime}:R>`;

        // Arrondir le matchScore
        const matchScore = Math.round(myGuildInfo.matchScore).toLocaleString('fr-FR');
        const matchScoreIncrement = Math.round(myGuildInfo.matchScoreIncrement).toLocaleString('fr-FR');

        // Calculer les unités restantes pour les membres
        const siegeMember = myGuildInfo.memberInfoList.filter(member => member.usedUnitCount > -1)
            .map(member => {
                const unitLeft = 30 - member.usedUnitCount; // Calculer les unités restantes
                return {
                    wizardName: member.wizardName || 'Unknown WizardName',
                    unitLeft,
                    offs: Math.floor(unitLeft / 3) // Calculer le nombre d'offensives restantes par membre
                };
            })
            .filter(member => member.unitLeft > 0) // Filtrer pour garder uniquement ceux avec des unités restantes
            .sort((a, b) => b.unitLeft - a.unitLeft); // Trier par ordre décroissant des unités restantes

        // Somme des unités restantes et des offs
        const totalUnitsLeft = siegeMember.reduce((sum, member) => sum + member.unitLeft, 0);
        const totalOffsLeft = siegeMember.reduce((sum, member) => sum + member.offs, 0); // Somme des offs restantes

        // Créer un Embed pour votre guilde
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`Siege Info`)
            .setDescription(`Started: ${started} | Estimated End: ${estimatedEnd}`)
            .addFields(
                {
                    name: `**${myGuildInfo.name}**`, value:
                        `**Match Score:** ${matchScore} pts (+${matchScoreIncrement}/mn)\n` +
                        `**Used Offs:** ${myGuildInfo.attackCount} offs (${myGuildInfo.attackUnitCount} units)\n` +
                        `**Offs Left:** ~${totalOffsLeft}`
                }
            );

        // Ajout des membres
        if (siegeMember.length > 0) {
            // const membersList = siegeMember.map(member => `${member.wizardName}: ${member.offs} offs (${member.unitLeft} units left)`).join('\n');
            const membersList = siegeMember.map(member => `${member.wizardName}: ${member.offs} offs left)`).join('\n');
            embed.addFields({ name: '**Members**', value: `\`\`\`${membersList}\`\`\`` }); // Bloc de code pour les membres
        } else {
            embed.addFields({ name: '**Members**', value: "No units left." });
        }

        // Ajouter les guildes ennemies en tant que champs individuels
        const enemyGuilds = latestSiege.guildList
            .filter(guild => guild.id !== myGuildInfo.id); // Filtrer pour exclure votre guilde

        enemyGuilds.forEach(guild => {
            const enemyMatchScore = Math.round(guild.matchScore).toLocaleString('fr-FR');
            const enemyMatchScoreIncrement = Math.round(guild.matchScoreIncrement).toLocaleString('fr-FR');
            // Calculer le nombre d'offensives maximales pour les ennemis
            const maxOffs = Math.floor(guild.playerMemberCount * 10); // Chaque membre peut avoir 10 offs
            const enemyOffsLeft = Math.max(0, maxOffs - guild.attackCount); // Offs restantes

            // Ajouter un champ pour chaque guilde ennemie
            embed.addFields({
                name: `**${guild.name}**`,
                value:
                    `**Match Score:** ${enemyMatchScore} pts (+${enemyMatchScoreIncrement}/mn)\n` +
                    `**Used Offs:** ${guild.attackCount} offs (${guild.attackUnitCount} units)\n` +
                    `**Offs Left:** ~${enemyOffsLeft}\n`
            });
        });

        if (enemyGuilds.length === 0) {
            embed.addFields({ name: '**Opponents Guilds**', value: "Opponents guild not found." });
        }

        await interaction.reply({ embeds: [embed] });
    }
}