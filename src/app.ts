import os from 'os'
import { exec } from 'child_process'
import chalk from 'chalk'
import { BlihApi } from './blih_api'
import { ask_list, ask_email, ask_password, ask_question, spin } from './ui'
import {
	ConfigType,
	IS_DEBUG,
	APP_VERSION,
	open_config,
	write_config,
	clor,
	print_message,
	sh_live,
} from './utils'
import { git_menu } from './git_menu'
import { repo_menu, create_repo, acl_menu } from './repository_menu'
import { key_menu } from './key_menu'
import { timeline_menu } from './timeline_menu'
import { options_menu } from './options_menu'

export const run = async () => {
	process.title = 'blih cli'
	if (process.argv.length > 2) await parse_args(process.argv)
	const config = open_config()

	if (!IS_DEBUG && config.check_update) check_update(await APP_VERSION)
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
	if (IS_DEBUG) console.log(`DEBUG VERSION, skip: ${process.env.BLIH_CLI_CONFIG_SKIP}`)
	const api = await login(config)
	if (config.args) await fast_mode(api, config)
	process.stdin.on('keypress', async (str, key) => {
		if (key.ctrl && key.name === 'l') {
			console.clear()
		}
		//TODO if (key.name === 'escape')
	})

	let should_quit = false
	const choices = [
		'Git clone',
		'Repositories management',
		'Keys management',
		'Timeline explorer',
		'Contacts list',
		'Options',
		'Exit',
	]
	while (!should_quit) {
		const choice = await ask_list(choices, "Let's do some works")

		switch (choice) {
			case choices[0]:
				await git_menu(api, config)
				break
			case choices[1]:
				await repo_menu(api, config)
				break
			case choices[2]:
				await key_menu(api)
				break
			case choices[3]:
				await timeline_menu(config)
				break
			case choices[4]:
				await show_contact(config)
				break
			case choices[5]:
				await options_menu(config)
				break
			case choices[6]:
			default:
				should_quit = true
		}
	}
	await write_config(config.to_json())
}

async function login(config: ConfigType) {
	let api
	let error = false
	const spinner = spin({ color: 'blue' }).start(chalk.green('Check Blih server...'))

	try {
		let time = 0
		if (!process.env.BLIH_CLI_CONFIG_SKIP) time = await BlihApi.ping()
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
			if (!process.env.BLIH_CLI_CONFIG_SKIP)
				config.repo = (await api.listRepositories()).map((value) => value.name)
			error = false
			spinner.stop()
		} catch (err) {
			spinner.stop()
			print_message('Fail to login', err, 'fail')
			if (err === 'Bad token') config.email = ''
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
				if (!config.contact.some((value) => value === new_address)) {
					config.contact.push(new_address)
					config.contact = config.contact
				}
				break
			default:
				const valid = await ask_question(`Remove ${choice} ?`)
				if (valid) {
					config.contact = config.contact.filter((value) => value !== choice)
				}
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
		if (config.args[2] === '-a') await acl_menu(api, config, config.args[3])
		else await acl_menu(api, config, config.args[2].substr(6))
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
		if (args[2] === '-d' || args[2] === '-D' || args[2] === '--debug') {
			console.log(IS_DEBUG ? 'true' : 'false')
			process.exit(0)
		}
		if (args[2] === '-u' || args[2] === '-U' || args[2] === '--update' || args[2] === '--UPDATE') {
			if (IS_DEBUG) await sh_live(`sudo sh ${__dirname}/../update.sh`)
			else console.log('Use: `sudo npm up blih_cli -g`')
			process.exit(0)
		}
		if (args[2] === '--uninstall') {
			if (IS_DEBUG) {
				if (!(await ask_question('Uninstall blih_cli ?'))) process.exit(0)
				await sh_live(`sudo sh ${__dirname}/../uninstall.sh`)
			} else console.log('Use: `sudo npm un blih_cli -g`')
			process.exit(0)
		}
		if (!IS_DEBUG) return
		if (args[2] === '--snapshot') {
			await sh_live(`sudo sh ${__dirname}/../update.sh snapshot`)
			process.exit(0)
		}
	}
}

function show_help() {
	spin().info(
		clor.info('Invalid option\n  Usage blih_cli -[aci] [OPTION]...' + '\n  or use `man blih_cli`')
	)
}

function check_update(current: string) {
	if (os.type() === 'Linux' || os.type().match(/BSD$/)) {
		exec('npm v blih_cli@latest version --silent', (err, stdout, stderr) => {
			if (err || !stdout) return
			if ('v' + stdout !== current) {
				// prettier-ignore
				exec(`notify-send "New update available" "Try 'sudo npm up blih_cli -g' to update" -i "${__dirname}/../logo.png" -a "blih cli" -t 10000`)
			}
		})
	}
}
