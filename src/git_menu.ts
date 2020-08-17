import ora from 'ora'
import chalk from 'chalk'
import fs from 'fs'
import { BlihApi } from './blih_api'
import { ask_list, ask_autocomplete, ask_question, ask_input } from './ui'
import { ConfigType, clor, sh, WAIT_MSG } from './utils'

export async function git_menu(api: BlihApi, config: ConfigType) {
	let should_quit = false
	const choices = ['↵ Back', 'My repository', 'Other repository', 'All my repositories']

	while (!should_quit) {
		const choice = await ask_list(choices, 'Git clone repositories')

		switch (choice) {
			case choices[1]:
				await clone_my_repo(config)
				break
			case choices[2]:
				await clone_other_repo(config)
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

async function clone_my_repo(config: ConfigType) {
	const repo_name = await ask_autocomplete(['↵ Back', ...config.repo], undefined, true)

	if (repo_name === '↵ Back') return
	await clone_repo(repo_name, config.email)
}

async function clone_other_repo(config: ConfigType) {
	const repo_name = await ask_input('Repository name ?')
	const email = await ask_autocomplete(config.contact, 'Enter repository email')

	if (!config.contact.some((value) => value === email)) {
		config.contact.push(email)
		config.contact = config.contact
	}
	await clone_repo(repo_name, email)
}

export async function clone_repo(repo_name: string, email: string) {
	const pwd = process.cwd()
	const spinner = ora()
	spinner.color = 'blue'

	try {
		if (!(await ask_question('Git clone here ?'))) {
			const repo_path = await ask_input('Repository destination:')
			if (repo_path === '') return
			if (!fs.existsSync(repo_path)) {
				if (await ask_question('Path not exist, create ?'))
					fs.mkdirSync(repo_path, { recursive: true })
				else return
			}
			process.chdir(repo_path)
		}
		spinner.start(chalk.green(`Clone '${clor.info(repo_name)}' repository...`))
		await sh(`git clone git@git.epitech.eu:/${email}/${repo_name}`)
		spinner.succeed(
			chalk.green(`Repository ${process.cwd()}/`) + clor.info(repo_name) + chalk.green('/ clone')
		)
	} catch (err) {
		spinner.fail(chalk.red(err))
	}
	process.chdir(pwd)
}

async function clone_all_repo(api: BlihApi, config: ConfigType) {
	const pwd = process.cwd()
	const spinner = ora()
	spinner.color = 'blue'
	spinner.start(chalk.green(WAIT_MSG))

	try {
		const repo_list = await api.listRepositories()
		spinner.stop()
		const repo_nb = repo_list.length
		if (!(await ask_question(`Git clone ${clor.info(repo_nb)} repositories here ?`))) {
			const repo_path = await ask_input('Repository destination:')
			if (repo_path === '') return
			if (!fs.existsSync(repo_path)) {
				if (await ask_question('Path not exist, create ?'))
					fs.mkdirSync(repo_path, { recursive: true })
				else return
			}
			process.chdir(repo_path)
		}
		for (const [idx, repo] of repo_list.entries()) {
			spinner.stop()
			spinner.start(
				chalk.green(`(${idx}/${repo_nb}): Clone '${clor.info(repo.name)}' in ${process.cwd()}...`)
			)
			try {
				await sh(`git clone git@git.epitech.eu:/${config.email}/${repo.name}`)
			} catch (err) {
				spinner.fail(chalk.red(err))
			}
		}
		spinner.succeed(chalk.green(`${repo_nb} repositories clone`))
	} catch (err) {
		spinner.fail(chalk.red(err))
	}
	process.chdir(pwd)
}
