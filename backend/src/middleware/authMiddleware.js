const { verifyAccessToken } = require('../config/jwt');

const protect = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.',
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyAccessToken(token);
        req.user = {
            ...decoded,
            id: decoded.user_id,
            user_id: decoded.user_id
        };
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired access token.',
        });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required roles: ${roles.join(', ')}.`,
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
