class HttpError extends Error {
    constructor(statusCode, code, message) {
        super(message);
        this.name = 'HttpError';
        this.statusCode = statusCode;
        this.code = code;
    }
}

function badRequest(message, code = 'BAD_REQUEST') {
    return new HttpError(400, code, message);
}

function unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    return new HttpError(401, code, message);
}

function forbidden(message = 'Forbidden', code = 'FORBIDDEN') {
    return new HttpError(403, code, message);
}

function notFound(message, code = 'NOT_FOUND') {
    return new HttpError(404, code, message);
}

function conflict(message, code = 'CONFLICT') {
    return new HttpError(409, code, message);
}

function httpErrorFrom(error) {
    if (error instanceof HttpError) return error;
    if (error?.name === 'SharedValidationError') {
        return badRequest(error.message);
    }
    return new HttpError(500, 'INTERNAL_ERROR', 'Request failed');
}

module.exports = {
    HttpError,
    badRequest,
    unauthorized,
    forbidden,
    notFound,
    conflict,
    httpErrorFrom
};
