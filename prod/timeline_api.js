"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimelineApi = void 0;
const axios_1 = __importDefault(require("axios"));
const options = {
    baseURL: 'https://gitlab.com/epi-codes/Epitech-2023-Timeline/-/raw/master/data/',
    timeout: 10000,
};
const optionsPing = {
    baseURL: 'https://gitlab.com/api/v4/projects/14133070/',
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
class TimelineApi {
    /**
     * Constructor
     */
    constructor() {
        this._timelineFiles = Object.freeze([
            'timeline-2022.json',
            'timeline-2023.json',
            'timeline-2024.json',
        ]);
        this._api = axios_1.default.create(options);
        this._api.interceptors.response.use((rep) => rep, responseErrorInterceptor);
    }
    /**
     * Get promo timeline
     * @async
     * @param  {String | Number} year year of the promo to fetch
     * @return {Promise} timeline info
     */
    async getTimeline(year) {
        const yearIdx = TimelineApi.timelines.findIndex((value) => value === `${year}`);
        if (yearIdx < 0 || !this._timelineFiles[yearIdx])
            throw 'Year not found';
        const fileToFetch = this._timelineFiles[yearIdx];
        const info = (await this.call('get', `/${fileToFetch}`)).data;
        return info;
    }
    /**
     * Ping the Gitlab server
     * @return {Promise} the response time in milliseconds
     */
    static async ping() {
        const api = axios_1.default.create(optionsPing);
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
        const res = await api.get('/');
        return res.config.endTimestamp - res.config.startTimestamp;
    }
    /**
     * Make a generic call to the Gitlab API
     * @private
     * @param  {String} method - HTTP method to use
     * @param  {String} endpoint - remote endpoint to use
     * @return {Promise} the request
     */
    async call(method, endpoint) {
        return this._api.request({ method, url: endpoint });
    }
}
exports.TimelineApi = TimelineApi;
TimelineApi.timelines = Object.freeze(['2022', '2023', '2024']);
