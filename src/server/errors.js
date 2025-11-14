class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
        this.status = 422;
        this.expose = true;
    }
}

module.exports = {
    ValidationError,
};
