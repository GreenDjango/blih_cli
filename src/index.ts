//import ora from 'ora'
import chalk from 'chalk'
import fs from 'fs'
import { BlihApi } from './blih_api'
import { ask_list, ask_email, ask_password } from './ui'

const CONFIG_FILE = __dirname + '/.cli_data.json'

type ConfigType = { email: string; password: string; save_password: boolean }

export const run = async () => {
	let config = open_config()
	let choice

	console.log(chalk.red(`   ___  ___ __     _______   ____`))
	console.log(chalk.green(`  / _ )/ (_) /    / ___/ /  /  _/`))
	console.log(chalk.blueBright(` / _  / / / _ \\  / /__/ /___/ /`))
	console.log(chalk.yellow(`/____/_/_/_//_/  \\___/____/___/\n`))
	const api = await login(config)
	while (1) {
		choice = await ask_list(['Repo manage', 'Key manage', 'Option', 'Exit'], "Let's do some works")
		api
		if (choice === 'Exit') {
			break
		}
	}
	write_config(config)
}

async function login(config: ConfigType) {
	let api: BlihApi = new BlihApi({ email: '1', password: '1' })
	let error = false

	try {
		print_message('Blih server up: ' + (await api.ping()) + 'ms', '', 'message')
	} catch (err) {
		print_message('Blih server down', '', 'fail')
		process.exit(2)
	}
	do {
		if (!config.email) {
			config.email = await ask_email()
		}
		print_message('Login with: ' + config.email, '', 'message')
		if (!config.password) {
			config.password = await ask_password()
		}
		try {
			api = new BlihApi({ email: config.email, password: config.password })
			await api.listKeys()
			error = false
		} catch (err) {
			print_message('Fail to login', err, 'fail')
			config.email = ''
			config.password = ''
			error = true
		}
	} while (error)
	return api
}

function open_config() {
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
	const parse_config: ConfigType = { email: '', password: '', save_password: false }

	if (config.email && regex_email.test(config.email)) {
		parse_config.email = config.email
	}
	if (config.password) {
		parse_config.password = config.password
	}
	if (config.save_password) {
		parse_config.save_password = true
	}

	return parse_config
}

function write_config(config: ConfigType) {
	if (!config.save_password) {
		config.password = ''
	}
	try {
		const config_json = JSON.stringify(config, undefined, 4)
		fs.writeFileSync(CONFIG_FILE, config_json, 'utf8')
	} catch (err) {
		print_message('Fail to save config file', err, 'error')
	}
}

function print_message(title: string, message: string, level: 'message' | 'fail' | 'error') {
	if (level == 'error') {
		console.error(chalk.redBright.bold(title))
		throw new Error(chalk.redBright(message))
	} else if (level == 'fail') {
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
