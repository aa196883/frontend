const http = require('http');
const { Blob, FormData } = global;
const fs = require('fs');
const path = require('path');

class RequestBuilder {
    constructor(app, method, requestPath) {
        this.app = app;
        this.method = method;
        this.requestPath = requestPath;
        this.headers = {};
        this.body = undefined;
        this.attachments = [];
        this.fields = new Map();
    }

    set(header, value) {
        this.headers[header] = value;
        return this;
    }

    send(body) {
        this.body = body;
        return this;
    }

    field(name, value) {
        this.fields.set(name, value);
        return this;
    }

    attach(name, filePath, filename) {
        this.attachments.push({ name, filePath, filename: filename || path.basename(filePath) });
        return this;
    }

    async expectStatus(expectedStatus) {
        const response = await this.execute();
        if (response.status !== expectedStatus) {
            const error = new Error(`Expected status ${expectedStatus} but received ${response.status}`);
            error.response = response;
            throw error;
        }
        return response;
    }

    async execute() {
        const options = {
            method: this.method,
            headers: { ...this.headers },
        };

        let bodyToSend;
        if (this.attachments.length > 0 || this.fields.size > 0) {
            const form = new FormData();
            for (const [key, value] of this.fields.entries()) {
                form.append(key, value);
            }
            for (const attachment of this.attachments) {
                const fileContent = fs.readFileSync(attachment.filePath);
                form.append(attachment.name, new Blob([fileContent]), attachment.filename);
            }
            bodyToSend = form;
        } else if (this.body !== undefined) {
            if (typeof this.body === 'object' && !(this.body instanceof Buffer)) {
                bodyToSend = JSON.stringify(this.body);
                options.headers['content-type'] = options.headers['content-type'] || 'application/json';
            } else {
                bodyToSend = this.body;
            }
        }

        if (bodyToSend !== undefined) {
            options.body = bodyToSend;
        }

        return new Promise((resolve, reject) => {
            const server = http.createServer(this.app);
            server.listen(0, async () => {
                const { port } = server.address();
                const url = `http://127.0.0.1:${port}${this.requestPath}`;
                try {
                    const res = await fetch(url, options);
                    const text = await res.text();
                    let parsedBody;
                    try {
                        parsedBody = text.length ? JSON.parse(text) : undefined;
                    } catch (err) {
                        parsedBody = text;
                    }
                    resolve({ status: res.status, body: parsedBody, text, headers: res.headers });
                } catch (error) {
                    reject(error);
                } finally {
                    server.close();
                }
            });
        });
    }
}

function createClient(app) {
    return {
        get: (requestPath) => new RequestBuilder(app, 'GET', requestPath),
        post: (requestPath) => new RequestBuilder(app, 'POST', requestPath),
    };
}

module.exports = {
    request: createClient,
};
