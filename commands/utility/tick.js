const { SlashCommandBuilder } = require("discord.js");

function calculateAdditionalSpeed(baseSpeed, finalSpeed, speedLeadPercent, summonerSkillPercent) {
    // Convert percentages to decimal
    let leadMultiplier = speedLeadPercent / 100;
    let summonerMultiplier = summonerSkillPercent / 100;

    // Calculate the total multiplier
    let totalMultiplier = 1 + leadMultiplier + summonerMultiplier;

    // Calculate the speed after bonuses
    let bonusSpeed = baseSpeed * totalMultiplier;

    // Calculate the additional speed needed
    return finalSpeed - bonusSpeed;
}

function calculateSpeedBonus(baseSpeed, leadSpeed = 0) {
    // Seuils pour chaque tick
    const tickThresholds = {
        4: 358,
        5: 286,
        6: 239,
        7: 205,
        8: 179
    };

    // Calcul des bonus nécessaires pour chaque tick
    const bonuses = {};
    for (let tick in tickThresholds) {
        const threshold = tickThresholds[tick];
        // Bonus nécessaire, jamais négatif
        bonuses[tick] = calculateAdditionalSpeed(baseSpeed, threshold, leadSpeed, 15);
    }

    return bonuses;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tick')
        .setDescription('Calculer le bonus de speed nécessaire pour chaque tick')
        .addIntegerOption(option =>
            option.setName('basespd')
                .setDescription('La vitesse de base du monstre')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('leadspd')
                .setDescription('Le bonus de speed donné par le leader skill (%)')
                .setRequired(false)),
    async execute(interaction) {
        const baseSPD = interaction.options.getInteger('basespd');
        const leadSPD = interaction.options.getInteger('leadspd');

        const bonuses = calculateSpeedBonus(baseSPD, leadSPD);
        await interaction.reply(`
Pour une base SPD de **${baseSPD}**${ leadSPD ? `avec un lead de **${leadSPD}%**` : ' sans lead' }:\n**Tick 4 :** +${Math.ceil(bonuses[4])} speed\n**Tick 5 :** +${Math.ceil(bonuses[5])} speed\n**Tick 6 :** +${Math.ceil(bonuses[6])} speed\n**Tick 7 :** +${Math.ceil(bonuses[7])} speed\n**Tick 8 :** +${Math.ceil(bonuses[8])} speed\n
        `);
    }
};