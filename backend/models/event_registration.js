'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class EventRegistration extends Model {
        static associate(models) {
            EventRegistration.belongsTo(models.Event, { foreignKey: 'event_id', as: 'event' });
            EventRegistration.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
        }
    }
    EventRegistration.init({
        event_id: DataTypes.INTEGER,
        user_id: DataTypes.INTEGER,
        registration_date: DataTypes.DATE,
        qr_code: DataTypes.STRING,
        checked_in: { type: DataTypes.BOOLEAN, defaultValue: false },
        checked_in_at: DataTypes.DATE,
        custom_fields_json: DataTypes.JSONB
    }, {
        sequelize,
        modelName: 'EventRegistration',
        tableName: 'event_registrations',
        underscored: true
    });
    return EventRegistration;
};
