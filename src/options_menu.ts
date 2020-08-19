import chalk from 'chalk'
import {
	ask_input,
	ask_list,
	ask_list_index,
	ask_question,
	ask_autocomplete,
	ask_spinner,
} from './ui'
import { ConfigType, clor, colorsValue, spinner_names } from './utils'

export async function options_menu(config: ConfigType) {
	let should_quit = false

	while (!should_quit) {
		const choices = [
			'↵ Back',
			`Remember password: ${config.save_token ? chalk.green.bold('✔') : chalk.red.bold('✗')}`,
			`Auto Ramassage-tek ACL: ${config.auto_acl ? chalk.green.bold('✔') : chalk.red.bold('✗')}`,
			`Mode verbose: ${config.verbose ? chalk.green.bold('✔') : chalk.red.bold('✗')}`,
			`Check update at launch: ${
				config.check_update ? chalk.green.bold('✔') : chalk.red.bold('✗')
			}`,
			`Colors option`,
			`Spinner option`,
			`Cloning options`,
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
				config.check_update = !config.check_update
				break
			case choices[5]:
				await colors_option(config)
				break
			case choices[6]:
				await spinner_option(config)
				break
			case choices[7]:
				await cloning_options(config)
				break
			case choices[8]:
				const valid = await ask_question(`Are you sure ?`)
				if (valid) config.contact = []
				break
			case choices[0]:
			default:
				should_quit = true
		}
	}
}

async function colors_option(config: ConfigType) {
	const colorsKey = clor.getColorsKey()
	const color_choices = [...colorsValue].map((key) => {
		return `${key.charAt(0).toUpperCase() + key.slice(1)}: ${(chalk as any)[key]('test ■')}`
	})

	while (1) {
		const choices = colorsKey.map((key) => {
			return `${key.charAt(0).toUpperCase() + key.slice(1)}: ${(clor as any)[key]('current ■')}`
		})

		const option = await ask_list(['↵ Back', ...choices], 'You want colors ?', true)
		if (option === '0') return

		const color = await ask_autocomplete(['↵ Back', ...color_choices], undefined, true)
		if (color === '↵ Back') continue

		const idx = color_choices.findIndex((value) => value === color)
		if (idx >= 0) {
			switch (colorsKey[+option - 1]) {
				case 'info':
					config.colors.info = [...colorsValue][idx]
					break
				default:
					continue
			}
			config.colors = config.colors
		}
	}
}

async function spinner_option(config: ConfigType) {
	const new_spinner = await ask_spinner(
		['↵ Back', ...spinner_names],
		`Current spinner '${config.spinner_name}', new :`
	)
	if (new_spinner !== '↵ Back') config.spinner_name = new_spinner
}

async function cloning_options(config: ConfigType) {
	while (1) {
		const choice = await ask_list_index([
			{ name: '↵ Back', value: undefined },
			{ name: 'Add preset', value: -1 },
			...config.cloning_options.map((val, idx) => {
				if (!idx) return { name: chalk.bold(`default: ${JSON.stringify(val)}`), value: idx }
				return { name: `${idx}) ${JSON.stringify(val)}`, value: idx }
			}),
		])

		if (typeof choice !== 'number') break

		if (choice === -1)
			config.cloning_options = [...config.cloning_options, await ask_input('New preset')]
		else {
			const choice2 = await ask_list(['↵ Back', 'Set by default', 'Erase'])

			if (choice2 === '↵ Back') {
				1
			} else if (choice2 === 'Set by default' && choice) {
				const def = config.cloning_options[0]
				config.cloning_options[0] = config.cloning_options[choice]
				config.cloning_options[choice] = def
			} else if (choice2 === 'Erase' && (await ask_question(`Are you sure ?`))) {
				config.cloning_options.splice(choice, 1)
				config.cloning_options = config.cloning_options
			}
		}
	}
}
