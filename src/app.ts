import ora from 'ora'
import chalk from 'chalk'
import { BlihApi } from './blih_api'
import { ask_list, ask_email, ask_password, ask_question } from './ui'
import { ConfigType, APP_VERSION, open_config, write_config, print_message, sh_live } from './utils'
import { git_menu } from './git_menu'
import { repo_menu, create_repo, change_acl } from './repository_menu'
import { key_menu } from './key_menu'

export const run = async () => {
	if (process.argv.length > 2) await parse_args(process.argv)
	const config = open_config()

	if (process.argv.length > 2) config.args = process.argv
	if (config.verbose && !config.args) {
		console.log(chalk.red(`   ___  ___ __     _______   ____`))
		console.log(chalk.green(`  / _ )/ (_) /    / ___/ /  /  _/`))
		console.log(chalk.blueBright(` / _  / / / _ \\  / /__/ /___/ /`))
		console.log(
			chalk.yellow(`/____/_/_/_//_/  \\___/____/___/`) +
				chalk.grey.italic(`  ${await APP_VERSION}\n`)
		)
	}
	const api = await login(config)
	if (config.args) await fast_mode(api, config)
	process.stdin.on('keypress', (str, key) => {
		if (key.ctrl && key.name === 'l') console.clear()
	})

	let should_quit = false
	while (!should_quit) {
		const choice = await ask_list(
			['Git clone', 'Repositories management', 'Key management', 'Contact', 'Option', 'Exit'],
			"Let's do some works"
		)

		switch (choice) {
			case 'Git clone':
				await git_menu(api, config)
				break
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
	await write_config(config.to_json())
}

async function login(config: ConfigType) {
	let api
	let error = false
	const spinner = ora().start(chalk.green('Check Blih server...'))

	spinner.color = 'blue'
	try {
		const time = await BlihApi.ping()
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
			config.token = BlihApi.hashPassword(await ask_password())
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
	} while (error || !api)
	if (config.verbose && !config.args) {
		print_message(`Found ${chalk.cyan(config.repo.length)} repositories`, '', 'message')
	}

	return api
}

async function show_contact(config: ConfigType) {
	let should_quit = false

	while (!should_quit) {
		const choices = [...config.contact]
		choices.unshift('Add email')
		choices.unshift('↵ Back')
		const choice = await ask_list(choices, 'Some friends (email is auto add)')
		switch (choice) {
			case choices[0]:
				should_quit = true
				break
			case choices[1]:
				const new_address = await ask_email()
				if (!config.contact.some(value => value === new_address)) {
					config.contact.push(new_address)
					config.contact = config.contact
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
			`Mode verbose: ${config.verbose ? chalk.green.bold('✔') : chalk.red.bold('✗')}`,
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
				config.verbose = !config.verbose
				break
			case choices[4]:
				const valid = await ask_question(`Are you sure ?`)
				if (valid) config.contact = []
				break
			case choices[0]:
			default:
				should_quit = true
		}
	}
}

async function fast_mode(api: BlihApi, config: ConfigType) {
	if (!config.args) return
	if (config.args[2] === '-i') {
		return
	} else if (config.args[2] === '-c') {
		await create_repo(api, config, config.args[3])
	} else if (config.args[2] === '-a' || config.args[2].substr(0, 6) === '--acl=') {
		if (config.args[2] === '-a') await change_acl(api, config, config.args[3])
		else await change_acl(api, config, config.args[2].substr(6))
	} else show_help()
}

async function parse_args(args: string[]) {
	if (args[2]) {
		if (args[2] === '-h' || args[2] === '-H' || args[2] === '--help') {
			await sh_live('man blih_cli')
			process.exit(0)
		}
		if (args[2] === '-v' || args[2] === '-V' || args[2] === '--version') {
			console.log(await APP_VERSION)
			process.exit(0)
		}
		if (args[2] === '-u' || args[2] === '-U' || args[2] === '--update' || args[2] === '--UPDATE') {
			await sh_live(`sudo sh ${__dirname}/../update.sh`)
			process.exit(0)
		}
		if (args[2] === '--snapshot') {
			await sh_live(`sudo sh ${__dirname}/../update.sh snapshot`)
			process.exit(0)
		}
		if (args[2] === '--uninstall') {
			if (!(await ask_question('Uninstall blih_cli ?'))) process.exit(0)
			await sh_live(`sudo sh ${__dirname}/../uninstall.sh`)
			process.exit(0)
		}
	}
}

function show_help() {
	ora().info(
		chalk.blue('Invalid option\n  Usage blih_cli -[aci] [OPTION]...' + '\n  or use `man blih_cli`')
	)
}
