import ora from 'ora'
import chalk from 'chalk'
import { BlihApi } from './blih_api'
import { ask_list, ask_question, ask_input, ask_qcm, ask_autocomplete } from './ui'
import { ConfigType } from './utils'

type ACLType = { name: string; rights: string }

export async function repo_menu(api: BlihApi, config: ConfigType) {
	let should_quit = false

	while (!should_quit) {
		const choices = [
			'↵ Back',
			'Create repository',
			'Delete repository',
			'Change ACL',
			'Repositories list',
		]
		const choice = await ask_list(choices, 'Repository')
		switch (choice) {
			case choices[1]:
				await create_repo(api, config)
				break
			case choices[2]:
				await delete_repo(api, config)
				break
			case choices[3]:
				await change_acl(api, config)
				break
			case choices[4]:
				await show_repo(config)
				break
			case choices[0]:
			default:
				should_quit = true
		}
	}
}

async function create_repo(api: BlihApi, config: ConfigType) {
	const input = await ask_input('Repository name')
	const spinner = ora().start(chalk.green('Process...'))
	try {
		let res = await api.createRepository(input)
		config.repo.push(input)
		spinner.succeed(chalk.green(res))
		const acl_list: ACLType[] = []
		if (config.auto_acl) {
			spinner.start(chalk.green('Process...'))
			res = await api.setACL(input, 'ramassage-tek', 'r')
			spinner.succeed(chalk.green(res + ' (ramassage-tek)'))
			acl_list.push({ name: 'ramassage-tek', rights: 'r' })
		}
		let to_change = await acl_menu(acl_list, config)
		while (to_change.length) {
			spinner.start(chalk.green('Process...'))
			const res2 = await api.setACL(input, to_change[0], to_change[1])
			spinner.succeed(
				chalk.green(res2) + ' ' + acl_to_string({ name: to_change[0], rights: to_change[1] })
			)
			to_change = await acl_menu(acl_list, config)
		}
	} catch (err) {
		spinner.fail(chalk.red(err))
	}
}

async function delete_repo(api: BlihApi, config: ConfigType) {
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
	}
}

async function change_acl(api: BlihApi, config: ConfigType) {
	const to_acl = await ask_list(config.repo)
	const spinner = ora().start(chalk.green('Process...'))
	try {
		const acl_list = await api.getACL(to_acl)
		spinner.stop()
		let to_change = await acl_menu(acl_list, config)
		while (to_change.length) {
			spinner.start(chalk.green('Process...'))
			const res = await api.setACL(to_acl, to_change[0], to_change[1])
			spinner.succeed(
				chalk.green(res) + ' ' + acl_to_string({ name: to_change[0], rights: to_change[1] })
			)
			to_change = await acl_menu(acl_list, config)
		}
	} catch (err) {
		spinner.fail(chalk.red(err))
	}
}

async function acl_menu(acl_list: ACLType[], config: ConfigType) {
	const ask = ['↵ Back', 'Add', ...acl_list.map(value => acl_to_string(value))]
	const user = (await ask_list(ask, 'Give ACL')).split(' ', 1)[0]
	if (user === '↵') {
		return []
	}
	if (user === 'Add') {
		const res = await ask_acl(config)
		acl_list.push({ name: res[0], rights: res[1] })
		return res
	}
	const idx = acl_list.findIndex(value => value.name === user)
	const to_change = (await ask_qcm(
		['Read', 'Write', 'Admin'],
		['r', 'w', 'a'],
		acl_to_bool(acl_list[idx]),
		user
	)).join('')
	acl_list[idx].rights = to_change
	return [user, to_change]
}

async function ask_acl(config: ConfigType) {
	const user = await ask_autocomplete('Enter new email', ['ramassage-tek', ...config.contact])
	const rights = (await ask_qcm(
		['Read', 'Write', 'Admin'],
		['r', 'w', 'a'],
		[false, false, false],
		user
	)).join('')
	return [user, rights]
}

function acl_to_string(acl: ACLType) {
	let rights = acl.rights[0] ? chalk.bold(acl.rights[0]) : '-'
	rights += acl.rights[1] ? chalk.bold(acl.rights[1]) : '-'
	rights += acl.rights[2] ? chalk.bold(acl.rights[2]) : '-'
	return `${acl.name} ${rights}`
}

function acl_to_bool(acl: ACLType) {
	const rights = [acl.rights[0] ? true : false]
	rights.push(acl.rights[1] ? true : false)
	rights.push(acl.rights[2] ? true : false)
	return rights
}

async function show_repo(config: ConfigType) {
	await ask_list(config.repo)
}