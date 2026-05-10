const jwt = require('jsonwebtoken');
const { unauthorized } = require('./errors');
const userRepository = require('./userRepository');

function createAuth(secret, db) {
    return async function auth(req, res, next) {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return next(unauthorized());

        try {
            const user = jwt.verify(token, secret);
            const current = await userRepository.getTokenVersion(db, user.id);
            if (!current || current.token_version !== user.token_version) {
                return next(unauthorized('Invalid or expired token', 'INVALID_TOKEN'));
            }
            req.user = user;
            next();
        } catch {
            next(unauthorized('Invalid or expired token', 'INVALID_TOKEN'));
        }
    };
}

module.exports = { createAuth };
