import ora from 'ora'
import chalk from 'chalk'
import fs from 'fs'
import { BlihApi } from './blih_api'
import { ask_list, ask_email, ask_password, ask_question, ask_input } from './ui'

const CONFIG_FILE = __dirname + '/.cli_data.json'

type ConfigType = {
	email: string
	token: string
	save_token: boolean
	contact: string[]
	repo: string[]
}

export const run = async () => {
	const config = open_config()
	let choice
	let should_quit = false

	console.log(chalk.red(`   ___  ___ __     _______   ____`))
	console.log(chalk.green(`  / _ )/ (_) /    / ___/ /  /  _/`))
	console.log(chalk.blueBright(` / _  / / / _ \\  / /__/ /___/ /`))
	console.log(chalk.yellow(`/____/_/_/_//_/  \\___/____/___/\n`))
	const api = await login(config)
	while (!should_quit) {
		choice = await ask_list(
			['Repositories management', 'Key management', 'Contact', 'Option', 'Exit'],
			"Let's do some works"
		)
		api
		switch (choice) {
			case 'Repositories management':
				await repo_menu(api, config)
				break
			case 'Key management':
				break
			case 'Contact':
				await show_contact(config)
				break
			case 'Option':
				await option_menu(config)
				break
			case 'Exit':
			default:
				should_quit = true
		}
	}
	write_config(config)
}

async function login(config: ConfigType) {
	let api: BlihApi = new BlihApi({ email: '1', password: '1' })
	let error = false
	const spinner = ora().start(chalk.green('Check Blih server...'))

	spinner.color = 'blue'
	try {
		const time = await api.ping()
		spinner.succeed(chalk.green('Blih server up: ') + chalk.cyan(time + 'ms'))
	} catch (err) {
		spinner.stop()
		print_message('Blih server down', '', 'fail')
		process.exit(2)
	}
	do {
		if (!config.email) {
			config.email = await ask_email()
		}
		print_message(`Login with: ${chalk.cyan(config.email)}`, '', 'message')
		if (!config.token) {
			config.token = api.hashPassword(await ask_password())
		}
		spinner.start(chalk.green('Try to login...'))
		try {
			api = new BlihApi({ email: config.email, token: config.token })
			config.repo = (await api.listRepositories()).map(value => value.name)
			error = false
			spinner.stop()
		} catch (err) {
			spinner.stop()
			print_message('Fail to login', err, 'fail')
			config.email = ''
			config.token = ''
			error = true
		}
	} while (error)

	return api
}

async function repo_menu(api: BlihApi, config: ConfigType) {
	let should_quit = false

	while (!should_quit) {
		const choices = ['↵ Back', 'Create repository', 'Delete repository']
		const choice = await ask_list(choices, 'Repository')
		switch (choice) {
			case choices[1]:
				const input = await ask_input('Repository name')
				const spinner = ora().start(chalk.green('Process...'))
				try {
					const res = await api.createRepository(input)
					config.repo.push(input)
					spinner.succeed(chalk.green(res))
				} catch (err) {
					spinner.fail(chalk.red(err))
				}
				break
			case choices[2]:
				const to_delete = await ask_list(config.repo)
				const valid = await ask_question(`Delete ${to_delete} ?`)
				if (valid) {
					const spinner = ora().start(chalk.green('Process...'))
					try {
						const res = await api.deleteRepository(to_delete)
						config.repo = config.repo.filter(value => value !== to_delete)
						spinner.succeed(chalk.green(res))
					} catch (err) {
						spinner.fail(chalk.red(err))
					}
					spinner.stop()
				}
				break
			case choices[0]:
			default:
				should_quit = true
		}
	}
}

async function show_contact(config: ConfigType) {
	let should_quit = false

	while (!should_quit) {
		const choices = [...config.contact]
		choices.unshift('Add email')
		choices.unshift('↵ Back')
		const choice = await ask_list(choices, 'Some friends')
		switch (choice) {
			case choices[0]:
				should_quit = true
				break
			case choices[1]:
				const new_address = await ask_email()
				if (!config.contact.some(value => value === new_address)) {
					config.contact.push(new_address)
				}
				break
			default:
				const valid = await ask_question(`Remove ${choice} ?`)
				if (valid) {
					config.contact = config.contact.filter(value => value !== choice)
				}
		}
	}
}

async function option_menu(config: ConfigType) {
	let should_quit = false

	while (!should_quit) {
		const choices = [
			'↵ Back',
			`Remember password: ${config.save_token ? chalk.green.bold('✔') : chalk.red.bold('✗')}`,
			'Reset all contact',
		]
		const choice = await ask_list(choices, 'You want options ?')
		switch (choice) {
			case choices[1]:
				config.save_token = !config.save_token
				break
			case choices[2]:
				const valid = await ask_question(`Are you sure ?`)
				if (valid) config.contact = []
				break
			case choices[0]:
			default:
				should_quit = true
		}
	}
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
	const new_config: ConfigType = { email: '', token: '', save_token: false, contact: [], repo: [] }

	if (config.email && regex_email.test(config.email)) {
		new_config.email = config.email
	}
	if (config.token) {
		new_config.token = config.token
	}
	if (config.save_token) {
		new_config.save_token = true
	}
	if (config.contact) {
		new_config.contact = config.contact
	}

	return new_config
}

function write_config(config: ConfigType) {
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

function print_message(title: string, message: string, level: 'message' | 'fail' | 'error') {
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
