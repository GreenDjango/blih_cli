import ora from 'ora'
import chalk from 'chalk'
import fs from 'fs'
import { BlihApi } from './blih_api'
import { ask_list, ask_autocomplete, ask_question, ask_input } from './ui'
import { ConfigType, sh } from './utils'

export async function git_menu(api: BlihApi, config: ConfigType) {
	let should_quit = false

	while (!should_quit) {
		const choices = ['↵ Back', 'My repository', 'Other repository']
		const choice = await ask_list(choices, 'Git clone repositories')

		switch (choice) {
			case choices[1]:
				await clone_my_repo(api, config)
				break
			case choices[2]:
				//TODO: await clone_other_repo(api, config)
				break
			case choices[0]:
			default:
				should_quit = true
		}
	}
}

async function clone_my_repo(api: BlihApi, config: ConfigType) {
	const repo_name = await ask_autocomplete(['↵ Back', ...config.repo], undefined, true)
	const spinner = ora()
	spinner.color = 'blue'

	if (repo_name === '↵ Back') return
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
		await sh(`${cd}git clone git@git.epitech.eu:/${config.email}/${repo_name}`)
		spinner.succeed(chalk.green('Repository ') + chalk.blue(repo_name) + chalk.green(' clone'))
	} catch (err) {
		spinner.fail(chalk.red(err))
	}
}
