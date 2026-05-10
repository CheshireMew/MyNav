const { badRequest } = require('./errors');

function cleanText(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function requiredText(value, message) {
    const text = cleanText(value);
    if (!text) throw badRequest(message);
    return text;
}

function numberOrZero(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

function integerId(value, message = 'Invalid id') {
    const number = Number(value);
    if (!Number.isInteger(number)) throw badRequest(message);
    return number;
}

module.exports = {
    cleanText,
    requiredText,
    numberOrZero,
    integerId
};
