import chalk from 'chalk'
import { homedir } from 'os'
import fs from 'fs'
import type { BlihApi } from './blih_api'
import { ask_list, ask_question, ask_path, ask_input, spin } from './ui'
import { clor, WAIT_MSG, sh } from './utils'

const HOME_DIR = homedir()

export async function key_menu(api: BlihApi) {
	let should_quit = false
	const choices = [
		'↵ Back',
		'Add key',
		'Delete key',
		'Show keys list',
		'Add Epitech to known hosts',
	]

	while (!should_quit) {
		const choice = await ask_list(choices, 'Manage your SSH keys')
		switch (choice) {
			case choices[1]:
				await add_key(api)
				break
			case choices[2]:
				await delete_key(api)
				break
			case choices[3]:
				await show_key(api)
				break
			case choices[4]:
				await add_host()
				break
			case choices[0]:
			default:
				should_quit = true
		}
	}
}

async function add_key(api: BlihApi) {
	const new_ssh = await ask_question('Create new ssh key ?')
	const spinner = spin({ color: 'blue' })

	try {
		let path = ''
		if (new_ssh) {
			let name = 'epitech_key'
			if (fs.existsSync(`${HOME_DIR}/.ssh/${name}.pub`)) {
				do {
					name = await ask_input(`${name} already exist, new Key name ?`)
				} while (fs.existsSync(`${HOME_DIR}/.ssh/${name}.pub`))
			}
			if (!fs.existsSync(`${HOME_DIR}/.ssh`)) {
				fs.mkdirSync(`${HOME_DIR}/.ssh`)
			}
			spinner.start(chalk.green(WAIT_MSG))
			await sh(`ssh-keygen -f ${HOME_DIR}/.ssh/${name} -N ""`)
			await sh(`ssh-add ${HOME_DIR}/.ssh/${name}`)
			path = `${HOME_DIR}/.ssh/${name}.pub`
		} else {
			path = await ask_path('Ssh key path:', '\\.pub$', `${HOME_DIR}/`)
			spinner.info(clor.info('Use `ssh-add ' + path + '` for enable the key'))
			spinner.start(chalk.green(WAIT_MSG))
		}
		let key = fs.readFileSync(path, 'utf8')
		key = key.replace('\n', '')
		const res = await api.uploadKey(key)
		spinner.succeed(chalk.green(res))
	} catch (err) {
		spinner.fail(chalk.red(err))
	}
}

async function delete_key(api: BlihApi) {
	const spinner = spin({ color: 'blue' }).start(chalk.green(WAIT_MSG))

	try {
		const key_list = await api.listKeys()
		spinner.stop()
		const choice = await ask_list(
			['↵ Back', ...key_list.map((value) => value.name + ' ...' + value.data.substr(-20))],
			'Select a key'
		)
		if (choice === '↵ Back' || !(await ask_question('Are you sure ?'))) return
		const key = choice.split(' ')[0]
		if (key === undefined) return
		spinner.start(chalk.green(WAIT_MSG))
		const res = await api.deleteKey(key)
		spinner.succeed(chalk.green(res))
	} catch (err) {
		spinner.fail(chalk.red(err))
	}
}

async function show_key(api: BlihApi) {
	const spinner = spin({ color: 'blue' }).start(chalk.green(WAIT_MSG))

	try {
		const key_list = await api.listKeys()
		spinner.stop()
		const idx = await ask_list(
			['↵ Back', ...key_list.map((value) => value.name + ' ...' + value.data.substr(-20))],
			undefined,
			true
		)
		if (idx === '0') return
		const key = key_list[+idx - 1]
		spinner.info(clor.info(`Name:		${key?.name}` + `\n  Data:		${key?.data}`))
	} catch (err) {
		spinner.fail(chalk.red(err))
	}
}

async function add_host() {
	const spinner = spin({ color: 'blue' }).start(chalk.green(WAIT_MSG))

	try {
		await sh('ssh -o StrictHostKeyChecking=no git@git.epitech.eu uptime; [ 128 = $? ]')
		spinner.succeed(chalk.green("'git.epitech.eu' add to known hosts"))
	} catch (err) {
		spinner.fail(chalk.red(err))
	}
}
