const { AuditLog } = require('../models');

class Logger {
  static async log(action, description, userId = null, req = null) {
    try {
      const logData = {
        action,
        description,
        userId,
        timestamp: new Date()
      };

      if (req) {
        logData.ipAddress = req.ip || req.connection.remoteAddress;
        logData.userAgent = req.get('User-Agent');
      }

      await AuditLog.create(logData);
    } catch (error) {
      console.error('Error creating audit log:', error);
    }
  }

  static async logLogin(userId, success, req) {
    const action = success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED';
    const description = success 
      ? `User ${userId} logged in successfully`
      : `Failed login attempt for user ${userId}`;
    await this.log(action, description, success ? userId : null, req);
  }

  static async logUserAction(action, description, userId, req) {
    await this.log(action, description, userId, req);
  }
}

module.exports = Logger;