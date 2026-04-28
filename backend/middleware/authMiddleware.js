const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded; // { id, username, role, business_id }
        
        if (!req.user.business_id) {
            return res.status(403).json({ message: 'User does not belong to a business' });
        }
        
        next();
    } catch (err) {
        console.error('Token verification failed:', err.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
}

function authorize(roles) {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: 'User role context missing' });
        }
        
        // Owner bypasses all restrictions
        const userRole = req.user.role.toLowerCase();
        if (userRole === 'owner') {
            return next();
        }

        // Check if the lowercase role is in the lowercase roles array
        const allowedRoles = roles.map(r => r.toLowerCase());
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ message: 'Permission denied: Insufficient privileges' });
        }

        next();
    };
}

module.exports = { requireAuth, authorize };
