const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../..');

function runScript(scriptName, options = {}) {
    const scriptPath = path.join(repoRoot, scriptName);
    return spawnSync('bash', [scriptPath, '--verify'], {
        cwd: options.cwd || repoRoot,
        encoding: 'utf8',
    });
}

describe('installer verification', () => {
    it('install_client.sh --verify succeeds in repository root', () => {
        const result = runScript('install_client.sh');
        assert.equal(result.status, 0, result.stderr);
        assert.match(result.stdout, /preconditions satisfied/i);
    });

    it('install_data.sh --verify succeeds in repository root', () => {
        const result = runScript('install_data.sh');
        assert.equal(result.status, 0, result.stderr);
        assert.match(result.stdout, /preconditions satisfied/i);
    });

    it('install_client.sh --verify fails when assets directory is missing', () => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skrid-install-'));
        try {
            const result = runScript('install_client.sh', { cwd: tempDir });
            assert.notEqual(result.status, 0, 'Script should fail without assets directory');
            assert.match(result.stderr, /expected assets directory/i);
        } finally {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    it('install_data.sh --verify fails when assets directory is missing', () => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skrid-install-'));
        try {
            const result = runScript('install_data.sh', { cwd: tempDir });
            assert.notEqual(result.status, 0, 'Script should fail without assets directory');
            assert.match(result.stderr, /expected assets directory/i);
        } finally {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });
});
