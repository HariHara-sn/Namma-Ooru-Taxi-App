const fs = require('fs');
const path = require('path');

const LOG_DIR = path.resolve(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'api_timing.txt');
const SLOW_THRESHOLD_MS = Number(process.env.API_TIMING_THRESHOLD_MS || 800);

function ensureLogDir() {
    try {
        if (!fs.existsSync(LOG_DIR)) {
            fs.mkdirSync(LOG_DIR, { recursive: true });
        }
    } catch (e) {
        // fallback: ignore directory creation errors
    }
}

function toMs(nsBigInt) {
    // nsBigInt is BigInt nanoseconds from process.hrtime.bigint()
    const ms = Number(nsBigInt) / 1e6;
    return Math.round(ms);
}

function appendLog(line) {
    ensureLogDir();
    try {
        fs.appendFile(LOG_FILE, line + '\n', { encoding: 'utf8' }, () => { });
    } catch (e) {
        // swallow file IO errors to avoid impacting request flow
    }
}

function formatLine(data) {
    // Write as JSON line for easy parsing; also readable enough in txt
    return JSON.stringify(data);
}

function logApiTiming({ methodName, path: urlPath, httpMethod, status, durationMs, extra }) {
    const timestamp = new Date().toISOString();
    const slow = durationMs >= SLOW_THRESHOLD_MS;
    const payload = {
        ts: timestamp,
        methodName,
        httpMethod,
        path: urlPath,
        status,
        durationMs,
        slow,
        ...extra,
    };

    const line = formatLine(payload);
    // live console
    // Keep console concise but clear
    // console.log(`${httpMethod} ${urlPath} -> ${status} ${durationMs}ms`);
    // file log
    appendLog(line);
}

function withTiming(controllerInstance, methodFn, options = {}) {
    const original = methodFn;
    const methodName = (original && original.name) ? original.name : (options.name || 'anonymous');

    return function timedHandler(req, res, next) {
        const startNs = process.hrtime.bigint();

        const done = () => {
            try {
                const endNs = process.hrtime.bigint();
                const durationMs = toMs(endNs - startNs);
                logApiTiming({
                    methodName,
                    path: req.originalUrl || req.url,
                    httpMethod: req.method,
                    status: res.statusCode,
                    durationMs,
                    extra: options.extra || undefined,
                });
            } catch (e) {
                // avoid throwing in finish listener
            }
        };

        // ensure we only log once per request
        let finished = false;
        const onFinish = () => { if (!finished) { finished = true; done(); } };
        res.on('finish', onFinish);
        res.on('close', onFinish);

        try {
            const result = original.call(controllerInstance, req, res, next);
            if (result && typeof result.then === 'function') {
                // Prevent unhandled rejections from being swallowed; Express will handle via next(err)
                result.catch(() => { });
            }
            return result;
        } catch (err) {
            // Log timing even if error thrown synchronously
            onFinish();
            throw err;
        }
    };
}

module.exports = {
    withTiming,
    logApiTiming,
};
