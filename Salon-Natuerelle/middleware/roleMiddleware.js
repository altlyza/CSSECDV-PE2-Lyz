const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
};

const isManager = (req, res, next) => {
  if (req.user && (req.user.role === 'Manager' || req.user.role === 'Admin')) {
    next();
  } else {
    res.status(403).json({ error: 'Manager access required' });
  }
};

const isCustomer = (req, res, next) => {
  if (req.user && req.user.role === 'Customer') {
    next();
  } else {
    res.status(403).json({ error: 'Customer access required' });
  }
};

const hasRole = (...roles) => {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ error: 'Insufficient permissions' });
    }
  };
};

module.exports = {
  isAdmin,
  isManager,
  isCustomer,
  hasRole
};