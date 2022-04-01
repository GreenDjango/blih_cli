import chalk from 'chalk'
import { BlihApi, ACL } from './blih_api'
import {
	ask_list,
	ask_list_index,
	ask_question,
	ask_input,
	ask_qcm,
	ask_autocomplete,
	spin,
} from './ui'
import { md_parser } from './markdown_parser'
import { ConfigType, clor, sh, WAIT_MSG } from './utils'
import { clone_repo } from './git_menu'

type ACLType = ACL & { rights_bool: boolean[]; rights_str: string }

export async function repo_menu(api: BlihApi, config: ConfigType) {
	let should_quit = false
	const choices = [
		'↵ Back',
		'Create repository',
		'Delete repository',
		'Change ACL',
		'Show repositories list',
		'Show repository preview',
	]

	while (!should_quit) {
		const choice = await ask_list(choices, 'Repository')
		switch (choice) {
			case choices[1]:
				await create_repo(api, config)
				break
			case choices[2]:
				await delete_repo(api, config)
				break
			case choices[3]:
				await acl_menu(api, config)
				break
			case choices[4]:
				await show_repo_info(api, config)
				break
			case choices[5]:
				await show_repo_preview(config)
				break
			case choices[0]:
			default:
				should_quit = true
		}
	}
}

export async function create_repo(api: BlihApi, config: ConfigType, repo_name?: string) {
	const input = repo_name || (await ask_input('Repository name'))
	const spinner = spin().start(chalk.green(WAIT_MSG))
	try {
		let res = await api.createRepository(input)
		config.repo.push(input)
		spinner.succeed(chalk.green(res))
		if (config.auto_acl) {
			spinner.start(chalk.green(WAIT_MSG))
			res = await api.setACL(input, 'ramassage-tek', 'r')
			spinner.succeed(chalk.green(res + ' (ramassage-tek)'))
		}
		await acl_menu(api, config, input)
		if (await ask_question(`Git clone ${input} ?`)) await clone_repo(input, config.email)
	} catch (err) {
		spinner.fail(chalk.red(err))
	}
}

async function delete_repo(api: BlihApi, config: ConfigType) {
	const to_delete = await ask_autocomplete(['↵ Back', ...config.repo], undefined, true)
	if (to_delete === '↵ Back') return
	const valid = await ask_question(`Delete ${to_delete} ?`)

	if (valid) {
		const spinner = spin().start(chalk.green(WAIT_MSG))
		try {
			const res = await api.deleteRepository(to_delete)
			config.repo = config.repo.filter((value) => value !== to_delete)
			spinner.succeed(chalk.green(res))
		} catch (err) {
			spinner.fail(chalk.red(err))
		}
	}
}

export async function acl_menu(api: BlihApi, config: ConfigType, repo_name?: string) {
	const repo = repo_name || (await ask_autocomplete(['↵ Back', ...config.repo], undefined, true))
	if (repo === '↵ Back') return
	const spinner = spin().start(chalk.green(WAIT_MSG))

	try {
		let acl_list = (await api.getACL(repo)).map((val) => to_ACL(val))
		spinner.stop()
		let acl = await change_acl(acl_list, config)
		while (acl) {
			spinner.start(chalk.green(WAIT_MSG))
			const res = await api.setACL(repo, acl.name, acl.rights)
			acl_list = (await api.getACL(repo)).map((val) => to_ACL(val))
			spinner.succeed(chalk.green(res) + ` ${acl.name} ${acl.rights_str}`)
			acl = await change_acl(acl_list, config)
		}
	} catch (err) {
		spinner.fail(chalk.red(err))
	}
}

async function change_acl(acl_list: ACLType[], config: ConfigType) {
	const ask = [
		{ name: '↵ Back', value: undefined, short: '↵ Back' },
		{ name: 'Add', value: 'ADD', short: 'Add' },
		...acl_list.map((val) => {
			const to_show = `${val.name} ${val.rights_str}`
			return { name: to_show, value: val, short: to_show }
		}),
	] as { name: string; value: ACLType | string | undefined; short: string }[]

	const acl = await ask_list_index(ask, 'Give ACL')
	if (!acl) return undefined
	if (typeof acl === 'string') return await ask_acl(config)

	const rights = (
		await ask_qcm(['Read', 'Write', 'Admin'], ['r', 'w', 'a'], acl.rights_bool, acl.name)
	).join('')
	return to_ACL({ name: acl.name, rights })
}

async function ask_acl(config: ConfigType): Promise<ACLType> {
	const user = await ask_autocomplete(['ramassage-tek', ...config.contact], 'Enter new email')
	const rights = (
		await ask_qcm(['Read', 'Write', 'Admin'], ['r', 'w', 'a'], [false, false, false], user)
	).join('')
	if (user !== 'ramassage-tek' && !config.contact.some((value) => value === user)) {
		config.contact.push(user)
		config.contact = config.contact
	}
	return to_ACL({ name: user, rights })
}

function to_ACL(acl: ACL): ACLType {
	const new_r = {
		...acl,
		rights_bool: [acl.rights.includes('r'), acl.rights.includes('w'), acl.rights.includes('a')],
		rights_str: chalk.bold('deleted'),
	}
	if (new_r.rights_bool[0] || new_r.rights_bool[1] || new_r.rights_bool[2]) {
		new_r.rights_str = new_r.rights_bool[0] ? chalk.bold('r') : '-'
		new_r.rights_str += new_r.rights_bool[1] ? chalk.bold('w') : '-'
		new_r.rights_str += new_r.rights_bool[2] ? chalk.bold('a') : '-'
	}
	return new_r
}

async function show_repo_info(api: BlihApi, config: ConfigType) {
	const repo = await ask_autocomplete(['↵ Back', ...config.repo], undefined, true)
	if (repo === '↵ Back') return
	const spinner = spin().start(chalk.green(WAIT_MSG))

	try {
		const repo_info = await api.repositoryInfo(repo)
		const creation_date = new Date(0)
		creation_date.setUTCSeconds(repo_info.creation_time)
		const repo_acl = (await api.getACL(repo)).map(
			(value) => `${value.name} - ${to_ACL(value).rights_str}`
		)
		if (!repo_acl.length) repo_acl.push('no sharing')
		spinner.info(
			clor.info(
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

async function show_repo_preview(config: ConfigType) {
	const repo = await ask_autocomplete(['↵ Back', ...config.repo], 'Select for see README.md', true)
	if (repo === '↵ Back') return
	const spinner = spin().start(chalk.green(WAIT_MSG))

	try {
		// git_menu.tar > extract to stdout
		const remote = await sh(
			`git archive --remote=git@git.epitech.eu:${config.email}/${repo} HEAD README.md | tar -xO`
		)
		const md_term = md_parser(remote.stdout)
		spinner.stop()
		console.log(md_term + '\n')
	} catch (err: any) {
		if (/remote: fatal: pathspec 'README\.md' did not match any files/.test(err?.message || ''))
			spinner.fail(chalk.red("Error: 'README.md' file was not found on the repository"))
		else spinner.fail(chalk.red(err))
	}
}
