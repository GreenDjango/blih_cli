import chalk from 'chalk'
import fs from 'fs'
import { exec } from 'child_process'
import { homedir } from 'os'

const CONFIG_FOLDER = homedir() + '/.config/blih_cli'
const CONFIG_FILE = '.cli_data.json'
const CONFIG_PATH = `${CONFIG_FOLDER}/${CONFIG_FILE}`
export const APP_VERSION = get_app_version()
export const WAIT_MSG = 'Process...'

export class ConfigType {
	private _listen: Function | null
	private _email: string
	private _token: string
	private _save_token: boolean
	private _auto_acl: boolean
	private _verbose: boolean
	private _contact: string[]
	public args: string[] | null
	public repo: string[]

	constructor() {
		this._listen = null
		this._email = ''
		this._token = ''
		this._save_token = false
		this._auto_acl = true
		this._verbose = true
		this._contact = []
		this.args = null
		this.repo = []
	}

	to_json() {
		return {
			email: this.email,
			token: this.token,
			save_token: this.save_token,
			auto_acl: this.auto_acl,
			verbose: this.verbose,
			contact: this.contact,
		}
	}

	addListener(callback: Function) {
		this._listen = callback
	}

	removeListener() {
		this._listen = null
	}

	private _triggerListener() {
		if (this._listen) {
			this._listen(this.to_json())
		}
	}

	get email() {
		return this._email
	}
	set email(email: string) {
		this._email = email
		this._triggerListener()
	}
	get token() {
		return this._token
	}
	set token(token: string) {
		this._token = token
		this._triggerListener()
	}
	get save_token() {
		return this._save_token
	}
	set save_token(save_token: boolean) {
		this._save_token = save_token
		this._triggerListener()
	}
	get auto_acl() {
		return this._auto_acl
	}
	set auto_acl(auto_acl: boolean) {
		this._auto_acl = auto_acl
		this._triggerListener()
	}
	get verbose() {
		return this._verbose
	}
	set verbose(verbose: boolean) {
		this._verbose = verbose
		this._triggerListener()
	}
	get contact() {
		return this._contact
	}
	set contact(contact: string[]) {
		this._contact = contact
		this._triggerListener()
	}
}

export function open_config() {
	let config
	try {
		if (fs.existsSync(CONFIG_PATH)) {
			const config_file = fs.readFileSync(CONFIG_PATH, 'utf8')
			config = JSON.parse(config_file)
		} else {
			config = {}
		}
	} catch (err) {
		print_message('Fail to open config file', err, 'error')
	}
	return parse_config(config)
}

function parse_config(config: any) {
	const regex_email = RegExp('([\\w.-]+@([\\w-]+)\\.+\\w{2,})')
	const new_config = new ConfigType()

	if (config.email && regex_email.test(config.email)) {
		new_config.email = config.email
	}
	if (config.token) {
		new_config.token = config.token
	}
	if (config.save_token) {
		new_config.save_token = true
	}
	if (config.auto_acl === false) {
		new_config.auto_acl = false
	}
	if (config.verbose === false) {
		new_config.verbose = false
	}
	if (config.contact) {
		new_config.contact = config.contact
	}

	new_config.addListener(write_config)

	return new_config
}

export async function write_config(config_info: any) {
	if (!config_info.save_token) {
		config_info.token = undefined as any
	}
	try {
		if (!fs.existsSync(CONFIG_FOLDER)) {
			fs.mkdirSync(CONFIG_FOLDER, { recursive: true })
		}
		const config_json = JSON.stringify(config_info, undefined, 4)
		fs.writeFileSync(CONFIG_PATH, config_json, 'utf8')
	} catch (err) {
		print_message('Fail to save config file', err, 'error')
	}
}

export function print_message(title: string, message: string, level: 'message' | 'fail' | 'error') {
	if (level === 'error') {
		console.error(chalk.redBright.bold(title))
		throw new Error(chalk.redBright(message))
	} else if (level === 'fail') {
		if (message) {
			console.error(chalk.redBright.bold(title))
			console.error(chalk.redBright(message))
		} else {
			console.error(chalk.redBright.bold(title))
		}
	} else {
		if (message) {
			console.log(chalk.greenBright.bold(title))
			console.log(chalk.greenBright(message))
		} else {
			console.log(chalk.green(title))
		}
	}
}

export async function sh(cmd: string): Promise<{ stdout: string; stderr: string }> {
	return new Promise(function(resolve, reject) {
		exec(cmd, (err, stdout, stderr) => {
			if (err) reject(err)
			else resolve({ stdout, stderr })
		})
	})
}

export async function sh_live(cmd: string): Promise<{ stdout: string; stderr: string }> {
	return new Promise(function(resolve, reject) {
		const child = exec(cmd, (err, stdout, stderr) => {
			if (err) reject(err)
			else resolve({ stdout, stderr })
		})
		child.stdout?.on('data', data => {
			process.stdout.write(data)
		})
		child.stderr?.on('data', data => {
			process.stderr.write(data)
		})
	})
}

async function get_app_version() {
	try {
		const res = await sh(`cd ${__dirname}; git show --format="%H" --no-patch | git describe --tags`)
		return res.stdout.split('\n')[0] || 'v0.0.0'
	} catch (err) {
		return 'v0.0.0'
	}
}
