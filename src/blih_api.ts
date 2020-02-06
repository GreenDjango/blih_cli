// MIT https://www.npmjs.com/package/blih

import crypto from 'crypto'
import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios'

const options = {
	baseURL: 'https://blih.epitech.eu/',
	timeout: 10000,
}

function responseErrorInterceptor(error: any) {
	if (error.response && error.response.data.error) {
		return Promise.reject(error.response.data.error)
	} else {
		return Promise.reject(error.message)
	}
}

export type CredentialsType = { email: string; password?: string; token?: string }
export type PartialRepositoryType = { name: string; url: string; uuid: string }
export type Repository = {
	name: string
	url: string
	creation_time: number
	uuid: string
	description: string
	public: boolean
}
export type ACL = { name: string; rights: string }
export type Key = { name: string; data: string }

// Always use Node.js adapter
axios.defaults.adapter = require('axios/lib/adapters/http')

export class BlihApi {
	private _email: string
	private _token: string
	private _api: AxiosInstance

	/**
	 * Constructor
	 * @param  {CredentialsType} credentials Email, password or token
	 */
	constructor(credentials: { email: string; password?: string; token?: string }) {
		if (!credentials) {
			throw 'Missing credentials'
		} else if (!credentials.email) {
			throw 'Email is mandatory to authenticate'
		} else if (!credentials.password && !credentials.token) {
			throw 'A password or token is needed to authenticate'
		}
		this._email = credentials.email
		if (credentials.token) {
			this._token = credentials.token
		} else if (credentials.password) {
			this._token = this.hashPassword(credentials.password)
		} else {
			throw 'A password or token is needed to authenticate'
		}

		this._api = axios.create(options)
		this._api.interceptors.response.use(rep => rep, responseErrorInterceptor)
	}

	/**
	 * Create a repository
	 * @param  {String} repository Name of the new repository
	 * @return {Promise} description
	 */
	async createRepository(repository: string): Promise<string> {
		const data = {
			name: repository,
			type: 'git',
		}

		return (await this.call('post', '/repositories', data)).data.message
	}

	/**
	 * Delete a repository
	 * @async
	 * @param  {String} repository Name of the repository to delete
	 * @return {Promise} description
	 */
	async deleteRepository(repository: string): Promise<string> {
		const encode_repo = encodeURIComponent(repository)
		return (await this.call('delete', `/repository/${encode_repo}`)).data.message
	}

	/**
	 * List repositories
	 * @async
	 * @return {Promise} the repositories you own
	 */
	async listRepositories(): Promise<{ name: string; url: string; uuid: string }[]> {
		const list = (await this.call('get', '/repositories')).data.repositories
		return Object.keys(list)
			.filter(r => r.length)
			.sort()
			.map(r => ({
				name: r,
				url: list[r].url,
				uuid: list[r].uuid,
			}))
	}

	/**
	 * Get information about a repository
	 * @async
	 * @param  {String} repository Name of the new repository
	 * @return {Promise} information about the repository
	 */
	async repositoryInfo(
		repository: string
	): Promise<{
		name: string
		url: string
		creation_time: number
		uuid: string
		description: string
		public: boolean
	}> {
		const encode_repo = encodeURIComponent(repository)
		const info = (await this.call('get', `/repository/${encode_repo}`)).data.message
		info.name = encode_repo
		info.creation_time = Number(info.creation_time)
		info.public = info.public !== 'False'
		return info
	}

	/**
	 * Get ACL of a repository
	 * @async
	 * @param  {String} repository Name of the new repository
	 * @return {Promise} the collaborators on this repository
	 */
	async getACL(repository: string): Promise<{ name: string; rights: string }[]> {
		const encode_repo = encodeURIComponent(repository)
		try {
			const acl = (await this.call('get', `/repository/${encode_repo}/acls`)).data
			return Object.keys(acl)
				.filter(c => c.length && acl[c].length)
				.sort()
				.map(c => ({
					name: c,
					rights: acl[c],
				}))
		} catch (e) {
			if (e === 'No ACLs') {
				return []
			} else {
				throw e
			}
		}
	}

	/**
	 * Set ACL for a repository
	 * @async
	 * @param {String} repository Name of the new repository
	 * @param {String} user Name of user
	 * @param {String} acl - one or many of 'a' (admin), 'r' (read) or 'w' (write)
	 * @return {Promise} a message confirming ACL update
	 */
	async setACL(repository: string, user: string, acl: string): Promise<string> {
		const data = {
			acl,
			user,
		}
		const encode_repo = encodeURIComponent(repository)

		return (await this.call('post', `/repository/${encode_repo}/acls`, data)).data.message
	}

	/**
	 * Upload an SSH key. Only RSA keys are supported.
	 * @param  {String} key - key contents (NOT the path to the file)
	 * @return {Promise} a message confirming upload
	 */
	async uploadKey(key: string): Promise<string> {
		const data = {
			sshkey: encodeURIComponent(key),
		}

		return (await this.call('post', '/sshkeys', data)).data.message
	}

	/**
	 * List all SSH keys
	 * @return {Promise} the public keys associated with your account
	 */
	async listKeys(): Promise<{ name: string; data: string }[]> {
		const keys = (await this.call('get', '/sshkeys')).data
		return Object.keys(keys)
			.filter(k => k.length)
			.sort()
			.map(k => ({
				name: k,
				data: keys[k],
			}))
	}

	/**
	 * Delete an SSH key
	 * @param  {String} key - name of the key (usually corresponds to the key comment)
	 * @return {Promise} a message confirming deletion
	 */
	async deleteKey(key: string): Promise<string> {
		const encode_key = encodeURIComponent(key)
		return (await this.call('delete', `/sshkey/${encode_key}`)).data.message
	}

	/**
	 * Get your legacy identity
	 * This is only useful for accounts created prior to 2016 that used the old login format
	 * For newer users, this will simply return their email.
	 * @return {Promise} the public keys associated with your account
	 */
	async whoami(): Promise<string> {
		return (await this.call('get', '/whoami')).data.message
	}

	/**
	 * Hash password to token
	 * @param  {String} password - password to hash
	 * @return {String} a new token
	 */
	hashPassword(password: string): string {
		return crypto
			.createHash('sha512')
			.update(password)
			.digest('hex')
	}

	/**
	 * Ping the Blih server
	 * @return {Promise} the response time in milliseconds
	 */
	async ping(): Promise<number> {
		const api = axios.create(options)

		// Add timestamps to requests and responses
		api.interceptors.request.use(
			config => {
				;(config as any).startTimestamp = Date.now()
				return config
			},
			error => Promise.reject(error)
		)
		api.interceptors.response.use(response => {
			;(response.config as any).endTimestamp = Date.now()
			return response
		}, responseErrorInterceptor)

		const res = await api.get('/')
		return (res.config as any).endTimestamp - (res.config as any).startTimestamp
	}

	/**
	 * Make a generic call to the Blih API
	 * @private
	 * @param  {String} method - HTTP method to use
	 * @param  {String} endpoint - remote endpoint to use
	 * @param  {Object} data - request body additionnal data
	 * @return {Promise} the request
	 */
	private async call(
		method: AxiosRequestConfig['method'],
		endpoint: string,
		data?: any
	): Promise<AxiosResponse<any>> {
		const body = { user: this._email, data, signature: '' }

		body.signature = crypto
			.createHmac('sha512', this._token)
			.update(body.user)
			.update(body.data ? JSON.stringify(body.data, null, 4) : '')
			.digest('hex')

		return this._api.request({
			method,
			url: endpoint,
			data: body,
		})
	}
}
