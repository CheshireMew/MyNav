const bcrypt = require('bcrypt');
const { cleanText } = require('./text');
const { forbidden, notFound } = require('./errors');
const userRepository = require('./userRepository');

async function login(db, username, password) {
    const user = await userRepository.findUserByUsername(db, username);
    if (!user) return null;

    const isValid = bcrypt.compareSync(password || '', user.password_hash);
    return isValid ? { id: user.id, username: user.username, token_version: user.token_version } : null;
}

async function updateUser(db, input) {
    const user = await userRepository.getAdminUser(db);
    if (!user) throw notFound('User not found');

    if (!bcrypt.compareSync(input.oldPassword || '', user.password_hash)) {
        throw forbidden('旧密码输入错误');
    }

    const username = cleanText(input.username) || user.username;
    const loginPath = cleanText(input.login_path) || user.login_path || 'login';
    const passwordHash = cleanText(input.password)
        ? bcrypt.hashSync(cleanText(input.password), 10)
        : user.password_hash;

    const tokenVersion = Number(user.token_version || 0) + 1;

    await userRepository.updateAdminUser(db, { username, passwordHash, tokenVersion, loginPath });

    return { username, login_path: loginPath };
}

module.exports = {
    login,
    updateUser
};
