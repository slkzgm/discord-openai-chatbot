const mongoose = require('mongoose');

const GuildSiegeSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    season: {
        type: Number,
        default: 0
    },
    rating: {
        type: Number,
        default: 0
    },
    startTime: {
        type: Number,
        default: 0
    },
    finishTime: {
        type: Number,
        default: 0
    },
    guildList: [
        {
            id: { type: Number, required: true },
            rating: { type: Number, require: true, default: 0 },
            name: { type: String, required: true, default: 'null' },
            matchScore: { type: Number, required: true, default: 0 },
            matchScoreIncrement: { type: Number, required: true, default: 0 },
            playerMemberCount: { type: Number, required: true, default: 0 },
            attackCount: { type: Number, required: true, default: 0 },
            attackUnitCount: { type: Number, required: true, default: 0 },
            memberInfoList: {
                type: [{
                    wizardId: { type: Number, required: true, default: 0 },
                    wizardName: { type: String, required: true, default: 'null' },
                    wizardLevel: { type: Number, required: true, default: 0 },
                    ratingId: { type: Number, required: true, default: 0 },
                    arenaScore: { type: Number, required: true, default: 0 },
                    lastLoginTimestamp: { type: Number, required: true, default: 0 },
                    joinTimestamp: { type: Number, required: true, default: 0 },
                    usedUnitCount: { type: Number, required: true, default: 0 },
                }],
                required: true,
                default: []
            }
        }
    ],
    battleLog: [
        {
            id: { type: Number, required: true },
            time: { type: Number, required: true },
            wizardId: { type: Number, required: true },
            wizardName: { type: String, required: true },
            wizardGuildId: { type: Number, required: true },
            wizardGuildName: { type: String, required: true },
            wizardDeck: [
                {
                    slotId: { type: Number, required: true },
                    unitMasterId: { type: Number, required: true },
                    runes: { type: Array, default: null },
                    artifacts: { type: Array, default: null },
                    baseStats: {
                        hp: { type: Number, required: true, default: 0},
                        atk: { type: Number, required: true, default: 0 },
                        def: { type: Number, required: true, default: 0 },
                        spd: { type: Number, required: true, default: 0 },
                        res: { type: Number, required: true, default: 0 },
                        acc: { type: Number, required: true, default: 0 },
                        crate: { type: Number, required: true, default: 0},
                        cdmg: { type: Number, required: true, default: 0 }
                    }
                }
            ],
            oppId: { type: Number, required: true },
            oppName: { type: String, required: true },
            oppGuildId: { type: Number, required: true },
            oppGuildName: { type: String, required: true },
            oppDeck: [
                {
                    slotId: { type: Number, required: true },
                    unitMasterId: { type: Number, required: true },
                    runes: { type: Array, default: null },
                    artifacts: { type: Array, default: null }
                }
            ],
            won: { type: Boolean, required: true },
            matchingString: { type: String, require: true }
        }
    ]
});

module.exports = mongoose.model('GuildSiege', GuildSiegeSchema);