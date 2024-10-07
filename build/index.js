let USER_AGENT;
if (typeof navigator === 'undefined' || !navigator.userAgent?.startsWith?.('Mozilla/5.0 ')) {
    const NAME = 'oauth4webapi';
    const VERSION = 'v3.0.0';
    USER_AGENT = `${NAME}/${VERSION}`;
}
function looseInstanceOf(input, expected) {
    if (input == null) {
        return false;
    }
    try {
        return (input instanceof expected ||
            Object.getPrototypeOf(input)[Symbol.toStringTag] === expected.prototype[Symbol.toStringTag]);
    }
    catch {
        return false;
    }
}
const ERR_INVALID_ARG_VALUE = 'ERR_INVALID_ARG_VALUE';
const ERR_INVALID_ARG_TYPE = 'ERR_INVALID_ARG_TYPE';
function CodedTypeError(message, code, cause) {
    const err = new TypeError(message, { cause });
    Object.assign(err, { code });
    return err;
}
export const allowInsecureRequests = Symbol();
export const clockSkew = Symbol();
export const clockTolerance = Symbol();
export const customFetch = Symbol();
export const modifyAssertion = Symbol();
export const jweDecrypt = Symbol();
export const jwksCache = Symbol();
const encoder = new TextEncoder();
const decoder = new TextDecoder();
function buf(input) {
    if (typeof input === 'string') {
        return encoder.encode(input);
    }
    return decoder.decode(input);
}
const CHUNK_SIZE = 0x8000;
function encodeBase64Url(input) {
    if (input instanceof ArrayBuffer) {
        input = new Uint8Array(input);
    }
    const arr = [];
    for (let i = 0; i < input.byteLength; i += CHUNK_SIZE) {
        arr.push(String.fromCharCode.apply(null, input.subarray(i, i + CHUNK_SIZE)));
    }
    return btoa(arr.join('')).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function decodeBase64Url(input) {
    try {
        const binary = atob(input.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, ''));
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }
    catch (cause) {
        throw CodedTypeError('The input to be decoded is not correctly encoded.', ERR_INVALID_ARG_VALUE, cause);
    }
}
function b64u(input) {
    if (typeof input === 'string') {
        return decodeBase64Url(input);
    }
    return encodeBase64Url(input);
}
export class UnsupportedOperationError extends Error {
    code;
    constructor(message, options) {
        super(message, options);
        this.name = this.constructor.name;
        this.code = UNSUPPORTED_OPERATION;
        Error.captureStackTrace?.(this, this.constructor);
    }
}
export class OperationProcessingError extends Error {
    code;
    constructor(message, options) {
        super(message, options);
        this.name = this.constructor.name;
        if (options?.code) {
            this.code = options?.code;
        }
        Error.captureStackTrace?.(this, this.constructor);
    }
}
function OPE(message, code, cause) {
    return new OperationProcessingError(message, { code, cause });
}
function assertCryptoKey(key, it) {
    if (!(key instanceof CryptoKey)) {
        throw CodedTypeError(`${it} must be a private CryptoKey`, ERR_INVALID_ARG_TYPE);
    }
}
function assertPrivateKey(key, it) {
    assertCryptoKey(key, it);
    if (key.type !== 'private') {
        throw CodedTypeError(`${it} must be a private CryptoKey`, ERR_INVALID_ARG_VALUE);
    }
}
function assertPublicKey(key, it) {
    assertCryptoKey(key, it);
    if (key.type !== 'public') {
        throw CodedTypeError(`${it} must be a public CryptoKey`, ERR_INVALID_ARG_VALUE);
    }
}
function normalizeTyp(value) {
    return value.toLowerCase().replace(/^application\//, '');
}
function isJsonObject(input) {
    if (input === null || typeof input !== 'object' || Array.isArray(input)) {
        return false;
    }
    return true;
}
function prepareHeaders(input) {
    if (looseInstanceOf(input, Headers)) {
        input = Object.fromEntries(input.entries());
    }
    const headers = new Headers(input);
    if (USER_AGENT && !headers.has('user-agent')) {
        headers.set('user-agent', USER_AGENT);
    }
    if (headers.has('authorization')) {
        throw CodedTypeError('"options.headers" must not include the "authorization" header name', ERR_INVALID_ARG_VALUE);
    }
    if (headers.has('dpop')) {
        throw CodedTypeError('"options.headers" must not include the "dpop" header name', ERR_INVALID_ARG_VALUE);
    }
    return headers;
}
function signal(value) {
    if (typeof value === 'function') {
        value = value();
    }
    if (!(value instanceof AbortSignal)) {
        throw CodedTypeError('"options.signal" must return or be an instance of AbortSignal', ERR_INVALID_ARG_TYPE);
    }
    return value;
}
export async function discoveryRequest(issuerIdentifier, options) {
    if (!(issuerIdentifier instanceof URL)) {
        throw CodedTypeError('"issuerIdentifier" must be an instance of URL', ERR_INVALID_ARG_TYPE);
    }
    checkProtocol(issuerIdentifier, options?.[allowInsecureRequests] !== true);
    const url = new URL(issuerIdentifier.href);
    switch (options?.algorithm) {
        case undefined:
        case 'oidc':
            url.pathname = `${url.pathname}/.well-known/openid-configuration`.replace('//', '/');
            break;
        case 'oauth2':
            if (url.pathname === '/') {
                url.pathname = '.well-known/oauth-authorization-server';
            }
            else {
                url.pathname = `.well-known/oauth-authorization-server/${url.pathname}`.replace('//', '/');
            }
            break;
        default:
            throw CodedTypeError('"options.algorithm" must be "oidc" (default), or "oauth2"', ERR_INVALID_ARG_VALUE);
    }
    const headers = prepareHeaders(options?.headers);
    headers.set('accept', 'application/json');
    return (options?.[customFetch] || fetch)(url.href, {
        body: undefined,
        headers: Object.fromEntries(headers.entries()),
        method: 'GET',
        redirect: 'manual',
        signal: options?.signal ? signal(options.signal) : undefined,
    });
}
function assertNumber(input, allow0, it, code, cause) {
    try {
        if (typeof input !== 'number' || !Number.isFinite(input)) {
            throw CodedTypeError(`${it} must be a number`, ERR_INVALID_ARG_TYPE, cause);
        }
        if (input > 0)
            return;
        if (allow0 && input !== 0) {
            throw CodedTypeError(`${it} must be a non-negative number`, ERR_INVALID_ARG_VALUE, cause);
        }
        throw CodedTypeError(`${it} must be a positive number`, ERR_INVALID_ARG_VALUE, cause);
    }
    catch (err) {
        if (code) {
            throw OPE(err.message, code, cause);
        }
        throw err;
    }
}
function assertString(input, it, code, cause) {
    try {
        if (typeof input !== 'string') {
            throw CodedTypeError(`${it} must be a string`, ERR_INVALID_ARG_TYPE, cause);
        }
        if (input.length === 0) {
            throw CodedTypeError(`${it} must not be empty`, ERR_INVALID_ARG_VALUE, cause);
        }
    }
    catch (err) {
        if (code) {
            throw OPE(err.message, code, cause);
        }
        throw err;
    }
}
export async function processDiscoveryResponse(expectedIssuerIdentifier, response) {
    if (!(expectedIssuerIdentifier instanceof URL) &&
        expectedIssuerIdentifier !== _nodiscoverycheck) {
        throw CodedTypeError('"expectedIssuer" must be an instance of URL', ERR_INVALID_ARG_TYPE);
    }
    if (!looseInstanceOf(response, Response)) {
        throw CodedTypeError('"response" must be an instance of Response', ERR_INVALID_ARG_TYPE);
    }
    if (response.status !== 200) {
        throw OPE('"response" is not a conform Authorization Server Metadata response', RESPONSE_IS_NOT_CONFORM, response);
    }
    assertReadableResponse(response);
    assertApplicationJson(response);
    let json;
    try {
        json = await response.json();
    }
    catch (cause) {
        throw OPE('failed to parse "response" body as JSON', PARSE_ERROR, cause);
    }
    if (!isJsonObject(json)) {
        throw OPE('"response" body must be a top level object', INVALID_RESPONSE, { body: json });
    }
    assertString(json.issuer, '"response" body "issuer" property', INVALID_RESPONSE, { body: json });
    if (new URL(json.issuer).href !== expectedIssuerIdentifier.href &&
        expectedIssuerIdentifier !== _nodiscoverycheck) {
        throw OPE('"response" body "issuer" property does not match the expected value', JSON_ATTRIBUTE_COMPARISON, { expected: expectedIssuerIdentifier.href, body: json, attribute: 'issuer' });
    }
    return json;
}
function assertApplicationJson(response) {
    assertContentType(response, 'application/json');
}
function notJson(response, ...types) {
    let msg = '"response" content-type must be ';
    if (types.length > 2) {
        const last = types.pop();
        msg += `${types.join(', ')}, or ${last}`;
    }
    else if (types.length === 2) {
        msg += `${types[0]} or ${types[1]}`;
    }
    else {
        msg += types[0];
    }
    return OPE(msg, RESPONSE_IS_NOT_JSON, response);
}
function assertContentTypes(response, ...types) {
    if (!types.includes(getContentType(response))) {
        throw notJson(response, ...types);
    }
}
function assertContentType(response, contentType) {
    if (getContentType(response) !== contentType) {
        throw notJson(response, contentType);
    }
}
function randomBytes() {
    return b64u(crypto.getRandomValues(new Uint8Array(32)));
}
export function generateRandomCodeVerifier() {
    return randomBytes();
}
export function generateRandomState() {
    return randomBytes();
}
export function generateRandomNonce() {
    return randomBytes();
}
export async function calculatePKCECodeChallenge(codeVerifier) {
    assertString(codeVerifier, 'codeVerifier');
    return b64u(await crypto.subtle.digest('SHA-256', buf(codeVerifier)));
}
function getKeyAndKid(input) {
    if (input instanceof CryptoKey) {
        return { key: input };
    }
    if (!(input?.key instanceof CryptoKey)) {
        return {};
    }
    if (input.kid !== undefined) {
        assertString(input.kid, '"kid"');
    }
    return {
        key: input.key,
        kid: input.kid,
    };
}
function psAlg(key) {
    switch (key.algorithm.hash.name) {
        case 'SHA-256':
            return 'PS256';
        case 'SHA-384':
            return 'PS384';
        case 'SHA-512':
            return 'PS512';
        default:
            throw new UnsupportedOperationError('unsupported RsaHashedKeyAlgorithm hash name', {
                cause: key,
            });
    }
}
function rsAlg(key) {
    switch (key.algorithm.hash.name) {
        case 'SHA-256':
            return 'RS256';
        case 'SHA-384':
            return 'RS384';
        case 'SHA-512':
            return 'RS512';
        default:
            throw new UnsupportedOperationError('unsupported RsaHashedKeyAlgorithm hash name', {
                cause: key,
            });
    }
}
function esAlg(key) {
    switch (key.algorithm.namedCurve) {
        case 'P-256':
            return 'ES256';
        case 'P-384':
            return 'ES384';
        case 'P-521':
            return 'ES512';
        default:
            throw new UnsupportedOperationError('unsupported EcKeyAlgorithm namedCurve', { cause: key });
    }
}
function keyToJws(key) {
    switch (key.algorithm.name) {
        case 'RSA-PSS':
            return psAlg(key);
        case 'RSASSA-PKCS1-v1_5':
            return rsAlg(key);
        case 'ECDSA':
            return esAlg(key);
        case 'Ed25519':
        case 'EdDSA':
            return 'Ed25519';
        default:
            throw new UnsupportedOperationError('unsupported CryptoKey algorithm name', { cause: key });
    }
}
function getClockSkew(client) {
    const skew = client?.[clockSkew];
    return typeof skew === 'number' && Number.isFinite(skew) ? skew : 0;
}
function getClockTolerance(client) {
    const tolerance = client?.[clockTolerance];
    return typeof tolerance === 'number' && Number.isFinite(tolerance) && Math.sign(tolerance) !== -1
        ? tolerance
        : 30;
}
function epochTime() {
    return Math.floor(Date.now() / 1000);
}
function assertAs(as) {
    if (typeof as !== 'object' || as === null) {
        throw CodedTypeError('"as" must be an object', ERR_INVALID_ARG_TYPE);
    }
    assertString(as.issuer, '"as.issuer"');
}
function assertClient(client) {
    if (typeof client !== 'object' || client === null) {
        throw CodedTypeError('"client" must be an object', ERR_INVALID_ARG_TYPE);
    }
    assertString(client.client_id, '"client.client_id"');
}
function formUrlEncode(token) {
    return encodeURIComponent(token).replace(/(?:[-_.!~*'()]|%20)/g, (substring) => {
        switch (substring) {
            case '-':
            case '_':
            case '.':
            case '!':
            case '~':
            case '*':
            case "'":
            case '(':
            case ')':
                return `%${substring.charCodeAt(0).toString(16).toUpperCase()}`;
            case '%20':
                return '+';
            default:
                throw new Error();
        }
    });
}
export function ClientSecretPost(clientSecret) {
    assertString(clientSecret, '"clientSecret"');
    return (_as, client, body, _headers) => {
        body.set('client_id', client.client_id);
        body.set('client_secret', clientSecret);
    };
}
export function ClientSecretBasic(clientSecret) {
    assertString(clientSecret, '"clientSecret"');
    return (_as, client, _body, headers) => {
        const username = formUrlEncode(client.client_id);
        const password = formUrlEncode(clientSecret);
        const credentials = btoa(`${username}:${password}`);
        headers.set('authorization', `Basic ${credentials}`);
    };
}
function clientAssertionPayload(as, client) {
    const now = epochTime() + getClockSkew(client);
    return {
        jti: randomBytes(),
        aud: as.issuer,
        exp: now + 60,
        iat: now,
        nbf: now,
        iss: client.client_id,
        sub: client.client_id,
    };
}
export function PrivateKeyJwt(clientPrivateKey, options) {
    const { key, kid } = getKeyAndKid(clientPrivateKey);
    assertPrivateKey(key, '"clientPrivateKey.key"');
    return async (as, client, body, _headers) => {
        const header = { alg: keyToJws(key), kid };
        const payload = clientAssertionPayload(as, client);
        options?.[modifyAssertion]?.(header, payload);
        body.set('client_id', client.client_id);
        body.set('client_assertion_type', 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
        body.set('client_assertion', await signJwt(header, payload, key));
    };
}
export function ClientSecretJwt(clientSecret, options) {
    assertString(clientSecret, '"clientSecret"');
    const modify = options?.[modifyAssertion];
    let key;
    return async (as, client, body, _headers) => {
        key ||= await crypto.subtle.importKey('raw', buf(clientSecret), { hash: 'SHA-256', name: 'HMAC' }, false, ['sign']);
        const header = { alg: 'HS256' };
        const payload = clientAssertionPayload(as, client);
        modify?.(header, payload);
        const data = `${b64u(buf(JSON.stringify(header)))}.${b64u(buf(JSON.stringify(payload)))}`;
        const hmac = await crypto.subtle.sign(key.algorithm, key, buf(data));
        body.set('client_id', client.client_id);
        body.set('client_assertion_type', 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
        body.set('client_assertion', `${data}.${b64u(new Uint8Array(hmac))}`);
    };
}
export function None() {
    return (_as, client, body, _headers) => {
        body.set('client_id', client.client_id);
    };
}
export function TlsClientAuth() {
    return None();
}
async function signJwt(header, payload, key) {
    if (!key.usages.includes('sign')) {
        throw CodedTypeError('CryptoKey instances used for signing assertions must include "sign" in their "usages"', ERR_INVALID_ARG_VALUE);
    }
    const input = `${b64u(buf(JSON.stringify(header)))}.${b64u(buf(JSON.stringify(payload)))}`;
    const signature = b64u(await crypto.subtle.sign(keyToSubtle(key), key, buf(input)));
    return `${input}.${signature}`;
}
export async function issueRequestObject(as, client, parameters, privateKey, options) {
    assertAs(as);
    assertClient(client);
    parameters = new URLSearchParams(parameters);
    const { key, kid } = getKeyAndKid(privateKey);
    assertPrivateKey(key, '"privateKey.key"');
    parameters.set('client_id', client.client_id);
    const now = epochTime() + getClockSkew(client);
    const claims = {
        ...Object.fromEntries(parameters.entries()),
        jti: randomBytes(),
        aud: as.issuer,
        exp: now + 60,
        iat: now,
        nbf: now,
        iss: client.client_id,
    };
    let resource;
    if (parameters.has('resource') &&
        (resource = parameters.getAll('resource')) &&
        resource.length > 1) {
        claims.resource = resource;
    }
    {
        let value = parameters.get('max_age');
        if (value !== null) {
            claims.max_age = parseInt(value, 10);
            assertNumber(claims.max_age, true, '"max_age" parameter');
        }
    }
    {
        let value = parameters.get('claims');
        if (value !== null) {
            try {
                claims.claims = JSON.parse(value);
            }
            catch (cause) {
                throw OPE('failed to parse the "claims" parameter as JSON', PARSE_ERROR, cause);
            }
            if (!isJsonObject(claims.claims)) {
                throw CodedTypeError('"claims" parameter must be a JSON with a top level object', ERR_INVALID_ARG_VALUE);
            }
        }
    }
    {
        let value = parameters.get('authorization_details');
        if (value !== null) {
            try {
                claims.authorization_details = JSON.parse(value);
            }
            catch (cause) {
                throw OPE('failed to parse the "authorization_details" parameter as JSON', PARSE_ERROR, cause);
            }
            if (!Array.isArray(claims.authorization_details)) {
                throw CodedTypeError('"authorization_details" parameter must be a JSON with a top level array', ERR_INVALID_ARG_VALUE);
            }
        }
    }
    const header = {
        alg: keyToJws(key),
        typ: 'oauth-authz-req+jwt',
        kid,
    };
    options?.[modifyAssertion]?.(header, claims);
    return signJwt(header, claims, key);
}
let jwkCache;
async function getSetPublicJwkCache(key) {
    const { kty, e, n, x, y, crv } = await crypto.subtle.exportKey('jwk', key);
    const jwk = { kty, e, n, x, y, crv };
    jwkCache.set(key, jwk);
    return jwk;
}
async function publicJwk(key) {
    jwkCache ||= new WeakMap();
    return jwkCache.get(key) || getSetPublicJwkCache(key);
}
const URLParse = URL.parse
    ?
        (url, base) => URL.parse(url, base)
    : (url, base) => {
        try {
            return new URL(url, base);
        }
        catch {
            return null;
        }
    };
export function checkProtocol(url, enforceHttps) {
    if (enforceHttps && url.protocol !== 'https:') {
        throw OPE('only requests to HTTPS are allowed', HTTP_REQUEST_FORBIDDEN, url);
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        throw OPE('only HTTP and HTTPS requests are allowed', REQUEST_PROTOCOL_FORBIDDEN, url);
    }
}
function validateEndpoint(value, endpoint, useMtlsAlias, enforceHttps) {
    let url;
    if (typeof value !== 'string' || !(url = URLParse(value))) {
        throw OPE(`authorization server metadata does not contain a valid ${useMtlsAlias ? `"as.mtls_endpoint_aliases.${endpoint}"` : `"as.${endpoint}"`}`, value === undefined ? MISSING_SERVER_METADATA : INVALID_SERVER_METADATA, { attribute: useMtlsAlias ? `mtls_endpoint_aliases.${endpoint}` : endpoint });
    }
    checkProtocol(url, enforceHttps);
    return url;
}
export function resolveEndpoint(as, endpoint, useMtlsAlias, enforceHttps) {
    if (useMtlsAlias && as.mtls_endpoint_aliases && endpoint in as.mtls_endpoint_aliases) {
        return validateEndpoint(as.mtls_endpoint_aliases[endpoint], endpoint, useMtlsAlias, enforceHttps);
    }
    return validateEndpoint(as[endpoint], endpoint, useMtlsAlias, enforceHttps);
}
export async function pushedAuthorizationRequest(as, client, clientAuthentication, parameters, options) {
    assertAs(as);
    assertClient(client);
    const url = resolveEndpoint(as, 'pushed_authorization_request_endpoint', client.use_mtls_endpoint_aliases, options?.[allowInsecureRequests] !== true);
    const body = new URLSearchParams(parameters);
    body.set('client_id', client.client_id);
    const headers = prepareHeaders(options?.headers);
    headers.set('accept', 'application/json');
    if (options?.DPoP !== undefined) {
        assertDPoP(options.DPoP);
        await options.DPoP.addProof(url, headers, 'POST');
    }
    const response = await authenticatedRequest(as, client, clientAuthentication, url, body, headers, options);
    options?.DPoP?.cacheNonce(response);
    return response;
}
class DPoPHandler {
    #header;
    #privateKey;
    #publicKey;
    #clockSkew;
    #modifyAssertion;
    #map;
    constructor(client, keyPair, options) {
        assertPrivateKey(keyPair?.privateKey, '"DPoP.privateKey"');
        assertPublicKey(keyPair?.publicKey, '"DPoP.publicKey"');
        if (!keyPair.publicKey.extractable) {
            throw CodedTypeError('"DPoP.publicKey.extractable" must be true', ERR_INVALID_ARG_VALUE);
        }
        this.#modifyAssertion = options?.[modifyAssertion];
        this.#clockSkew = getClockSkew(client);
        this.#privateKey = keyPair.privateKey;
        this.#publicKey = keyPair.publicKey;
        branded.add(this);
    }
    #get(key) {
        this.#map ||= new Map();
        let item = this.#map.get(key);
        if (item) {
            this.#map.delete(key);
            this.#map.set(key, item);
        }
        return item;
    }
    #set(key, val) {
        this.#map ||= new Map();
        this.#map.delete(key);
        if (this.#map.size === 100) {
            this.#map.delete(this.#map.keys().next().value);
        }
        this.#map.set(key, val);
    }
    async addProof(url, headers, htm, accessToken) {
        this.#header ||= {
            alg: keyToJws(this.#privateKey),
            typ: 'dpop+jwt',
            jwk: await publicJwk(this.#publicKey),
        };
        const nonce = this.#get(url.origin);
        const now = epochTime() + this.#clockSkew;
        const payload = {
            iat: now,
            jti: randomBytes(),
            htm,
            nonce,
            htu: `${url.origin}${url.pathname}`,
            ath: accessToken ? b64u(await crypto.subtle.digest('SHA-256', buf(accessToken))) : undefined,
        };
        this.#modifyAssertion?.(this.#header, payload);
        headers.set('dpop', await signJwt(this.#header, payload, this.#privateKey));
    }
    cacheNonce(response) {
        try {
            const nonce = response.headers.get('dpop-nonce');
            if (nonce) {
                this.#set(new URL(response.url).origin, nonce);
            }
        }
        catch { }
    }
}
export function isDPoPNonceError(err) {
    if (err instanceof WWWAuthenticateChallengeError) {
        const { 0: challenge, length } = err.cause;
        return (length === 1 && challenge.scheme === 'dpop' && challenge.parameters.error === 'use_dpop_nonce');
    }
    if (err instanceof ResponseBodyError) {
        return err.error === 'use_dpop_nonce';
    }
    return false;
}
export function DPoP(client, keyPair, options) {
    return new DPoPHandler(client, keyPair, options);
}
export class ResponseBodyError extends Error {
    cause;
    code;
    error;
    status;
    error_description;
    response;
    constructor(message, options) {
        super(message, options);
        this.name = this.constructor.name;
        this.code = RESPONSE_BODY_ERROR;
        this.cause = options.cause;
        this.error = options.cause.error;
        this.status = options.response.status;
        this.error_description = options.cause.error_description;
        Object.defineProperty(this, 'response', { enumerable: false, value: options.response });
        Error.captureStackTrace?.(this, this.constructor);
    }
}
export class AuthorizationResponseError extends Error {
    cause;
    code;
    error;
    error_description;
    constructor(message, options) {
        super(message, options);
        this.name = this.constructor.name;
        this.code = AUTHORIZATION_RESPONSE_ERROR;
        this.cause = options.cause;
        this.error = options.cause.get('error');
        this.error_description = options.cause.get('error_description') ?? undefined;
        Error.captureStackTrace?.(this, this.constructor);
    }
}
export class WWWAuthenticateChallengeError extends Error {
    cause;
    code;
    response;
    status;
    constructor(message, options) {
        super(message, options);
        this.name = this.constructor.name;
        this.code = WWW_AUTHENTICATE_CHALLENGE;
        this.cause = options.cause;
        this.status = options.response.status;
        this.response = options.response;
        Object.defineProperty(this, 'response', { enumerable: false });
        Error.captureStackTrace?.(this, this.constructor);
    }
}
function unquote(value) {
    if (value.length >= 2 && value[0] === '"' && value[value.length - 1] === '"') {
        return value.slice(1, -1);
    }
    return value;
}
const SPLIT_REGEXP = /((?:,|, )?[0-9a-zA-Z!#$%&'*+-.^_`|~]+=)/;
const SCHEMES_REGEXP = /(?:^|, ?)([0-9a-zA-Z!#$%&'*+\-.^_`|~]+)(?=$|[ ,])/g;
function wwwAuth(scheme, params) {
    const arr = params.split(SPLIT_REGEXP).slice(1);
    if (!arr.length) {
        return { scheme: scheme.toLowerCase(), parameters: {} };
    }
    arr[arr.length - 1] = arr[arr.length - 1].replace(/,$/, '');
    const parameters = {};
    for (let i = 1; i < arr.length; i += 2) {
        const idx = i;
        if (arr[idx][0] === '"') {
            while (arr[idx].slice(-1) !== '"' && ++i < arr.length) {
                arr[idx] += arr[i];
            }
        }
        const key = arr[idx - 1].replace(/^(?:, ?)|=$/g, '').toLowerCase();
        parameters[key] = unquote(arr[idx]);
    }
    return {
        scheme: scheme.toLowerCase(),
        parameters,
    };
}
function parseWwwAuthenticateChallenges(response) {
    if (!looseInstanceOf(response, Response)) {
        throw CodedTypeError('"response" must be an instance of Response', ERR_INVALID_ARG_TYPE);
    }
    const header = response.headers.get('www-authenticate');
    if (header === null) {
        return undefined;
    }
    const result = [];
    for (const { 1: scheme, index } of header.matchAll(SCHEMES_REGEXP)) {
        result.push([scheme, index]);
    }
    if (!result.length) {
        return undefined;
    }
    const challenges = result.map(([scheme, indexOf], i, others) => {
        const next = others[i + 1];
        let parameters;
        if (next) {
            parameters = header.slice(indexOf, next[1]);
        }
        else {
            parameters = header.slice(indexOf);
        }
        return wwwAuth(scheme, parameters);
    });
    return challenges;
}
export async function processPushedAuthorizationResponse(as, client, response) {
    assertAs(as);
    assertClient(client);
    if (!looseInstanceOf(response, Response)) {
        throw CodedTypeError('"response" must be an instance of Response', ERR_INVALID_ARG_TYPE);
    }
    let challenges;
    if ((challenges = parseWwwAuthenticateChallenges(response))) {
        throw new WWWAuthenticateChallengeError('server responded with a challenge in the WWW-Authenticate HTTP Header', { cause: challenges, response });
    }
    if (response.status !== 201) {
        let err;
        if ((err = await handleOAuthBodyError(response))) {
            await response.body?.cancel();
            throw new ResponseBodyError('server responded with an error in the response body', {
                cause: err,
                response,
            });
        }
        throw OPE('"response" is not a conform Pushed Authorization Request Endpoint response', RESPONSE_IS_NOT_CONFORM, response);
    }
    assertReadableResponse(response);
    assertApplicationJson(response);
    let json;
    try {
        json = await response.json();
    }
    catch (cause) {
        throw OPE('failed to parse "response" body as JSON', PARSE_ERROR, cause);
    }
    if (!isJsonObject(json)) {
        throw OPE('"response" body must be a top level object', INVALID_RESPONSE, { body: json });
    }
    assertString(json.request_uri, '"response" body "request_uri" property', INVALID_RESPONSE, {
        body: json,
    });
    assertNumber(json.expires_in, false, '"response" body "expires_in" property', INVALID_RESPONSE, {
        body: json,
    });
    return json;
}
function assertDPoP(option) {
    if (!branded.has(option)) {
        throw CodedTypeError('"options.DPoP" is not a valid DPoPHandle', ERR_INVALID_ARG_VALUE);
    }
}
async function resourceRequest(accessToken, method, url, headers, body, options) {
    assertString(accessToken, '"accessToken"');
    if (!(url instanceof URL)) {
        throw CodedTypeError('"url" must be an instance of URL', ERR_INVALID_ARG_TYPE);
    }
    checkProtocol(url, options?.[allowInsecureRequests] !== true);
    headers = prepareHeaders(headers);
    if (options?.DPoP) {
        assertDPoP(options.DPoP);
        await options.DPoP.addProof(url, headers, method.toUpperCase(), accessToken);
        headers.set('authorization', `DPoP ${accessToken}`);
    }
    else {
        headers.set('authorization', `Bearer ${accessToken}`);
    }
    const response = await (options?.[customFetch] || fetch)(url.href, {
        body,
        headers: Object.fromEntries(headers.entries()),
        method,
        redirect: 'manual',
        signal: options?.signal ? signal(options.signal) : undefined,
    });
    options?.DPoP?.cacheNonce(response);
    return response;
}
export async function protectedResourceRequest(accessToken, method, url, headers, body, options) {
    return resourceRequest(accessToken, method, url, headers, body, options).then((response) => {
        let challenges;
        if ((challenges = parseWwwAuthenticateChallenges(response))) {
            throw new WWWAuthenticateChallengeError('server responded with a challenge in the WWW-Authenticate HTTP Header', { cause: challenges, response });
        }
        return response;
    });
}
export async function userInfoRequest(as, client, accessToken, options) {
    assertAs(as);
    assertClient(client);
    const url = resolveEndpoint(as, 'userinfo_endpoint', client.use_mtls_endpoint_aliases, options?.[allowInsecureRequests] !== true);
    const headers = prepareHeaders(options?.headers);
    if (client.userinfo_signed_response_alg) {
        headers.set('accept', 'application/jwt');
    }
    else {
        headers.set('accept', 'application/json');
        headers.append('accept', 'application/jwt');
    }
    return resourceRequest(accessToken, 'GET', url, headers, null, {
        ...options,
        [clockSkew]: getClockSkew(client),
    });
}
let jwksMap;
function setJwksCache(as, jwks, uat, cache) {
    jwksMap ||= new WeakMap();
    jwksMap.set(as, {
        jwks,
        uat,
        get age() {
            return epochTime() - this.uat;
        },
    });
    if (cache) {
        Object.assign(cache, { jwks: structuredClone(jwks), uat });
    }
}
function isFreshJwksCache(input) {
    if (typeof input !== 'object' || input === null) {
        return false;
    }
    if (!('uat' in input) || typeof input.uat !== 'number' || epochTime() - input.uat >= 300) {
        return false;
    }
    if (!('jwks' in input) ||
        !isJsonObject(input.jwks) ||
        !Array.isArray(input.jwks.keys) ||
        !Array.prototype.every.call(input.jwks.keys, isJsonObject)) {
        return false;
    }
    return true;
}
function clearJwksCache(as, cache) {
    jwksMap?.delete(as);
    delete cache?.jwks;
    delete cache?.uat;
}
async function getPublicSigKeyFromIssuerJwksUri(as, options, header) {
    const { alg, kid } = header;
    checkSupportedJwsAlg(header);
    if (!jwksMap?.has(as) && isFreshJwksCache(options?.[jwksCache])) {
        setJwksCache(as, options?.[jwksCache].jwks, options?.[jwksCache].uat);
    }
    let jwks;
    let age;
    if (jwksMap?.has(as)) {
        ;
        ({ jwks, age } = jwksMap.get(as));
        if (age >= 300) {
            clearJwksCache(as, options?.[jwksCache]);
            return getPublicSigKeyFromIssuerJwksUri(as, options, header);
        }
    }
    else {
        jwks = await jwksRequest(as, options).then(processJwksResponse);
        age = 0;
        setJwksCache(as, jwks, epochTime(), options?.[jwksCache]);
    }
    let kty;
    switch (alg.slice(0, 2)) {
        case 'RS':
        case 'PS':
            kty = 'RSA';
            break;
        case 'ES':
            kty = 'EC';
            break;
        case 'Ed':
            kty = 'OKP';
            break;
        default:
            throw new UnsupportedOperationError('unsupported JWS algorithm', { cause: { alg } });
    }
    const candidates = jwks.keys.filter((jwk) => {
        if (jwk.kty !== kty) {
            return false;
        }
        if (kid !== undefined && kid !== jwk.kid) {
            return false;
        }
        if (jwk.alg !== undefined && alg !== jwk.alg) {
            return false;
        }
        if (jwk.use !== undefined && jwk.use !== 'sig') {
            return false;
        }
        if (jwk.key_ops?.includes('verify') === false) {
            return false;
        }
        switch (true) {
            case alg === 'ES256' && jwk.crv !== 'P-256':
            case alg === 'ES384' && jwk.crv !== 'P-384':
            case alg === 'ES512' && jwk.crv !== 'P-521':
            case alg === 'Ed25519' && jwk.crv !== 'Ed25519':
            case alg === 'EdDSA' && jwk.crv !== 'Ed25519':
                return false;
        }
        return true;
    });
    const { 0: jwk, length } = candidates;
    if (!length) {
        if (age >= 60) {
            clearJwksCache(as, options?.[jwksCache]);
            return getPublicSigKeyFromIssuerJwksUri(as, options, header);
        }
        throw OPE('error when selecting a JWT verification key, no applicable keys found', KEY_SELECTION, { header, candidates, jwks_uri: new URL(as.jwks_uri) });
    }
    if (length !== 1) {
        throw OPE('error when selecting a JWT verification key, multiple applicable keys found, a "kid" JWT Header Parameter is required', KEY_SELECTION, { header, candidates, jwks_uri: new URL(as.jwks_uri) });
    }
    return importJwk(alg, jwk);
}
export const skipSubjectCheck = Symbol();
function getContentType(response) {
    return response.headers.get('content-type')?.split(';')[0];
}
export async function processUserInfoResponse(as, client, expectedSubject, response, options) {
    assertAs(as);
    assertClient(client);
    if (!looseInstanceOf(response, Response)) {
        throw CodedTypeError('"response" must be an instance of Response', ERR_INVALID_ARG_TYPE);
    }
    let challenges;
    if ((challenges = parseWwwAuthenticateChallenges(response))) {
        throw new WWWAuthenticateChallengeError('server responded with a challenge in the WWW-Authenticate HTTP Header', { cause: challenges, response });
    }
    if (response.status !== 200) {
        throw OPE('"response" is not a conform UserInfo Endpoint response', RESPONSE_IS_NOT_CONFORM, response);
    }
    assertReadableResponse(response);
    let json;
    if (getContentType(response) === 'application/jwt') {
        const { claims, jwt } = await validateJwt(await response.text(), checkSigningAlgorithm.bind(undefined, client.userinfo_signed_response_alg, as.userinfo_signing_alg_values_supported, undefined), getClockSkew(client), getClockTolerance(client), options?.[jweDecrypt])
            .then(validateOptionalAudience.bind(undefined, client.client_id))
            .then(validateOptionalIssuer.bind(undefined, as));
        jwtRefs.set(response, jwt);
        json = claims;
    }
    else {
        if (client.userinfo_signed_response_alg) {
            throw OPE('JWT UserInfo Response expected', JWT_USERINFO_EXPECTED, response);
        }
        assertApplicationJson(response);
        try {
            json = await response.json();
        }
        catch (cause) {
            throw OPE('failed to parse "response" body as JSON', PARSE_ERROR, cause);
        }
    }
    if (!isJsonObject(json)) {
        throw OPE('"response" body must be a top level object', INVALID_RESPONSE, { body: json });
    }
    assertString(json.sub, '"response" body "sub" property', INVALID_RESPONSE, { body: json });
    switch (expectedSubject) {
        case skipSubjectCheck:
            break;
        default:
            assertString(expectedSubject, '"expectedSubject"');
            if (json.sub !== expectedSubject) {
                throw OPE('unexpected "response" body "sub" property value', JSON_ATTRIBUTE_COMPARISON, {
                    expected: expectedSubject,
                    body: json,
                    attribute: 'sub',
                });
            }
    }
    return json;
}
async function authenticatedRequest(as, client, clientAuthentication, url, body, headers, options) {
    await clientAuthentication(as, client, body, headers);
    headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
    return (options?.[customFetch] || fetch)(url.href, {
        body,
        headers: Object.fromEntries(headers.entries()),
        method: 'POST',
        redirect: 'manual',
        signal: options?.signal ? signal(options.signal) : undefined,
    });
}
async function tokenEndpointRequest(as, client, clientAuthentication, grantType, parameters, options) {
    const url = resolveEndpoint(as, 'token_endpoint', client.use_mtls_endpoint_aliases, options?.[allowInsecureRequests] !== true);
    parameters.set('grant_type', grantType);
    const headers = prepareHeaders(options?.headers);
    headers.set('accept', 'application/json');
    if (options?.DPoP !== undefined) {
        assertDPoP(options.DPoP);
        await options.DPoP.addProof(url, headers, 'POST');
    }
    const response = await authenticatedRequest(as, client, clientAuthentication, url, parameters, headers, options);
    options?.DPoP?.cacheNonce(response);
    return response;
}
export async function refreshTokenGrantRequest(as, client, clientAuthentication, refreshToken, options) {
    assertAs(as);
    assertClient(client);
    assertString(refreshToken, '"refreshToken"');
    const parameters = new URLSearchParams(options?.additionalParameters);
    parameters.set('refresh_token', refreshToken);
    return tokenEndpointRequest(as, client, clientAuthentication, 'refresh_token', parameters, options);
}
const idTokenClaims = new WeakMap();
const jwtRefs = new WeakMap();
export function getValidatedIdTokenClaims(ref) {
    if (!ref.id_token) {
        return undefined;
    }
    const claims = idTokenClaims.get(ref);
    if (!claims) {
        throw CodedTypeError('"ref" was already garbage collected or did not resolve from the proper sources', ERR_INVALID_ARG_VALUE);
    }
    return claims;
}
export async function validateApplicationLevelSignature(as, ref, options) {
    assertAs(as);
    if (!jwtRefs.has(ref)) {
        throw CodedTypeError('"ref" does not contain a processed JWT Response to verify the signature of', ERR_INVALID_ARG_VALUE);
    }
    const { 0: protectedHeader, 1: payload, 2: encodedSignature } = jwtRefs.get(ref).split('.');
    const header = JSON.parse(buf(b64u(protectedHeader)));
    if (header.alg.startsWith('HS')) {
        throw new UnsupportedOperationError('unsupported JWS algorithm', { cause: { alg: header.alg } });
    }
    let key;
    key = await getPublicSigKeyFromIssuerJwksUri(as, options, header);
    await validateJwsSignature(protectedHeader, payload, key, b64u(encodedSignature));
}
async function processGenericAccessTokenResponse(as, client, response, additionalRequiredIdTokenClaims, options) {
    assertAs(as);
    assertClient(client);
    if (!looseInstanceOf(response, Response)) {
        throw CodedTypeError('"response" must be an instance of Response', ERR_INVALID_ARG_TYPE);
    }
    let challenges;
    if ((challenges = parseWwwAuthenticateChallenges(response))) {
        throw new WWWAuthenticateChallengeError('server responded with a challenge in the WWW-Authenticate HTTP Header', { cause: challenges, response });
    }
    if (response.status !== 200) {
        let err;
        if ((err = await handleOAuthBodyError(response))) {
            await response.body?.cancel();
            throw new ResponseBodyError('server responded with an error in the response body', {
                cause: err,
                response,
            });
        }
        throw OPE('"response" is not a conform Token Endpoint response', RESPONSE_IS_NOT_CONFORM, response);
    }
    assertReadableResponse(response);
    assertApplicationJson(response);
    let json;
    try {
        json = await response.json();
    }
    catch (cause) {
        throw OPE('failed to parse "response" body as JSON', PARSE_ERROR, cause);
    }
    if (!isJsonObject(json)) {
        throw OPE('"response" body must be a top level object', INVALID_RESPONSE, { body: json });
    }
    assertString(json.access_token, '"response" body "access_token" property', INVALID_RESPONSE, {
        body: json,
    });
    assertString(json.token_type, '"response" body "token_type" property', INVALID_RESPONSE, {
        body: json,
    });
    json.token_type = json.token_type.toLowerCase();
    if (json.token_type !== 'dpop' && json.token_type !== 'bearer') {
        throw new UnsupportedOperationError('unsupported `token_type` value', { cause: { body: json } });
    }
    if (json.expires_in !== undefined) {
        assertNumber(json.expires_in, false, '"response" body "expires_in" property', INVALID_RESPONSE, { body: json });
    }
    if (json.refresh_token !== undefined) {
        assertString(json.refresh_token, '"response" body "refresh_token" property', INVALID_RESPONSE, {
            body: json,
        });
    }
    if (json.scope !== undefined && typeof json.scope !== 'string') {
        throw OPE('"response" body "scope" property must be a string', INVALID_RESPONSE, { body: json });
    }
    if (json.id_token !== undefined) {
        assertString(json.id_token, '"response" body "id_token" property', INVALID_RESPONSE, {
            body: json,
        });
        const requiredClaims = ['aud', 'exp', 'iat', 'iss', 'sub'];
        if (client.require_auth_time === true) {
            requiredClaims.push('auth_time');
        }
        if (client.default_max_age !== undefined) {
            assertNumber(client.default_max_age, false, '"client.default_max_age"');
            requiredClaims.push('auth_time');
        }
        if (additionalRequiredIdTokenClaims?.length) {
            requiredClaims.push(...additionalRequiredIdTokenClaims);
        }
        const { claims, jwt } = await validateJwt(json.id_token, checkSigningAlgorithm.bind(undefined, client.id_token_signed_response_alg, as.id_token_signing_alg_values_supported, 'RS256'), getClockSkew(client), getClockTolerance(client), options?.[jweDecrypt])
            .then(validatePresence.bind(undefined, requiredClaims))
            .then(validateIssuer.bind(undefined, as))
            .then(validateAudience.bind(undefined, client.client_id));
        if (Array.isArray(claims.aud) && claims.aud.length !== 1) {
            if (claims.azp === undefined) {
                throw OPE('ID Token "aud" (audience) claim includes additional untrusted audiences', JWT_CLAIM_COMPARISON, { claims, claim: 'aud' });
            }
            if (claims.azp !== client.client_id) {
                throw OPE('unexpected ID Token "azp" (authorized party) claim value', JWT_CLAIM_COMPARISON, { expected: client.client_id, claims, claim: 'azp' });
            }
        }
        if (claims.auth_time !== undefined) {
            assertNumber(claims.auth_time, false, 'ID Token "auth_time" (authentication time)', INVALID_RESPONSE, { claims });
        }
        jwtRefs.set(response, jwt);
        idTokenClaims.set(json, claims);
    }
    return json;
}
export async function processRefreshTokenResponse(as, client, response, options) {
    return processGenericAccessTokenResponse(as, client, response, undefined, options);
}
function validateOptionalAudience(expected, result) {
    if (result.claims.aud !== undefined) {
        return validateAudience(expected, result);
    }
    return result;
}
function validateAudience(expected, result) {
    if (Array.isArray(result.claims.aud)) {
        if (!result.claims.aud.includes(expected)) {
            throw OPE('unexpected JWT "aud" (audience) claim value', JWT_CLAIM_COMPARISON, {
                expected,
                claims: result.claims,
                claim: 'aud',
            });
        }
    }
    else if (result.claims.aud !== expected) {
        throw OPE('unexpected JWT "aud" (audience) claim value', JWT_CLAIM_COMPARISON, {
            expected,
            claims: result.claims,
            claim: 'aud',
        });
    }
    return result;
}
function validateOptionalIssuer(as, result) {
    if (result.claims.iss !== undefined) {
        return validateIssuer(as, result);
    }
    return result;
}
function validateIssuer(as, result) {
    const expected = as[_expectedIssuer]?.(result) ?? as.issuer;
    if (result.claims.iss !== expected) {
        throw OPE('unexpected JWT "iss" (issuer) claim value', JWT_CLAIM_COMPARISON, {
            expected,
            claims: result.claims,
            claim: 'iss',
        });
    }
    return result;
}
const branded = new WeakSet();
function brand(searchParams) {
    branded.add(searchParams);
    return searchParams;
}
export async function authorizationCodeGrantRequest(as, client, clientAuthentication, callbackParameters, redirectUri, codeVerifier, options) {
    assertAs(as);
    assertClient(client);
    if (!branded.has(callbackParameters)) {
        throw CodedTypeError('"callbackParameters" must be an instance of URLSearchParams obtained from "validateAuthResponse()", or "validateJwtAuthResponse()', ERR_INVALID_ARG_VALUE);
    }
    assertString(redirectUri, '"redirectUri"');
    const code = getURLSearchParameter(callbackParameters, 'code');
    if (!code) {
        throw OPE('no authorization code in "callbackParameters"', INVALID_RESPONSE);
    }
    const parameters = new URLSearchParams(options?.additionalParameters);
    parameters.set('redirect_uri', redirectUri);
    parameters.set('code', code);
    if (codeVerifier !== _nopkce) {
        assertString(codeVerifier, '"codeVerifier"');
        parameters.set('code_verifier', codeVerifier);
    }
    return tokenEndpointRequest(as, client, clientAuthentication, 'authorization_code', parameters, options);
}
const jwtClaimNames = {
    aud: 'audience',
    c_hash: 'code hash',
    client_id: 'client id',
    exp: 'expiration time',
    iat: 'issued at',
    iss: 'issuer',
    jti: 'jwt id',
    nonce: 'nonce',
    s_hash: 'state hash',
    sub: 'subject',
    ath: 'access token hash',
    htm: 'http method',
    htu: 'http uri',
    cnf: 'confirmation',
    auth_time: 'authentication time',
};
function validatePresence(required, result) {
    for (const claim of required) {
        if (result.claims[claim] === undefined) {
            throw OPE(`JWT "${claim}" (${jwtClaimNames[claim]}) claim missing`, INVALID_RESPONSE, {
                claims: result.claims,
            });
        }
    }
    return result;
}
export const expectNoNonce = Symbol();
export const skipAuthTimeCheck = Symbol();
export async function processAuthorizationCodeResponse(as, client, response, options) {
    if (typeof options?.expectedNonce === 'string' ||
        typeof options?.maxAge === 'number' ||
        options?.requireIdToken) {
        return processAuthorizationCodeOpenIDResponse(as, client, response, options.expectedNonce, options.maxAge, {
            [jweDecrypt]: options[jweDecrypt],
        });
    }
    return processAuthorizationCodeOAuth2Response(as, client, response, options);
}
async function processAuthorizationCodeOpenIDResponse(as, client, response, expectedNonce, maxAge, options) {
    const additionalRequiredClaims = [];
    switch (expectedNonce) {
        case undefined:
            expectedNonce = expectNoNonce;
            break;
        case expectNoNonce:
            break;
        default:
            assertString(expectedNonce, '"expectedNonce" argument');
            additionalRequiredClaims.push('nonce');
    }
    maxAge ??= client.default_max_age;
    switch (maxAge) {
        case undefined:
            maxAge = skipAuthTimeCheck;
            break;
        case skipAuthTimeCheck:
            break;
        default:
            assertNumber(maxAge, false, '"maxAge" argument');
            additionalRequiredClaims.push('auth_time');
    }
    const result = await processGenericAccessTokenResponse(as, client, response, additionalRequiredClaims, options);
    assertString(result.id_token, '"response" body "id_token" property', INVALID_RESPONSE, {
        body: result,
    });
    const claims = getValidatedIdTokenClaims(result);
    if (maxAge !== skipAuthTimeCheck) {
        const now = epochTime() + getClockSkew(client);
        const tolerance = getClockTolerance(client);
        if (claims.auth_time + maxAge < now - tolerance) {
            throw OPE('too much time has elapsed since the last End-User authentication', JWT_TIMESTAMP_CHECK, { claims, now, tolerance, claim: 'auth_time' });
        }
    }
    if (expectedNonce === expectNoNonce) {
        if (claims.nonce !== undefined) {
            throw OPE('unexpected ID Token "nonce" claim value', JWT_CLAIM_COMPARISON, {
                expected: undefined,
                claims,
                claim: 'nonce',
            });
        }
    }
    else if (claims.nonce !== expectedNonce) {
        throw OPE('unexpected ID Token "nonce" claim value', JWT_CLAIM_COMPARISON, {
            expected: expectedNonce,
            claims,
            claim: 'nonce',
        });
    }
    return result;
}
async function processAuthorizationCodeOAuth2Response(as, client, response, options) {
    const result = await processGenericAccessTokenResponse(as, client, response, undefined, options);
    const claims = getValidatedIdTokenClaims(result);
    if (claims) {
        if (client.default_max_age !== undefined) {
            assertNumber(client.default_max_age, false, '"client.default_max_age"');
            const now = epochTime() + getClockSkew(client);
            const tolerance = getClockTolerance(client);
            if (claims.auth_time + client.default_max_age < now - tolerance) {
                throw OPE('too much time has elapsed since the last End-User authentication', JWT_TIMESTAMP_CHECK, { claims, now, tolerance, claim: 'auth_time' });
            }
        }
        if (claims.nonce !== undefined) {
            throw OPE('unexpected ID Token "nonce" claim value', JWT_CLAIM_COMPARISON, {
                expected: undefined,
                claims,
                claim: 'nonce',
            });
        }
    }
    return result;
}
export const WWW_AUTHENTICATE_CHALLENGE = 'OAUTH_WWW_AUTHENTICATE_CHALLENGE';
export const RESPONSE_BODY_ERROR = 'OAUTH_RESPONSE_BODY_ERROR';
export const UNSUPPORTED_OPERATION = 'OAUTH_UNSUPPORTED_OPERATION';
export const AUTHORIZATION_RESPONSE_ERROR = 'OAUTH_AUTHORIZATION_RESPONSE_ERROR';
export const JWT_USERINFO_EXPECTED = 'OAUTH_JWT_USERINFO_EXPECTED';
export const PARSE_ERROR = 'OAUTH_PARSE_ERROR';
export const INVALID_RESPONSE = 'OAUTH_INVALID_RESPONSE';
export const INVALID_REQUEST = 'OAUTH_INVALID_REQUEST';
export const RESPONSE_IS_NOT_JSON = 'OAUTH_RESPONSE_IS_NOT_JSON';
export const RESPONSE_IS_NOT_CONFORM = 'OAUTH_RESPONSE_IS_NOT_CONFORM';
export const HTTP_REQUEST_FORBIDDEN = 'OAUTH_HTTP_REQUEST_FORBIDDEN';
export const REQUEST_PROTOCOL_FORBIDDEN = 'OAUTH_REQUEST_PROTOCOL_FORBIDDEN';
export const JWT_TIMESTAMP_CHECK = 'OAUTH_JWT_TIMESTAMP_CHECK_FAILED';
export const JWT_CLAIM_COMPARISON = 'OAUTH_JWT_CLAIM_COMPARISON_FAILED';
export const JSON_ATTRIBUTE_COMPARISON = 'OAUTH_JSON_ATTRIBUTE_COMPARISON_FAILED';
export const KEY_SELECTION = 'OAUTH_KEY_SELECTION_FAILED';
export const MISSING_SERVER_METADATA = 'OAUTH_MISSING_SERVER_METADATA';
export const INVALID_SERVER_METADATA = 'OAUTH_INVALID_SERVER_METADATA';
function checkJwtType(expected, result) {
    if (typeof result.header.typ !== 'string' || normalizeTyp(result.header.typ) !== expected) {
        throw OPE('unexpected JWT "typ" header parameter value', INVALID_RESPONSE, {
            header: result.header,
        });
    }
    return result;
}
export async function clientCredentialsGrantRequest(as, client, clientAuthentication, parameters, options) {
    assertAs(as);
    assertClient(client);
    return tokenEndpointRequest(as, client, clientAuthentication, 'client_credentials', new URLSearchParams(parameters), options);
}
export async function genericTokenEndpointRequest(as, client, clientAuthentication, grantType, parameters, options) {
    assertAs(as);
    assertClient(client);
    assertString(grantType, '"grantType"');
    return tokenEndpointRequest(as, client, clientAuthentication, grantType, new URLSearchParams(parameters), options);
}
export async function processGenericTokenEndpointResponse(as, client, response, options) {
    return processGenericAccessTokenResponse(as, client, response, undefined, options);
}
export async function processClientCredentialsResponse(as, client, response, options) {
    return processGenericAccessTokenResponse(as, client, response, undefined, options);
}
export async function revocationRequest(as, client, clientAuthentication, token, options) {
    assertAs(as);
    assertClient(client);
    assertString(token, '"token"');
    const url = resolveEndpoint(as, 'revocation_endpoint', client.use_mtls_endpoint_aliases, options?.[allowInsecureRequests] !== true);
    const body = new URLSearchParams(options?.additionalParameters);
    body.set('token', token);
    const headers = prepareHeaders(options?.headers);
    headers.delete('accept');
    return authenticatedRequest(as, client, clientAuthentication, url, body, headers, options);
}
export async function processRevocationResponse(response) {
    if (!looseInstanceOf(response, Response)) {
        throw CodedTypeError('"response" must be an instance of Response', ERR_INVALID_ARG_TYPE);
    }
    let challenges;
    if ((challenges = parseWwwAuthenticateChallenges(response))) {
        throw new WWWAuthenticateChallengeError('server responded with a challenge in the WWW-Authenticate HTTP Header', { cause: challenges, response });
    }
    if (response.status !== 200) {
        let err;
        if ((err = await handleOAuthBodyError(response))) {
            await response.body?.cancel();
            throw new ResponseBodyError('server responded with an error in the response body', {
                cause: err,
                response,
            });
        }
        throw OPE('"response" is not a conform Revocation Endpoint response', RESPONSE_IS_NOT_CONFORM, response);
    }
    return undefined;
}
function assertReadableResponse(response) {
    if (response.bodyUsed) {
        throw CodedTypeError('"response" body has been used already', ERR_INVALID_ARG_VALUE);
    }
}
export async function introspectionRequest(as, client, clientAuthentication, token, options) {
    assertAs(as);
    assertClient(client);
    assertString(token, '"token"');
    const url = resolveEndpoint(as, 'introspection_endpoint', client.use_mtls_endpoint_aliases, options?.[allowInsecureRequests] !== true);
    const body = new URLSearchParams(options?.additionalParameters);
    body.set('token', token);
    const headers = prepareHeaders(options?.headers);
    if (options?.requestJwtResponse ?? client.introspection_signed_response_alg) {
        headers.set('accept', 'application/token-introspection+jwt');
    }
    else {
        headers.set('accept', 'application/json');
    }
    return authenticatedRequest(as, client, clientAuthentication, url, body, headers, options);
}
export async function processIntrospectionResponse(as, client, response, options) {
    assertAs(as);
    assertClient(client);
    if (!looseInstanceOf(response, Response)) {
        throw CodedTypeError('"response" must be an instance of Response', ERR_INVALID_ARG_TYPE);
    }
    let challenges;
    if ((challenges = parseWwwAuthenticateChallenges(response))) {
        throw new WWWAuthenticateChallengeError('server responded with a challenge in the WWW-Authenticate HTTP Header', { cause: challenges, response });
    }
    if (response.status !== 200) {
        let err;
        if ((err = await handleOAuthBodyError(response))) {
            await response.body?.cancel();
            throw new ResponseBodyError('server responded with an error in the response body', {
                cause: err,
                response,
            });
        }
        throw OPE('"response" is not a conform Introspection Endpoint response', RESPONSE_IS_NOT_CONFORM, response);
    }
    let json;
    if (getContentType(response) === 'application/token-introspection+jwt') {
        assertReadableResponse(response);
        const { claims, jwt } = await validateJwt(await response.text(), checkSigningAlgorithm.bind(undefined, client.introspection_signed_response_alg, as.introspection_signing_alg_values_supported, 'RS256'), getClockSkew(client), getClockTolerance(client), options?.[jweDecrypt])
            .then(checkJwtType.bind(undefined, 'token-introspection+jwt'))
            .then(validatePresence.bind(undefined, ['aud', 'iat', 'iss']))
            .then(validateIssuer.bind(undefined, as))
            .then(validateAudience.bind(undefined, client.client_id));
        jwtRefs.set(response, jwt);
        json = claims.token_introspection;
        if (!isJsonObject(json)) {
            throw OPE('JWT "token_introspection" claim must be a JSON object', INVALID_RESPONSE, {
                claims,
            });
        }
    }
    else {
        assertReadableResponse(response);
        assertApplicationJson(response);
        try {
            json = await response.json();
        }
        catch (cause) {
            throw OPE('failed to parse "response" body as JSON', PARSE_ERROR, cause);
        }
        if (!isJsonObject(json)) {
            throw OPE('"response" body must be a top level object', INVALID_RESPONSE, { body: json });
        }
    }
    if (typeof json.active !== 'boolean') {
        throw OPE('"response" body "active" property must be a boolean', INVALID_RESPONSE, {
            body: json,
        });
    }
    return json;
}
async function jwksRequest(as, options) {
    assertAs(as);
    const url = resolveEndpoint(as, 'jwks_uri', false, options?.[allowInsecureRequests] !== true);
    const headers = prepareHeaders(options?.headers);
    headers.set('accept', 'application/json');
    headers.append('accept', 'application/jwk-set+json');
    return (options?.[customFetch] || fetch)(url.href, {
        body: undefined,
        headers: Object.fromEntries(headers.entries()),
        method: 'GET',
        redirect: 'manual',
        signal: options?.signal ? signal(options.signal) : undefined,
    });
}
async function processJwksResponse(response) {
    if (!looseInstanceOf(response, Response)) {
        throw CodedTypeError('"response" must be an instance of Response', ERR_INVALID_ARG_TYPE);
    }
    if (response.status !== 200) {
        throw OPE('"response" is not a conform JSON Web Key Set response', RESPONSE_IS_NOT_CONFORM, response);
    }
    assertReadableResponse(response);
    assertContentTypes(response, 'application/json', 'application/jwk-set+json');
    let json;
    try {
        json = await response.json();
    }
    catch (cause) {
        throw OPE('failed to parse "response" body as JSON', PARSE_ERROR, cause);
    }
    if (!isJsonObject(json)) {
        throw OPE('"response" body must be a top level object', INVALID_RESPONSE, { body: json });
    }
    if (!Array.isArray(json.keys)) {
        throw OPE('"response" body "keys" property must be an array', INVALID_RESPONSE, { body: json });
    }
    if (!Array.prototype.every.call(json.keys, isJsonObject)) {
        throw OPE('"response" body "keys" property members must be JWK formatted objects', INVALID_RESPONSE, { body: json });
    }
    return json;
}
async function handleOAuthBodyError(response) {
    if (response.status > 399 && response.status < 500) {
        assertReadableResponse(response);
        assertApplicationJson(response);
        try {
            const json = await response.clone().json();
            if (isJsonObject(json) && typeof json.error === 'string' && json.error.length) {
                return json;
            }
        }
        catch { }
    }
    return undefined;
}
function supported(alg) {
    switch (alg) {
        case 'PS256':
        case 'ES256':
        case 'RS256':
        case 'PS384':
        case 'ES384':
        case 'RS384':
        case 'PS512':
        case 'ES512':
        case 'RS512':
        case 'Ed25519':
        case 'EdDSA':
            return true;
        default:
            return false;
    }
}
function checkSupportedJwsAlg(header) {
    if (!supported(header.alg)) {
        throw new UnsupportedOperationError('unsupported JWS "alg" identifier', {
            cause: { alg: header.alg },
        });
    }
}
function checkRsaKeyAlgorithm(key) {
    const { algorithm } = key;
    if (typeof algorithm.modulusLength !== 'number' || algorithm.modulusLength < 2048) {
        throw new UnsupportedOperationError(`unsupported ${algorithm.name} modulusLength`, {
            cause: key,
        });
    }
}
function ecdsaHashName(key) {
    const { algorithm } = key;
    switch (algorithm.namedCurve) {
        case 'P-256':
            return 'SHA-256';
        case 'P-384':
            return 'SHA-384';
        case 'P-521':
            return 'SHA-512';
        default:
            throw new UnsupportedOperationError('unsupported ECDSA namedCurve', { cause: key });
    }
}
function keyToSubtle(key) {
    switch (key.algorithm.name) {
        case 'ECDSA':
            return {
                name: key.algorithm.name,
                hash: ecdsaHashName(key),
            };
        case 'RSA-PSS': {
            checkRsaKeyAlgorithm(key);
            switch (key.algorithm.hash.name) {
                case 'SHA-256':
                case 'SHA-384':
                case 'SHA-512':
                    return {
                        name: key.algorithm.name,
                        saltLength: parseInt(key.algorithm.hash.name.slice(-3), 10) >> 3,
                    };
                default:
                    throw new UnsupportedOperationError('unsupported RSA-PSS hash name', { cause: key });
            }
        }
        case 'RSASSA-PKCS1-v1_5':
            checkRsaKeyAlgorithm(key);
            return key.algorithm.name;
        case 'Ed25519':
        case 'EdDSA':
            return key.algorithm.name;
    }
    throw new UnsupportedOperationError('unsupported CryptoKey algorithm name', { cause: key });
}
async function validateJwsSignature(protectedHeader, payload, key, signature) {
    const data = buf(`${protectedHeader}.${payload}`);
    const algorithm = keyToSubtle(key);
    const verified = await crypto.subtle.verify(algorithm, key, signature, data);
    if (!verified) {
        throw OPE('JWT signature verification failed', INVALID_RESPONSE, {
            key,
            data,
            signature,
            algorithm,
        });
    }
}
async function validateJwt(jws, checkAlg, clockSkew, clockTolerance, decryptJwt) {
    let { 0: protectedHeader, 1: payload, length } = jws.split('.');
    if (length === 5) {
        if (decryptJwt !== undefined) {
            jws = await decryptJwt(jws);
            ({ 0: protectedHeader, 1: payload, length } = jws.split('.'));
        }
        else {
            throw new UnsupportedOperationError('JWE decryption is not configured', { cause: jws });
        }
    }
    if (length !== 3) {
        throw OPE('Invalid JWT', INVALID_RESPONSE, jws);
    }
    let header;
    try {
        header = JSON.parse(buf(b64u(protectedHeader)));
    }
    catch (cause) {
        throw OPE('failed to parse JWT Header body as base64url encoded JSON', PARSE_ERROR, cause);
    }
    if (!isJsonObject(header)) {
        throw OPE('JWT Header must be a top level object', INVALID_RESPONSE, jws);
    }
    checkAlg(header);
    if (header.crit !== undefined) {
        throw new UnsupportedOperationError('no JWT "crit" header parameter extensions are supported', {
            cause: { header },
        });
    }
    let claims;
    try {
        claims = JSON.parse(buf(b64u(payload)));
    }
    catch (cause) {
        throw OPE('failed to parse JWT Payload body as base64url encoded JSON', PARSE_ERROR, cause);
    }
    if (!isJsonObject(claims)) {
        throw OPE('JWT Payload must be a top level object', INVALID_RESPONSE, jws);
    }
    const now = epochTime() + clockSkew;
    if (claims.exp !== undefined) {
        if (typeof claims.exp !== 'number') {
            throw OPE('unexpected JWT "exp" (expiration time) claim type', INVALID_RESPONSE, { claims });
        }
        if (claims.exp <= now - clockTolerance) {
            throw OPE('unexpected JWT "exp" (expiration time) claim value, expiration is past current timestamp', JWT_TIMESTAMP_CHECK, { claims, now, tolerance: clockTolerance, claim: 'exp' });
        }
    }
    if (claims.iat !== undefined) {
        if (typeof claims.iat !== 'number') {
            throw OPE('unexpected JWT "iat" (issued at) claim type', INVALID_RESPONSE, { claims });
        }
    }
    if (claims.iss !== undefined) {
        if (typeof claims.iss !== 'string') {
            throw OPE('unexpected JWT "iss" (issuer) claim type', INVALID_RESPONSE, { claims });
        }
    }
    if (claims.nbf !== undefined) {
        if (typeof claims.nbf !== 'number') {
            throw OPE('unexpected JWT "nbf" (not before) claim type', INVALID_RESPONSE, { claims });
        }
        if (claims.nbf > now + clockTolerance) {
            throw OPE('unexpected JWT "nbf" (not before) claim value', JWT_TIMESTAMP_CHECK, {
                claims,
                now,
                tolerance: clockTolerance,
                claim: 'nbf',
            });
        }
    }
    if (claims.aud !== undefined) {
        if (typeof claims.aud !== 'string' && !Array.isArray(claims.aud)) {
            throw OPE('unexpected JWT "aud" (audience) claim type', INVALID_RESPONSE, { claims });
        }
    }
    return { header, claims, jwt: jws };
}
export async function validateJwtAuthResponse(as, client, parameters, expectedState, options) {
    assertAs(as);
    assertClient(client);
    if (parameters instanceof URL) {
        parameters = parameters.searchParams;
    }
    if (!(parameters instanceof URLSearchParams)) {
        throw CodedTypeError('"parameters" must be an instance of URLSearchParams, or URL', ERR_INVALID_ARG_TYPE);
    }
    const response = getURLSearchParameter(parameters, 'response');
    if (!response) {
        throw OPE('"parameters" does not contain a JARM response', INVALID_RESPONSE);
    }
    const { claims, header, jwt } = await validateJwt(response, checkSigningAlgorithm.bind(undefined, client.authorization_signed_response_alg, as.authorization_signing_alg_values_supported, 'RS256'), getClockSkew(client), getClockTolerance(client), options?.[jweDecrypt])
        .then(validatePresence.bind(undefined, ['aud', 'exp', 'iss']))
        .then(validateIssuer.bind(undefined, as))
        .then(validateAudience.bind(undefined, client.client_id));
    const { 0: protectedHeader, 1: payload, 2: encodedSignature } = jwt.split('.');
    const signature = b64u(encodedSignature);
    const key = await getPublicSigKeyFromIssuerJwksUri(as, options, header);
    await validateJwsSignature(protectedHeader, payload, key, signature);
    const result = new URLSearchParams();
    for (const [key, value] of Object.entries(claims)) {
        if (typeof value === 'string' && key !== 'aud') {
            result.set(key, value);
        }
    }
    return validateAuthResponse(as, client, result, expectedState);
}
async function idTokenHash(data, header, claimName) {
    let algorithm;
    switch (header.alg) {
        case 'RS256':
        case 'PS256':
        case 'ES256':
            algorithm = 'SHA-256';
            break;
        case 'RS384':
        case 'PS384':
        case 'ES384':
            algorithm = 'SHA-384';
            break;
        case 'RS512':
        case 'PS512':
        case 'ES512':
        case 'Ed25519':
        case 'EdDSA':
            algorithm = 'SHA-512';
            break;
        default:
            throw new UnsupportedOperationError(`unsupported JWS algorithm for ${claimName} calculation`, { cause: { alg: header.alg } });
    }
    const digest = await crypto.subtle.digest(algorithm, buf(data));
    return b64u(digest.slice(0, digest.byteLength / 2));
}
async function idTokenHashMatches(data, actual, header, claimName) {
    const expected = await idTokenHash(data, header, claimName);
    return actual === expected;
}
export async function validateDetachedSignatureResponse(as, client, parameters, expectedNonce, expectedState, maxAge, options) {
    return validateHybridResponse(as, client, parameters, expectedNonce, expectedState, maxAge, options, true);
}
export async function validateCodeIdTokenResponse(as, client, parameters, expectedNonce, expectedState, maxAge, options) {
    return validateHybridResponse(as, client, parameters, expectedNonce, expectedState, maxAge, options, false);
}
async function validateHybridResponse(as, client, parameters, expectedNonce, expectedState, maxAge, options, fapi) {
    assertAs(as);
    assertClient(client);
    if (parameters instanceof URL) {
        if (!parameters.hash.length) {
            throw CodedTypeError('"parameters" as an instance of URL must contain a hash (fragment) with the Authorization Response parameters', ERR_INVALID_ARG_VALUE);
        }
        parameters = new URLSearchParams(parameters.hash.slice(1));
    }
    if (!(parameters instanceof URLSearchParams)) {
        throw CodedTypeError('"parameters" must be an instance of URLSearchParams', ERR_INVALID_ARG_TYPE);
    }
    parameters = new URLSearchParams(parameters);
    const id_token = getURLSearchParameter(parameters, 'id_token');
    parameters.delete('id_token');
    switch (expectedState) {
        case undefined:
        case expectNoState:
            break;
        default:
            assertString(expectedState, '"expectedState" argument');
    }
    const result = validateAuthResponse({
        ...as,
        authorization_response_iss_parameter_supported: false,
    }, client, parameters, expectedState);
    if (!id_token) {
        throw OPE('"parameters" does not contain an ID Token', INVALID_RESPONSE);
    }
    const code = getURLSearchParameter(parameters, 'code');
    if (!code) {
        throw OPE('"parameters" does not contain an Authorization Code', INVALID_RESPONSE);
    }
    const requiredClaims = [
        'aud',
        'exp',
        'iat',
        'iss',
        'sub',
        'nonce',
        'c_hash',
    ];
    const state = parameters.get('state');
    if (fapi && (typeof expectedState === 'string' || state !== null)) {
        requiredClaims.push('s_hash');
    }
    if (maxAge !== undefined) {
        assertNumber(maxAge, false, '"maxAge" argument');
    }
    else if (client.default_max_age !== undefined) {
        assertNumber(client.default_max_age, false, '"client.default_max_age"');
    }
    maxAge ??= client.default_max_age ?? skipAuthTimeCheck;
    if (client.require_auth_time || maxAge !== skipAuthTimeCheck) {
        requiredClaims.push('auth_time');
    }
    const { claims, header, jwt } = await validateJwt(id_token, checkSigningAlgorithm.bind(undefined, client.id_token_signed_response_alg, as.id_token_signing_alg_values_supported, 'RS256'), getClockSkew(client), getClockTolerance(client), options?.[jweDecrypt])
        .then(validatePresence.bind(undefined, requiredClaims))
        .then(validateIssuer.bind(undefined, as))
        .then(validateAudience.bind(undefined, client.client_id));
    const clockSkew = getClockSkew(client);
    const now = epochTime() + clockSkew;
    if (claims.iat < now - 3600) {
        throw OPE('unexpected JWT "iat" (issued at) claim value, it is too far in the past', JWT_TIMESTAMP_CHECK, { now, claims, claim: 'iat' });
    }
    assertString(claims.c_hash, 'ID Token "c_hash" (code hash) claim value', INVALID_RESPONSE, {
        claims,
    });
    if (claims.auth_time !== undefined) {
        assertNumber(claims.auth_time, false, 'ID Token "auth_time" (authentication time)', INVALID_RESPONSE, { claims });
    }
    if (maxAge !== skipAuthTimeCheck) {
        const now = epochTime() + getClockSkew(client);
        const tolerance = getClockTolerance(client);
        if (claims.auth_time + maxAge < now - tolerance) {
            throw OPE('too much time has elapsed since the last End-User authentication', JWT_TIMESTAMP_CHECK, { claims, now, tolerance, claim: 'auth_time' });
        }
    }
    assertString(expectedNonce, '"expectedNonce" argument');
    if (claims.nonce !== expectedNonce) {
        throw OPE('unexpected ID Token "nonce" claim value', JWT_CLAIM_COMPARISON, {
            expected: expectedNonce,
            claims,
            claim: 'nonce',
        });
    }
    if (Array.isArray(claims.aud) && claims.aud.length !== 1) {
        if (claims.azp === undefined) {
            throw OPE('ID Token "aud" (audience) claim includes additional untrusted audiences', JWT_CLAIM_COMPARISON, { claims, claim: 'aud' });
        }
        if (claims.azp !== client.client_id) {
            throw OPE('unexpected ID Token "azp" (authorized party) claim value', JWT_CLAIM_COMPARISON, {
                expected: client.client_id,
                claims,
                claim: 'azp',
            });
        }
    }
    const { 0: protectedHeader, 1: payload, 2: encodedSignature } = jwt.split('.');
    const signature = b64u(encodedSignature);
    const key = await getPublicSigKeyFromIssuerJwksUri(as, options, header);
    await validateJwsSignature(protectedHeader, payload, key, signature);
    if ((await idTokenHashMatches(code, claims.c_hash, header, 'c_hash')) !== true) {
        throw OPE('invalid ID Token "c_hash" (code hash) claim value', JWT_CLAIM_COMPARISON, {
            code,
            alg: header.alg,
            claim: 'c_hash',
            claims,
        });
    }
    if ((fapi && state !== null) || claims.s_hash !== undefined) {
        assertString(claims.s_hash, 'ID Token "s_hash" (state hash) claim value', INVALID_RESPONSE, {
            claims,
        });
        assertString(state, '"state" response parameter', INVALID_RESPONSE, { parameters });
        if ((await idTokenHashMatches(state, claims.s_hash, header, 's_hash')) !== true) {
            throw OPE('invalid ID Token "s_hash" (state hash) claim value', JWT_CLAIM_COMPARISON, {
                state,
                alg: header.alg,
                claim: 's_hash',
                claims,
            });
        }
    }
    return result;
}
const SUPPORTED_JWS_ALGS = Symbol();
function checkSigningAlgorithm(client, issuer, fallback, header) {
    if (client !== undefined) {
        if (typeof client === 'string' ? header.alg !== client : !client.includes(header.alg)) {
            throw OPE('unexpected JWT "alg" header parameter', INVALID_RESPONSE, {
                header,
                expected: client,
                reason: 'client configuration',
            });
        }
        return;
    }
    if (Array.isArray(issuer)) {
        if (!issuer.includes(header.alg)) {
            throw OPE('unexpected JWT "alg" header parameter', INVALID_RESPONSE, {
                header,
                expected: issuer,
                reason: 'authorization server metadata',
            });
        }
        return;
    }
    if (fallback !== undefined) {
        if (typeof fallback === 'string'
            ? header.alg !== fallback
            : typeof fallback === 'symbol'
                ? !supported(header.alg)
                : !fallback.includes(header.alg)) {
            throw OPE('unexpected JWT "alg" header parameter', INVALID_RESPONSE, {
                header,
                expected: fallback,
                reason: 'default value',
            });
        }
        return;
    }
    throw OPE('missing client or server configuration to verify used JWT "alg" header parameter', undefined, { client, issuer, fallback });
}
function getURLSearchParameter(parameters, name) {
    const { 0: value, length } = parameters.getAll(name);
    if (length > 1) {
        throw OPE(`"${name}" parameter must be provided only once`, INVALID_RESPONSE);
    }
    return value;
}
export const skipStateCheck = Symbol();
export const expectNoState = Symbol();
export function validateAuthResponse(as, client, parameters, expectedState) {
    assertAs(as);
    assertClient(client);
    if (parameters instanceof URL) {
        parameters = parameters.searchParams;
    }
    if (!(parameters instanceof URLSearchParams)) {
        throw CodedTypeError('"parameters" must be an instance of URLSearchParams, or URL', ERR_INVALID_ARG_TYPE);
    }
    if (getURLSearchParameter(parameters, 'response')) {
        throw OPE('"parameters" contains a JARM response, use validateJwtAuthResponse() instead of validateAuthResponse()', INVALID_RESPONSE, { parameters });
    }
    const iss = getURLSearchParameter(parameters, 'iss');
    const state = getURLSearchParameter(parameters, 'state');
    if (!iss && as.authorization_response_iss_parameter_supported) {
        throw OPE('response parameter "iss" (issuer) missing', INVALID_RESPONSE, { parameters });
    }
    if (iss && iss !== as.issuer) {
        throw OPE('unexpected "iss" (issuer) response parameter value', INVALID_RESPONSE, {
            expected: as.issuer,
            parameters,
        });
    }
    switch (expectedState) {
        case undefined:
        case expectNoState:
            if (state !== undefined) {
                throw OPE('unexpected "state" response parameter encountered', INVALID_RESPONSE, {
                    expected: undefined,
                    parameters,
                });
            }
            break;
        case skipStateCheck:
            break;
        default:
            assertString(expectedState, '"expectedState" argument');
            if (state !== expectedState) {
                throw OPE(state === undefined
                    ? 'response parameter "state" missing'
                    : 'unexpected "state" response parameter value', INVALID_RESPONSE, { expected: expectedState, parameters });
            }
    }
    const error = getURLSearchParameter(parameters, 'error');
    if (error) {
        throw new AuthorizationResponseError('authorization response from the server is an error', {
            cause: parameters,
        });
    }
    const id_token = getURLSearchParameter(parameters, 'id_token');
    const token = getURLSearchParameter(parameters, 'token');
    if (id_token !== undefined || token !== undefined) {
        throw new UnsupportedOperationError('implicit and hybrid flows are not supported');
    }
    return brand(new URLSearchParams(parameters));
}
function algToSubtle(alg) {
    switch (alg) {
        case 'PS256':
        case 'PS384':
        case 'PS512':
            return { name: 'RSA-PSS', hash: `SHA-${alg.slice(-3)}` };
        case 'RS256':
        case 'RS384':
        case 'RS512':
            return { name: 'RSASSA-PKCS1-v1_5', hash: `SHA-${alg.slice(-3)}` };
        case 'ES256':
        case 'ES384':
            return { name: 'ECDSA', namedCurve: `P-${alg.slice(-3)}` };
        case 'ES512':
            return { name: 'ECDSA', namedCurve: 'P-521' };
        case 'Ed25519':
        case 'EdDSA':
            return 'Ed25519';
        default:
            throw new UnsupportedOperationError('unsupported JWS algorithm', { cause: { alg } });
    }
}
async function importJwk(alg, jwk) {
    const { ext, key_ops, use, ...key } = jwk;
    return crypto.subtle.importKey('jwk', key, algToSubtle(alg), true, ['verify']);
}
export async function deviceAuthorizationRequest(as, client, clientAuthentication, parameters, options) {
    assertAs(as);
    assertClient(client);
    const url = resolveEndpoint(as, 'device_authorization_endpoint', client.use_mtls_endpoint_aliases, options?.[allowInsecureRequests] !== true);
    const body = new URLSearchParams(parameters);
    body.set('client_id', client.client_id);
    const headers = prepareHeaders(options?.headers);
    headers.set('accept', 'application/json');
    return authenticatedRequest(as, client, clientAuthentication, url, body, headers, options);
}
export async function processDeviceAuthorizationResponse(as, client, response) {
    assertAs(as);
    assertClient(client);
    if (!looseInstanceOf(response, Response)) {
        throw CodedTypeError('"response" must be an instance of Response', ERR_INVALID_ARG_TYPE);
    }
    let challenges;
    if ((challenges = parseWwwAuthenticateChallenges(response))) {
        throw new WWWAuthenticateChallengeError('server responded with a challenge in the WWW-Authenticate HTTP Header', { cause: challenges, response });
    }
    if (response.status !== 200) {
        let err;
        if ((err = await handleOAuthBodyError(response))) {
            await response.body?.cancel();
            throw new ResponseBodyError('server responded with an error in the response body', {
                cause: err,
                response,
            });
        }
        throw OPE('"response" is not a conform Device Authorization Endpoint response', RESPONSE_IS_NOT_CONFORM, response);
    }
    assertReadableResponse(response);
    assertApplicationJson(response);
    let json;
    try {
        json = await response.json();
    }
    catch (cause) {
        throw OPE('failed to parse "response" body as JSON', PARSE_ERROR, cause);
    }
    if (!isJsonObject(json)) {
        throw OPE('"response" body must be a top level object', INVALID_RESPONSE, { body: json });
    }
    assertString(json.device_code, '"response" body "device_code" property', INVALID_RESPONSE, {
        body: json,
    });
    assertString(json.user_code, '"response" body "user_code" property', INVALID_RESPONSE, {
        body: json,
    });
    assertString(json.verification_uri, '"response" body "verification_uri" property', INVALID_RESPONSE, { body: json });
    assertNumber(json.expires_in, false, '"response" body "expires_in" property', INVALID_RESPONSE, {
        body: json,
    });
    if (json.verification_uri_complete !== undefined) {
        assertString(json.verification_uri_complete, '"response" body "verification_uri_complete" property', INVALID_RESPONSE, { body: json });
    }
    if (json.interval !== undefined) {
        assertNumber(json.interval, false, '"response" body "interval" property', INVALID_RESPONSE, {
            body: json,
        });
    }
    return json;
}
export async function deviceCodeGrantRequest(as, client, clientAuthentication, deviceCode, options) {
    assertAs(as);
    assertClient(client);
    assertString(deviceCode, '"deviceCode"');
    const parameters = new URLSearchParams(options?.additionalParameters);
    parameters.set('device_code', deviceCode);
    return tokenEndpointRequest(as, client, clientAuthentication, 'urn:ietf:params:oauth:grant-type:device_code', parameters, options);
}
export async function processDeviceCodeResponse(as, client, response, options) {
    return processGenericAccessTokenResponse(as, client, response, undefined, options);
}
export async function generateKeyPair(alg, options) {
    assertString(alg, '"alg"');
    const algorithm = algToSubtle(alg);
    if (alg.startsWith('PS') || alg.startsWith('RS')) {
        Object.assign(algorithm, {
            modulusLength: options?.modulusLength ?? 2048,
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        });
    }
    return crypto.subtle.generateKey(algorithm, options?.extractable ?? false, [
        'sign',
        'verify',
    ]);
}
function normalizeHtu(htu) {
    const url = new URL(htu);
    url.search = '';
    url.hash = '';
    return url.href;
}
async function validateDPoP(request, accessToken, accessTokenClaims, options) {
    const headerValue = request.headers.get('dpop');
    if (headerValue === null) {
        throw OPE('operation indicated DPoP use but the request has no DPoP HTTP Header', INVALID_REQUEST, { headers: request.headers });
    }
    if (request.headers.get('authorization')?.toLowerCase().startsWith('dpop ') === false) {
        throw OPE(`operation indicated DPoP use but the request's Authorization HTTP Header scheme is not DPoP`, INVALID_REQUEST, { headers: request.headers });
    }
    if (typeof accessTokenClaims.cnf?.jkt !== 'string') {
        throw OPE('operation indicated DPoP use but the JWT Access Token has no jkt confirmation claim', INVALID_REQUEST, { claims: accessTokenClaims });
    }
    const clockSkew = getClockSkew(options);
    const proof = await validateJwt(headerValue, checkSigningAlgorithm.bind(undefined, options?.signingAlgorithms, undefined, SUPPORTED_JWS_ALGS), clockSkew, getClockTolerance(options), undefined)
        .then(checkJwtType.bind(undefined, 'dpop+jwt'))
        .then(validatePresence.bind(undefined, ['iat', 'jti', 'ath', 'htm', 'htu']));
    const now = epochTime() + clockSkew;
    const diff = Math.abs(now - proof.claims.iat);
    if (diff > 300) {
        throw OPE('DPoP Proof iat is not recent enough', JWT_TIMESTAMP_CHECK, {
            now,
            claims: proof.claims,
            claim: 'iat',
        });
    }
    if (proof.claims.htm !== request.method) {
        throw OPE('DPoP Proof htm mismatch', JWT_CLAIM_COMPARISON, {
            expected: request.method,
            claims: proof.claims,
            claim: 'htm',
        });
    }
    if (typeof proof.claims.htu !== 'string' ||
        normalizeHtu(proof.claims.htu) !== normalizeHtu(request.url)) {
        throw OPE('DPoP Proof htu mismatch', JWT_CLAIM_COMPARISON, {
            expected: normalizeHtu(request.url),
            claims: proof.claims,
            claim: 'htu',
        });
    }
    {
        const expected = b64u(await crypto.subtle.digest('SHA-256', buf(accessToken)));
        if (proof.claims.ath !== expected) {
            throw OPE('DPoP Proof ath mismatch', JWT_CLAIM_COMPARISON, {
                expected,
                claims: proof.claims,
                claim: 'ath',
            });
        }
    }
    {
        let components;
        switch (proof.header.jwk.kty) {
            case 'EC':
                components = {
                    crv: proof.header.jwk.crv,
                    kty: proof.header.jwk.kty,
                    x: proof.header.jwk.x,
                    y: proof.header.jwk.y,
                };
                break;
            case 'OKP':
                components = {
                    crv: proof.header.jwk.crv,
                    kty: proof.header.jwk.kty,
                    x: proof.header.jwk.x,
                };
                break;
            case 'RSA':
                components = {
                    e: proof.header.jwk.e,
                    kty: proof.header.jwk.kty,
                    n: proof.header.jwk.n,
                };
                break;
            default:
                throw new UnsupportedOperationError('unsupported JWK key type', { cause: proof.header.jwk });
        }
        const expected = b64u(await crypto.subtle.digest('SHA-256', buf(JSON.stringify(components))));
        if (accessTokenClaims.cnf.jkt !== expected) {
            throw OPE('JWT Access Token confirmation mismatch', JWT_CLAIM_COMPARISON, {
                expected,
                claims: accessTokenClaims,
                claim: 'cnf.jkt',
            });
        }
    }
    const { 0: protectedHeader, 1: payload, 2: encodedSignature } = headerValue.split('.');
    const signature = b64u(encodedSignature);
    const { jwk, alg } = proof.header;
    if (!jwk) {
        throw OPE('DPoP Proof is missing the jwk header parameter', INVALID_REQUEST, {
            header: proof.header,
        });
    }
    const key = await importJwk(alg, jwk);
    if (key.type !== 'public') {
        throw OPE('DPoP Proof jwk header parameter must contain a public key', INVALID_REQUEST, {
            header: proof.header,
        });
    }
    await validateJwsSignature(protectedHeader, payload, key, signature);
}
export async function validateJwtAccessToken(as, request, expectedAudience, options) {
    assertAs(as);
    if (!looseInstanceOf(request, Request)) {
        throw CodedTypeError('"request" must be an instance of Request', ERR_INVALID_ARG_TYPE);
    }
    assertString(expectedAudience, '"expectedAudience"');
    const authorization = request.headers.get('authorization');
    if (authorization === null) {
        throw OPE('"request" is missing an Authorization HTTP Header', INVALID_REQUEST, {
            headers: request.headers,
        });
    }
    let { 0: scheme, 1: accessToken, length } = authorization.split(' ');
    scheme = scheme.toLowerCase();
    switch (scheme) {
        case 'dpop':
        case 'bearer':
            break;
        default:
            throw new UnsupportedOperationError('unsupported Authorization HTTP Header scheme', {
                cause: { headers: request.headers },
            });
    }
    if (length !== 2) {
        throw OPE('invalid Authorization HTTP Header format', INVALID_REQUEST, {
            headers: request.headers,
        });
    }
    const requiredClaims = [
        'iss',
        'exp',
        'aud',
        'sub',
        'iat',
        'jti',
        'client_id',
    ];
    if (options?.requireDPoP || scheme === 'dpop' || request.headers.has('dpop')) {
        requiredClaims.push('cnf');
    }
    const { claims, header } = await validateJwt(accessToken, checkSigningAlgorithm.bind(undefined, options?.signingAlgorithms, undefined, SUPPORTED_JWS_ALGS), getClockSkew(options), getClockTolerance(options), undefined)
        .then(checkJwtType.bind(undefined, 'at+jwt'))
        .then(validatePresence.bind(undefined, requiredClaims))
        .then(validateIssuer.bind(undefined, as))
        .then(validateAudience.bind(undefined, expectedAudience))
        .catch(reassignRSCode);
    for (const claim of ['client_id', 'jti', 'sub']) {
        if (typeof claims[claim] !== 'string') {
            throw OPE(`unexpected JWT "${claim}" claim type`, INVALID_REQUEST, { claims });
        }
    }
    if ('cnf' in claims) {
        if (!isJsonObject(claims.cnf)) {
            throw OPE('unexpected JWT "cnf" (confirmation) claim value', INVALID_REQUEST, { claims });
        }
        const { 0: cnf, length } = Object.keys(claims.cnf);
        if (length) {
            if (length !== 1) {
                throw new UnsupportedOperationError('multiple confirmation claims are not supported', {
                    cause: { claims },
                });
            }
            if (cnf !== 'jkt') {
                throw new UnsupportedOperationError('unsupported JWT Confirmation method', {
                    cause: { claims },
                });
            }
        }
    }
    const { 0: protectedHeader, 1: payload, 2: encodedSignature } = accessToken.split('.');
    const signature = b64u(encodedSignature);
    const key = await getPublicSigKeyFromIssuerJwksUri(as, options, header);
    await validateJwsSignature(protectedHeader, payload, key, signature);
    if (options?.requireDPoP ||
        scheme === 'dpop' ||
        claims.cnf?.jkt !== undefined ||
        request.headers.has('dpop')) {
        await validateDPoP(request, accessToken, claims, options).catch(reassignRSCode);
    }
    return claims;
}
function reassignRSCode(err) {
    if (err instanceof OperationProcessingError && err?.code === INVALID_REQUEST) {
        err.code = INVALID_RESPONSE;
    }
    throw err;
}
export const _nopkce = Symbol();
export const _nodiscoverycheck = Symbol();
export const _expectedIssuer = Symbol();
//# sourceMappingURL=index.js.map