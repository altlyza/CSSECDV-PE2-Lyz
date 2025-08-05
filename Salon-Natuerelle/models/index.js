const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const db = {};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Initialize models using factory functions
db.User = require('./user')(sequelize, DataTypes);
db.Service = require('./service')(sequelize, DataTypes);
db.Reservation = require('./reservation')(sequelize, DataTypes);
db.AuditLog = require('./auditLog')(sequelize, DataTypes);

// Define associations
db.User.hasMany(db.Reservation, { foreignKey: 'userId', as: 'reservations' });
db.Reservation.belongsTo(db.User, { foreignKey: 'userId', as: 'customer' });

db.Service.hasMany(db.Reservation, { foreignKey: 'serviceId' });
db.Reservation.belongsTo(db.Service, { foreignKey: 'serviceId' });

db.User.hasMany(db.Service, { foreignKey: 'createdBy', as: 'createdServices' });
db.Service.belongsTo(db.User, { foreignKey: 'createdBy', as: 'creator' });

db.User.hasMany(db.AuditLog, { foreignKey: 'userId' });
db.AuditLog.belongsTo(db.User, { foreignKey: 'userId' });

module.exports = db;
