import * as inquirer from 'inquirer'
import chalk from 'chalk'
inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'))
inquirer.registerPrompt('fuzzypath', require('inquirer-fuzzy-path'))

export async function ask_list(choices: string[], message?: string, return_index?: boolean) {
	const prompted: any = await inquirer.prompt([
		{
			type: 'list',
			choices: choices,
			name: 'list',
			message: message || '>',
			pageSize: 10,
		},
	])
	if (return_index) {
		const idx = choices.findIndex(value => value === prompted.list)
		if (idx >= 0) return idx.toString()
	}
	return prompted.list as string
}

export async function ask_password() {
	const prompted: any = await inquirer.prompt([
		{
			type: 'password',
			name: 'password',
			mask: '*',
		},
	])
	return prompted.password as string
}

export async function ask_email() {
	const regex_email = RegExp('([\\w.-]+@([\\w-]+)\\.+\\w{2,})')
	let prompted: any

	do {
		prompted = await inquirer.prompt([
			{
				type: 'input',
				name: 'email',
			},
		])
	} while (!regex_email.test(prompted.email))

	return prompted.email as string
}

export async function ask_qcm(
	choices: string[],
	values: string[],
	checked: boolean[],
	message?: string
) {
	const choices_bis = choices.map((choice, index) => {
		return { name: choice, value: values[index], checked: checked[index] }
	})
	const prompted: any = await inquirer.prompt([
		{
			type: 'checkbox',
			choices: choices_bis,
			name: 'checkbox',
			message: message || '>',
		},
	])
	return prompted.checkbox as string[]
}

export async function ask_question(message?: string) {
	const prompted: any = await inquirer.prompt([
		{
			type: 'confirm',
			name: 'confirm',
			message: message || '>',
		},
	])
	return prompted.confirm as boolean
}

export async function ask_autocomplete(source: string[], message?: string, suggestOnly?: boolean) {
	let prompted: any

	do {
		prompted = await inquirer.prompt([
			{
				type: 'autocomplete',
				name: 'autocomplete',
				message: message || '>',
				pageSize: 10,
				suggestOnly: suggestOnly === false ? false : true,
				source: async (answer: any, input: any) => {
					const regex_input = RegExp(input, 'i')
					return source.filter(value => regex_input.test(value))
				},
			},
		])
		if (!prompted.autocomplete) console.log(chalk.yellow('Use tab for select'))
	} while (!prompted.autocomplete)
	return prompted.autocomplete as string
}

export async function ask_path(
	message?: string,
	filter?: string,
	path?: string,
	depth?: number,
	folder?: boolean
) {
	let prompted: any

	do {
		prompted = await inquirer.prompt([
			{
				type: 'fuzzypath',
				name: 'fuzzypath',
				message: message || '>',
				itemType: folder ? 'folder' : 'file',
				depthLimit: depth || 4,
				rootPath: path ? path : undefined,
				suggestOnly: true,
				excludePath: (nodePath: string) => {
					const regex_input = RegExp('node_modules|\\.git|\\.cache')
					return regex_input.test(nodePath)
				},
				excludeFilter: (nodePath: string) => {
					if (!filter) return false
					const regex_input = RegExp(filter)
					return !regex_input.test(nodePath)
				},
			},
		])
		if (!prompted.fuzzypath) console.log(chalk.yellow('Use tab for select'))
	} while (!prompted.fuzzypath)
	return prompted.fuzzypath as string
}

export async function ask_input(message?: string) {
	const prompted = await inquirer.prompt([
		{
			type: 'input',
			name: 'input',
			message: message || '>',
		},
	])
	return prompted.input as string
}

export function ctext(string: string) {
	const spaces = Math.floor(process.stdout.getWindowSize()[0] / 2 - string.length / 2)
	return Array(spaces + 1).join(' ') + string
}

export function clear_line(up_line?: boolean) {
	process.stdout.clearLine(0)
	if (up_line) {
		process.stdout.moveCursor(0, -1)
		process.stdout.clearLine(0)
	}
}
