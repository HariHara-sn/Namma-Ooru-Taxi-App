/* eslint-disable no-unused-vars */
const DocumentIntelligence = require("@azure-rest/ai-document-intelligence").default,
    { getLongRunningPoller, isUnexpected } = require("@azure-rest/ai-document-intelligence");

const { AzureKeyCredential } = require("@azure/core-auth");

const DEFAULT_INVOICE_URL = "https://raw.githubusercontent.com/Azure-Samples/cognitive-services-REST-api-samples/master/curl/form-recognizer/sample-invoice.pdf";
const DEFAULT_ID_DOCUMENT_URL = "https://raw.githubusercontent.com/Azure-Samples/cognitive-services-REST-api-samples/master/curl/form-recognizer/Passport.png";
const DEFAULT_ANALYZE_TIMEOUT_MS = 30000;
const DEFAULT_POLL_INTERVAL_MS = 10000;
const DATA_URI_PREFIX = /^data:[^;]+;base64,/i;

function looksLikeUrl(value) {
    if (typeof value !== 'string') return false;
    try {
        // eslint-disable-next-line no-new
        new URL(value);
        return true;
    } catch (_e) {
        return false;
    }
}

function looksLikeBase64(value) {
    if (typeof value !== 'string') return false;
    const normalized = value.replace(DATA_URI_PREFIX, '');
    if (normalized.length === 0 || normalized.length % 4 !== 0) return false;
    return /^[A-Za-z0-9+/]+={0,2}$/.test(normalized);
}

class OCRAPI {
    constructor() {
        this.key = process.env.OCR_KEY;
        this.endpoint = 'https://vmdocintel.cognitiveservices.azure.com/';
        this.OCR_API = 'https://vmdocintel.cognitiveservices.azure.com/';
        if (!this.key || !this.endpoint) {
            console.warn('OCR configuration missing: ensure OCR_KEY and endpoint are set');
        }
    }

    async scanDocument(invoiceSource = DEFAULT_INVOICE_URL) {
        const base64Payload = await this.ensureBase64(invoiceSource, DEFAULT_INVOICE_URL);

        const analyzeResult = await this.analyzeModel('prebuilt-invoice', { base64Source: base64Payload }, (state) => {
            console.log('Invoice analysis progress:', state?.status);
        });

        const invoice = analyzeResult?.documents?.[0];
        if (!invoice) {
            throw new Error('Expected at least one invoice in the result.');
        }

        console.log('Invoice fields:', invoice.fields);
        return invoice;
    }

    async scanIdDocument(idDocumentSource = DEFAULT_ID_DOCUMENT_URL) {
        const base64Payload = await this.ensureBase64(idDocumentSource, DEFAULT_ID_DOCUMENT_URL);

        const analyzeResult = await this.analyzeModel('prebuilt-idDocument', { base64Source: base64Payload }, (state) => {
            console.log('ID document analysis progress:', state?.status);
        });

        const document = analyzeResult?.documents?.[0];
        if (!document) {
            throw new Error('Expected at least one ID document in the result.');
        }

        const fields = document.fields || {};
        const baseInfo = {
            docType: document.docType,
            rawFields: fields,
        };

        if (document.docType === 'idDocument.driverLicense') {
            return {
                ...baseInfo,
                parsed: {
                    firstName: fields.FirstName?.valueString ?? null,
                    lastName: fields.LastName?.valueString ?? null,
                    licenseNumber: fields.DocumentNumber?.valueString ?? fields.DocumentNumber?.valueDate ?? null,
                    dateOfBirth: fields.DateOfBirth?.valueDate ?? null,
                    expirationDate: fields.DateOfExpiration?.valueDate ?? null,
                },
            };
        }

        if (document.docType === 'idDocument.passport') {
            return {
                ...baseInfo,
                parsed: {
                    firstName: fields.FirstName?.valueString ?? null,
                    lastName: fields.LastName?.valueString ?? null,
                    dateOfBirth: fields.DateOfBirth?.valueDate ?? null,
                    nationality: fields.Nationality?.valueCountryRegion ?? null,
                    passportNumber: fields.DocumentNumber?.valueString ?? null,
                    issuer: fields.CountryRegion?.valueCountryRegion ?? null,
                    expirationDate: fields.DateOfExpiration?.valueDate ?? null,
                },
            };
        }

        throw new Error(`Unknown document type in result: ${document.docType}`);
    }

    async analyzeModel(modelId, requestBody, onProgress) {
        const client = DocumentIntelligence(this.endpoint, new AzureKeyCredential(this.key));

        const initialResponse = await client
            .path("/documentModels/{modelId}:analyze", modelId)
            .post({
                contentType: "application/json",
                body: requestBody,
            });

        if (isUnexpected(initialResponse)) {
            throw initialResponse.body.error;
        }

        const poller = getLongRunningPoller(client, initialResponse);

        if (typeof poller.onProgress === 'function' && typeof onProgress === 'function') {
            poller.onProgress(onProgress);
        }

        if (typeof poller.setPollInterval === 'function') {
            poller.setPollInterval(this.getPollIntervalMs(modelId));
        }

        const timeoutMs = this.getAnalyzeTimeoutMs(modelId);

        let finalResponse;
        if (timeoutMs > 0) {
            finalResponse = await Promise.race([
                poller.pollUntilDone(),
                new Promise((_, reject) =>
                    setTimeout(() => {
                        const err = new Error('OCR_POLL_TIMEOUT');
                        err.code = 'OCR_POLL_TIMEOUT';
                        err.modelId = modelId;
                        reject(err);
                    }, timeoutMs)
                )
            ]);
        } else {
            finalResponse = await poller.pollUntilDone();
        }

        const analyzeResult =
            finalResponse?.body?.analyzeResult || finalResponse?.analyzeResult;

        if (!analyzeResult) {
            throw new Error('Failed to retrieve analyze result from OCR service');
        }

        return analyzeResult;
    }


    getAnalyzeTimeoutMs(modelId) {
        const envValue = Number(process.env.OCR_ANALYZE_TIMEOUT_MS);
        if (Number.isFinite(envValue) && envValue > 0) {
            return envValue;
        }

        return DEFAULT_ANALYZE_TIMEOUT_MS;
    }

    getPollIntervalMs(modelId) {
        const envValue = Number(process.env.OCR_POLL_INTERVAL_MS);
        if (Number.isFinite(envValue) && envValue > 0) {
            return envValue;
        }

        return DEFAULT_POLL_INTERVAL_MS;
    }

    async ensureBase64(source, fallbackUrl) {
        let candidate = source;
        if (!candidate) {
            candidate = fallbackUrl;
        }

        if (typeof candidate !== 'string' || candidate.trim() === '') {
            throw new Error('Document source is required');
        }

        const trimmed = candidate.trim();
        if (looksLikeBase64(trimmed)) {
            return trimmed.replace(DATA_URI_PREFIX, '');
        }

        if (!looksLikeUrl(trimmed)) {
            throw new Error('Document source must be a valid URL or base64 string');
        }

        if (typeof fetch !== 'function') {
            throw new Error('Global fetch is not available to download document');
        }

        const response = await fetch(trimmed);
        if (!response.ok) {
            throw new Error(`Failed to download document: ${response.status} ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer).toString('base64');
    }
}

module.exports = new OCRAPI()