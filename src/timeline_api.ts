import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios'

const options = {
	baseURL: 'https://gitlab.com/epi-codes/Epitech-2023-Timeline/-/raw/master/data/',
	timeout: 10000,
}
const optionsPing = {
	baseURL: 'https://gitlab.com/api/v4/projects/14133070/',
	timeout: 10000,
}

function responseErrorInterceptor(error: any) {
	if (error.response && error.response.data.error) {
		return Promise.reject(error.response.data.error)
	} else {
		return Promise.reject(error.message)
	}
}

export type Timeline = {
	promo: number
	semester: number
	projects: Projects[]
}

export type Projects = {
	module: string
	project: string
	start: string
	end: string
	bttf: boolean
}

// Always use Node.js adapter
axios.defaults.adapter = require('axios/lib/adapters/http')

export class TimelineApi {
	private _api: AxiosInstance
	private readonly _timelineFiles = Object.freeze([
		'timeline-2021.json',
		'timeline-2022.json',
		'timeline-2023.json',
		'timeline-2023-msc.json',
		'timeline-2024.json',
		'timeline-2025.json',
		'timeline-2026.json',
		'timeline-2026-s2.json',
	])
	public static readonly timelines = Object.freeze([
		'2021',
		'2022',
		'2023',
		'2023-MSC',
		'2024',
		'2025',
		'2026-S1',
		'2026-S2',
	])

	/**
	 * Constructor
	 */
	constructor() {
		this._api = axios.create(options)
		this._api.interceptors.response.use((rep) => rep, responseErrorInterceptor)
	}

	/**
	 * Get promo timeline
	 * @async
	 * @param  {String | Number} year year of the promo to fetch
	 * @return {Promise} timeline info
	 */
	async getTimeline(year: string | number): Promise<Timeline> {
		const yearIdx = TimelineApi.timelines.findIndex((value) => value === `${year}`)
		if (yearIdx < 0 || !this._timelineFiles[yearIdx]) throw 'Year not found'
		const fileToFetch = this._timelineFiles[yearIdx]

		const info = (await this.call('get', `/${fileToFetch}`)).data
		return info
	}

	/**
	 * Ping the Gitlab server
	 * @return {Promise} the response time in milliseconds
	 */
	static async ping(): Promise<number> {
		const api = axios.create(optionsPing)

		// Add timestamps to requests and responses
		api.interceptors.request.use(
			(config) => {
				;(config as any).startTimestamp = Date.now()
				return config
			},
			(error) => Promise.reject(error)
		)
		api.interceptors.response.use((response) => {
			;(response.config as any).endTimestamp = Date.now()
			return response
		}, responseErrorInterceptor)

		const res = await api.get('/')
		return (res.config as any).endTimestamp - (res.config as any).startTimestamp
	}

	/**
	 * Make a generic call to the Gitlab API
	 * @private
	 * @param  {String} method - HTTP method to use
	 * @param  {String} endpoint - remote endpoint to use
	 * @return {Promise} the request
	 */
	private async call(
		method: AxiosRequestConfig['method'],
		endpoint: string
	): Promise<AxiosResponse<any>> {
		return this._api.request({ method, url: endpoint })
	}
}
