import chalk from 'chalk'
import fs from 'fs'
import { exec } from 'child_process'

const CONFIG_FILE = __dirname + '/.cli_data.json'
export const APP_VERSION = '0.1.0'
export const WAIT_MSG = 'Process...'

export type ConfigType = {
	email: string
	token: string
	save_token: boolean
	auto_acl: boolean
	contact: string[]
	repo: string[]
}

export function open_config() {
	let config
	try {
		if (fs.existsSync(CONFIG_FILE)) {
			const config_file = fs.readFileSync(CONFIG_FILE, 'utf8')
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
	const new_config: ConfigType = {
		email: '',
		token: '',
		save_token: false,
		auto_acl: true,
		contact: [],
		repo: [],
	}

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
	if (config.contact) {
		new_config.contact = config.contact
	}

	return new_config
}

export function write_config(config: ConfigType) {
	if (!config.save_token) {
		config.token = undefined as any
	}
	config.repo = undefined as any
	try {
		const config_json = JSON.stringify(config, undefined, 4)
		fs.writeFileSync(CONFIG_FILE, config_json, 'utf8')
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
