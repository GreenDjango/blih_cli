import ora from 'ora'
import chalk from 'chalk'
import fs from 'fs'
import { BlihApi } from './blih_api'
import { ask_list, ask_autocomplete, ask_question, ask_input } from './ui'
import { ConfigType, sh, WAIT_MSG } from './utils'

export async function git_menu(api: BlihApi, config: ConfigType) {
	let should_quit = false

	while (!should_quit) {
		const choices = ['↵ Back', 'My repository', 'Other repository', 'All my repositories']
		const choice = await ask_list(choices, 'Git clone repositories')

		switch (choice) {
			case choices[1]:
				await clone_my_repo(api, config)
				break
			case choices[2]:
				await clone_other_repo(api, config)
				break
			case choices[3]:
				await clone_all_repo(api, config)
				break
			case choices[0]:
			default:
				should_quit = true
		}
	}
}

async function clone_my_repo(api: BlihApi, config: ConfigType) {
	const repo_name = await ask_autocomplete(['↵ Back', ...config.repo], undefined, true)

	if (repo_name === '↵ Back') return
	await clone_repo(api, repo_name, config.email)
}

async function clone_other_repo(api: BlihApi, config: ConfigType) {
	const repo_name = await ask_input('Repository name ?')
	const email = await ask_autocomplete(config.contact, 'Enter repository email')

	if (!config.contact.some(value => value === email)) {
		config.contact.push(email)
		config.contact = config.contact
	}
	await clone_repo(api, repo_name, email)
}

export async function clone_repo(api: BlihApi, repo_name: string, email: string) {
	const spinner = ora()
	spinner.color = 'blue'

	try {
		let repo_path = null
		if (!(await ask_question('Git clone here ?')))
			repo_path = await ask_input('Repository destination:')
		if (repo_path !== null && !fs.existsSync(repo_path)) {
			if (await ask_question('Path not exist, create ?'))
				fs.mkdirSync(repo_path, { recursive: true })
			else return
		}
		spinner.start(chalk.green(`Clone repository in ${repo_path || process.cwd()}...`))
		const cd = repo_path ? `cd ${repo_path}; ` : ''
		await sh(`${cd}git clone git@git.epitech.eu:/${email}/${repo_name}`)
		spinner.succeed(chalk.green('Repository ') + chalk.blue(repo_name) + chalk.green(' clone'))
	} catch (err) {
		spinner.fail(chalk.red(err))
	}
}

async function clone_all_repo(api: BlihApi, config: ConfigType) {
	const spinner = ora()
	spinner.color = 'blue'
	spinner.start(chalk.green(WAIT_MSG))

	try {
		const repo_list = await api.listRepositories()
		spinner.stop()
		let repo_path: string | null = null
		const repo_nb = repo_list.length
		if (!(await ask_question(`Git clone ${chalk.blue(repo_nb)} repositories here ?`)))
			repo_path = await ask_input('Repository destination:')
		if (repo_path !== null && !fs.existsSync(repo_path)) {
			if (await ask_question('Path not exist, create ?'))
				fs.mkdirSync(repo_path, { recursive: true })
			else return
		}
		const cd = repo_path ? `cd ${repo_path}; ` : ''

		for (let idx = 0; idx < repo_nb; idx++) {
			spinner.stop()
			spinner.start(
				chalk.green(
					`(${idx}/${repo_nb}): Clone '${repo_list[idx].name}' in ${repo_path || process.cwd()}...`
				)
			)
			try {
				await sh(`${cd}git clone git@git.epitech.eu:/${config.email}/${repo_list[idx].name}`)
			} catch (err) {
				spinner.fail(chalk.red(err))
			}
		}
		spinner.succeed(chalk.green(`${repo_nb} repositories clone`))
	} catch (err) {
		spinner.fail(chalk.red(err))
	}
}
