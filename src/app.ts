import ora from 'ora'
import chalk from 'chalk'
import { BlihApi } from './blih_api'
import { ask_list, ask_email, ask_password, ask_question } from './ui'
import { ConfigType, APP_VERSION, open_config, write_config, print_message } from './utils'
import { repo_menu, create_repo, change_acl } from './repository_menu'
import { key_menu } from './key_menu'

export const run = async () => {
	const config = open_config()
	let choice
	let should_quit = false
	if (process.argv.length < 3) {
		console.log(chalk.red(`   ___  ___ __     _______   ____`))
		console.log(chalk.green(`  / _ )/ (_) /    / ___/ /  /  _/`))
		console.log(chalk.blueBright(` / _  / / / _ \\  / /__/ /___/ /`))
		console.log(
			chalk.yellow(`/____/_/_/_//_/  \\___/____/___/`) + chalk.grey.italic(`  v${APP_VERSION}\n`)
		)
	}
	const api = await login(config)
	if (process.argv.length > 2) await parse_arg(api, config)
	while (!should_quit) {
		choice = await ask_list(
			['Repositories management', 'Key management', 'Contact', 'Option', 'Exit'],
			"Let's do some works"
		)
		switch (choice) {
			case 'Repositories management':
				await repo_menu(api, config)
				break
			case 'Key management':
				await key_menu(api)
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
			`Auto Ramassage-tek ACL: ${config.auto_acl ? chalk.green.bold('✔') : chalk.red.bold('✗')}`,
			'Reset all contact',
		]
		const choice = await ask_list(choices, 'You want options ?')
		switch (choice) {
			case choices[1]:
				config.save_token = !config.save_token
				break
			case choices[2]:
				config.auto_acl = !config.auto_acl
				break
			case choices[3]:
				const valid = await ask_question(`Are you sure ?`)
				if (valid) config.contact = []
				break
			case choices[0]:
			default:
				should_quit = true
		}
	}
}

async function parse_arg(api: BlihApi, config: ConfigType) {
	if (process.argv[2] === '-c' || process.argv[2] === '--create') {
		await create_repo(api, config, process.argv[3])
	} else if (process.argv[2] === '-a' || process.argv[2].substr(0, 6) === '--acl=') {
		if (process.argv[2] === '-a') await change_acl(api, config, process.argv[3])
		else await change_acl(api, config, process.argv[2].substr(6))
	} else show_help()
}

function show_help() {
	ora().info(
		chalk.blue(
			'Invalid option\n  Usage blih_cli -[ca] [OPTION]...' +
				'\n    -c, --create		create new repository' +
				'\n    -a [REPO], --acl=REPO	change repository acl'
		)
	)
}
