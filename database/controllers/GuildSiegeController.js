const GuildSiege = require('../models/GuildSiegeModel');

const getLatestGuildSiege = async () => {
    try {
        return await GuildSiege.findOne()
            .sort({id: -1})
            .limit(1);
    } catch (error) {
        console.error('Error in getLatestGuildSiege:', error);
        throw error;
    }
};

module.exports = {
    getLatestGuildSiege
}