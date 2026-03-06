const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    let token = req.headers.authorization;

    if (!token) {
        return res.status(403).json({ message: 'No token provided.' });
    }

    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length).trimLeft();
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized. Token is invalid or expired.' });
        }
        req.userId = decoded.id;
        req.userRole = decoded.role;
        req.username = decoded.username;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.userRole !== 'ADMIN') {
        return res.status(403).json({ message: 'Require Admin Role.' });
    }
    next();
};

const isStudent = (req, res, next) => {
    if (req.userRole !== 'STUDENT') {
        return res.status(403).json({ message: 'Require Student Role.' });
    }
    next();
};

const isParent = (req, res, next) => {
    if (req.userRole !== 'PARENT') {
        return res.status(403).json({ message: 'Require Parent Role.' });
    }
    next();
};

module.exports = {
    verifyToken,
    isAdmin,
    isStudent,
    isParent
};
