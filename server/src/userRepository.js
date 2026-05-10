function findUserByUsername(db, username) {
    return db.get('SELECT * FROM users WHERE username = ?', [username]);
}

function getAdminUser(db) {
    return db.get('SELECT * FROM users WHERE id = 1');
}

function getTokenVersion(db, id) {
    return db.get('SELECT token_version FROM users WHERE id = ?', [id]);
}

function updateAdminUser(db, values) {
    return db.run(
        'UPDATE users SET username = ?, password_hash = ?, token_version = ?, login_path = ? WHERE id = 1',
        [values.username, values.passwordHash, values.tokenVersion, values.loginPath]
    );
}

module.exports = {
    findUserByUsername,
    getAdminUser,
    getTokenVersion,
    updateAdminUser
};
