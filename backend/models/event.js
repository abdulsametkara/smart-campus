'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Event extends Model {
        static associate(models) {
            Event.hasMany(models.EventRegistration, { foreignKey: 'event_id', as: 'registrations' });
        }
    }
    Event.init({
        title: DataTypes.STRING,
        description: DataTypes.TEXT,
        category: DataTypes.STRING,
        date: DataTypes.DATEONLY,
        start_time: DataTypes.TIME,
        end_time: DataTypes.TIME,
        location: DataTypes.STRING,
        capacity: DataTypes.INTEGER,
        registered_count: { type: DataTypes.INTEGER, defaultValue: 0 },
        registration_deadline: DataTypes.DATE,
        is_paid: { type: DataTypes.BOOLEAN, defaultValue: false },
        price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        status: {
            type: DataTypes.ENUM('draft', 'published', 'cancelled', 'completed'),
            defaultValue: 'draft'
        }
    }, {
        sequelize,
        modelName: 'Event',
        tableName: 'events',
        underscored: true
    });
    return Event;
};
