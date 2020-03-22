import ora from 'ora'
import chalk from 'chalk'
import { BlihApi } from './blih_api'
import { ask_list, ask_question, ask_input, ask_qcm, ask_autocomplete } from './ui'
import { ConfigType, WAIT_MSG } from './utils'
import { clone_repo } from './git_menu'

type ACLType = { name: string; rights: string }

export async function repo_menu(api: BlihApi, config: ConfigType) {
	let should_quit = false

	while (!should_quit) {
		const choices = [
			'↵ Back',
			'Create repository',
			'Delete repository',
			'Change ACL',
			'Show repositories list',
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
				await show_repo(api, config)
				break
			case choices[0]:
			default:
				should_quit = true
		}
	}
}

export async function create_repo(api: BlihApi, config: ConfigType, repo_name?: string) {
	const input = repo_name || (await ask_input('Repository name'))
	const spinner = ora().start(chalk.green(WAIT_MSG))
	try {
		let res = await api.createRepository(input)
		config.repo.push(input)
		spinner.succeed(chalk.green(res))
		if (config.auto_acl) {
			spinner.start(chalk.green(WAIT_MSG))
			res = await api.setACL(input, 'ramassage-tek', 'r')
			spinner.succeed(chalk.green(res + ' (ramassage-tek)'))
		}
		await change_acl(api, config, input)
		if (await ask_question(`Git clone ${input} ?`)) await clone_repo(api, input, config.email)
	} catch (err) {
		spinner.fail(chalk.red(err))
	}
}

async function delete_repo(api: BlihApi, config: ConfigType) {
	const to_delete = await ask_autocomplete(['↵ Back', ...config.repo], undefined, true)
	if (to_delete === '↵ Back') return
	const valid = await ask_question(`Delete ${to_delete} ?`)

	if (valid) {
		const spinner = ora().start(chalk.green(WAIT_MSG))
		try {
			const res = await api.deleteRepository(to_delete)
			config.repo = config.repo.filter(value => value !== to_delete)
			spinner.succeed(chalk.green(res))
		} catch (err) {
			spinner.fail(chalk.red(err))
		}
	}
}

export async function change_acl(api: BlihApi, config: ConfigType, repo_name?: string) {
	const to_acl = repo_name || (await ask_autocomplete(['↵ Back', ...config.repo], undefined, true))
	if (to_acl === '↵ Back') return
	const spinner = ora().start(chalk.green(WAIT_MSG))

	try {
		let acl_list = await api.getACL(to_acl)
		spinner.stop()
		let acl = await acl_menu(acl_list, config)
		while (acl) {
			spinner.start(chalk.green(WAIT_MSG))
			const res = await api.setACL(to_acl, acl.name, acl.rights)
			acl_list = await api.getACL(to_acl)
			spinner.succeed(chalk.green(res) + ' ' + acl_to_string(acl))
			acl = await acl_menu(acl_list, config)
		}
	} catch (err) {
		spinner.fail(chalk.red(err))
	}
}

async function acl_menu(acl_list: ACLType[], config: ConfigType) {
	const ask = ['↵ Back', 'Add', ...acl_list.map(value => acl_to_string(value))]
	const idx = await ask_list(ask, 'Give ACL', true)

	if (idx === '0') return null
	if (idx === '1') return await ask_acl(config)
	const acl = acl_list[+idx - 2]
	acl.rights = (
		await ask_qcm(['Read', 'Write', 'Admin'], ['r', 'w', 'a'], acl_to_bool(acl), acl.name)
	).join('')
	return acl
}

async function ask_acl(config: ConfigType) {
	const user = await ask_autocomplete(['ramassage-tek', ...config.contact], 'Enter new email')
	const rights = (
		await ask_qcm(['Read', 'Write', 'Admin'], ['r', 'w', 'a'], [false, false, false], user)
	).join('')
	if (user !== 'ramassage-tek' && !config.contact.some(value => value === user)) {
		config.contact.push(user)
		config.contact = config.contact
	}
	return { name: user, rights } as ACLType
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

async function show_repo(api: BlihApi, config: ConfigType) {
	const repo = await ask_autocomplete(['↵ Back', ...config.repo], undefined, true)
	if (repo === '↵ Back') return
	const spinner = ora().start(chalk.green(WAIT_MSG))

	try {
		const repo_info = await api.repositoryInfo(repo)
		const creation_date = new Date(0)
		creation_date.setUTCSeconds(repo_info.creation_time)
		const repo_acl = (await api.getACL(repo)).map(value => `${value.name} - ${value.rights}`)
		if (!repo_acl.length) repo_acl.push('no sharing')
		spinner.info(
			chalk.blue(
				`Name:		${repo_info.name}` +
					`\n  Uuid:		${repo_info.uuid}` +
					`\n  Url:		${repo_info.url}` +
					`\n  Creation:	${creation_date.toLocaleString()}` +
					`\n  Public:	${repo_info.public}` +
					`\n  Share:	${repo_acl.join('\n		')}`
			)
		)
	} catch (err) {
		spinner.fail(chalk.red(err))
	}
}
