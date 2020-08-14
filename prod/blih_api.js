"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlihApi = void 0;
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
// MIT https://www.npmjs.com/package/blih
const options = {
    baseURL: 'https://blih.epitech.eu/',
    timeout: 10000,
};
function responseErrorInterceptor(error) {
    if (error.response && error.response.data.error) {
        return Promise.reject(error.response.data.error);
    }
    else {
        return Promise.reject(error.message);
    }
}
// Always use Node.js adapter
axios_1.default.defaults.adapter = require('axios/lib/adapters/http');
class BlihApi {
    /**
     * Constructor
     * @param  {CredentialsType} credentials Email, password or token
     */
    constructor(credentials) {
        if (!credentials) {
            throw 'Missing credentials';
        }
        else if (!credentials.email) {
            throw 'Email is mandatory to authenticate';
        }
        else if (!credentials.password && !credentials.token) {
            throw 'A password or token is needed to authenticate';
        }
        this._email = credentials.email;
        if (credentials.token) {
            this._token = credentials.token;
        }
        else if (credentials.password) {
            this._token = BlihApi.hashPassword(credentials.password);
        }
        else {
            throw 'A password or token is needed to authenticate';
        }
        this._api = axios_1.default.create(options);
        this._api.interceptors.response.use((rep) => rep, responseErrorInterceptor);
    }
    /**
     * Create a repository
     * @param  {String} repository Name of the new repository
     * @return {Promise} description
     */
    createRepository(repository) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = {
                name: repository,
                type: 'git',
            };
            return (yield this.call('post', '/repositories', data)).data.message;
        });
    }
    /**
     * Delete a repository
     * @async
     * @param  {String} repository Name of the repository to delete
     * @return {Promise} description
     */
    deleteRepository(repository) {
        return __awaiter(this, void 0, void 0, function* () {
            const encode_repo = encodeURIComponent(repository);
            return (yield this.call('delete', `/repository/${encode_repo}`)).data.message;
        });
    }
    /**
     * List repositories
     * @async
     * @return {Promise} the repositories you own
     */
    listRepositories() {
        return __awaiter(this, void 0, void 0, function* () {
            const list = (yield this.call('get', '/repositories')).data.repositories;
            return Object.keys(list)
                .filter((r) => r.length)
                .sort()
                .map((r) => ({
                name: r,
                url: list[r].url,
                uuid: list[r].uuid,
            }));
        });
    }
    /**
     * Get information about a repository
     * @async
     * @param  {String} repository Name of the new repository
     * @return {Promise} information about the repository
     */
    repositoryInfo(repository) {
        return __awaiter(this, void 0, void 0, function* () {
            const encode_repo = encodeURIComponent(repository);
            const info = (yield this.call('get', `/repository/${encode_repo}`)).data.message;
            info.name = encode_repo;
            info.creation_time = Number(info.creation_time);
            info.public = info.public !== 'False';
            return info;
        });
    }
    /**
     * Get ACL of a repository
     * @async
     * @param  {String} repository Name of the new repository
     * @return {Promise} the collaborators on this repository
     */
    getACL(repository) {
        return __awaiter(this, void 0, void 0, function* () {
            const encode_repo = encodeURIComponent(repository);
            try {
                const acl = (yield this.call('get', `/repository/${encode_repo}/acls`)).data;
                return Object.keys(acl)
                    .filter((c) => c.length && acl[c].length)
                    .sort()
                    .map((c) => ({
                    name: c,
                    rights: acl[c],
                }));
            }
            catch (e) {
                if (e === 'No ACLs') {
                    return [];
                }
                else {
                    throw e;
                }
            }
        });
    }
    /**
     * Set ACL for a repository
     * @async
     * @param {String} repository Name of the new repository
     * @param {String} user Name of user
     * @param {String} acl - one or many of 'a' (admin), 'r' (read) or 'w' (write)
     * @return {Promise} a message confirming ACL update
     */
    setACL(repository, user, acl) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = {
                acl,
                user,
            };
            const encode_repo = encodeURIComponent(repository);
            return (yield this.call('post', `/repository/${encode_repo}/acls`, data)).data.message;
        });
    }
    /**
     * Upload an SSH key. Only RSA keys are supported.
     * @param  {String} key - key contents (NOT the path to the file)
     * @return {Promise} a message confirming upload
     */
    uploadKey(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = {
                sshkey: encodeURIComponent(key),
            };
            return (yield this.call('post', '/sshkeys', data)).data.message;
        });
    }
    /**
     * List all SSH keys
     * @return {Promise} the public keys associated with your account
     */
    listKeys() {
        return __awaiter(this, void 0, void 0, function* () {
            const keys = (yield this.call('get', '/sshkeys')).data;
            return Object.keys(keys)
                .filter((k) => k.length)
                .sort()
                .map((k) => ({
                name: k,
                data: keys[k],
            }));
        });
    }
    /**
     * Delete an SSH key
     * @param  {String} key - name of the key (usually corresponds to the key comment)
     * @return {Promise} a message confirming deletion
     */
    deleteKey(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const encode_key = encodeURIComponent(key);
            return (yield this.call('delete', `/sshkey/${encode_key}`)).data.message;
        });
    }
    /**
     * Get your legacy identity
     * This is only useful for accounts created prior to 2016 that used the old login format
     * For newer users, this will simply return their email.
     * @return {Promise} the public keys associated with your account
     */
    whoami() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.call('get', '/whoami')).data.message;
        });
    }
    /**
     * Hash password to token
     * @param  {String} password - password to hash
     * @return {String} a new token
     */
    static hashPassword(password) {
        return crypto_1.default.createHash('sha512').update(password).digest('hex');
    }
    /**
     * Ping the Blih server
     * @return {Promise} the response time in milliseconds
     */
    static ping() {
        return __awaiter(this, void 0, void 0, function* () {
            const api = axios_1.default.create(options);
            // Add timestamps to requests and responses
            api.interceptors.request.use((config) => {
                ;
                config.startTimestamp = Date.now();
                return config;
            }, (error) => Promise.reject(error));
            api.interceptors.response.use((response) => {
                ;
                response.config.endTimestamp = Date.now();
                return response;
            }, responseErrorInterceptor);
            const res = yield api.get('/');
            return res.config.endTimestamp - res.config.startTimestamp;
        });
    }
    /**
     * Make a generic call to the Blih API
     * @private
     * @param  {String} method - HTTP method to use
     * @param  {String} endpoint - remote endpoint to use
     * @param  {Object} data - request body additionnal data
     * @return {Promise} the request
     */
    call(method, endpoint, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const body = { user: this._email, data, signature: '' };
            body.signature = crypto_1.default
                .createHmac('sha512', this._token)
                .update(body.user)
                .update(body.data ? JSON.stringify(body.data, undefined, 4) : '')
                .digest('hex');
            return this._api.request({
                method,
                url: endpoint,
                data: body,
            });
        });
    }
}
exports.BlihApi = BlihApi;
