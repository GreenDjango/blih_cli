import * as inquirer from 'inquirer'
import chalk from 'chalk'
import ora, { Options } from 'ora'
import { VERBOSE, SPINNER } from './utils'
import type { Projects } from './timeline_api'

inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'))
inquirer.registerPrompt('fuzzypath', require('inquirer-fuzzy-path'))
inquirer.registerPrompt('path', require('./inquirer_plugins/PathPrompt').default)
inquirer.registerPrompt('listspinner', require('./inquirer_plugins/ListSpinnerPrompt').default)
inquirer.registerPrompt('timeline', require('./inquirer_plugins/TimelinePrompt').default)

export async function ask_input(message?: string) {
	const prompted = await inquirer.prompt([
		{
			type: 'input',
			name: 'input',
			message: message || '>',
		},
	])
	is_verbose()
	return prompted.input as string
}

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
	is_verbose()
	if (return_index) {
		const idx = choices.findIndex((value) => value === prompted.list)
		if (idx >= 0) return idx.toString()
		return '0'
	}
	return prompted.list as string
}

export async function ask_list_index<T>(
	choices: { name: string; value: T; short?: string }[],
	message?: string
) {
	const prompted: any = await inquirer.prompt([
		{
			type: 'list',
			choices: choices.map((val) => {
				if (!val.short) val.short = val.name
				return val
			}),
			name: 'list',
			message: message || '>',
			pageSize: 10,
		},
	])
	is_verbose()
	return prompted.list as T
}

export async function ask_password() {
	const prompted: any = await inquirer.prompt([
		{
			type: 'password',
			name: 'password',
			mask: '*',
		},
	])
	is_verbose()
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
		is_verbose()
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
	is_verbose()
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
	is_verbose()
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
				suggestOnly: suggestOnly ? false : true,
				source: async (_answer: any, input: any) => {
					const regex_input = RegExp(input, 'i')
					return source.filter((value) => regex_input.test(value))
				},
			},
		])
		is_verbose()
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
				itemType: folder === undefined ? undefined : folder ? 'directory' : 'file',
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
		is_verbose()
		if (!prompted.fuzzypath) console.log(chalk.yellow('Use tab for select'))
	} while (!prompted.fuzzypath)
	return prompted.fuzzypath as string
}

export async function ask_local_path(message?: string, path?: string, folder?: boolean) {
	let prompted: any
	do {
		prompted = await inquirer.prompt([
			{
				type: 'path',
				name: 'path',
				message: message || '>',
				itemType: folder === undefined ? undefined : folder ? 'directory' : 'file',
				rootPath: path ? path : undefined,
				suggestOnly: true,
				excludePath: undefined,
				excludeFilter: undefined,
			},
		])
		is_verbose()
		if (!prompted.path) console.log(chalk.yellow('Use tab for select'))
	} while (!prompted.path)
	return prompted.path as string
}

export async function ask_spinner(choices: string[], message?: string) {
	const prompted: any = await inquirer.prompt([
		{
			type: 'listspinner',
			name: 'listspinner',
			choices: choices,
			message: message || '>',
			pageSize: 10,
		},
	])
	is_verbose()
	return prompted.listspinner as string
}

export async function ask_timeline(choices: Projects[], message?: string) {
	const new_choices: {
		module: string
		projects: { project: string; start: string; end: string }[]
	}[] = []
	// Group all project whith the same module together
	choices.forEach((choice) => {
		const idx = new_choices.findIndex((value2) => value2.module === choice.module)
		if (idx >= 0)
			new_choices[idx]?.projects.push({
				project: choice.project,
				start: choice.start,
				end: choice.end,
			})
		else
			new_choices.push({
				module: choice.module,
				projects: [{ project: choice.project, start: choice.start, end: choice.end }],
			})
	})
	const prompted: any = await inquirer.prompt([
		{
			type: 'timeline',
			name: 'timeline',
			choices: new_choices,
			message: message || '>',
			pageSize: 9,
		},
	])
	return prompted.listspinner as string
}

export function ctext(string: string) {
	const spaces = Math.floor(process.stdout.getWindowSize()[0] / 2 - string.length / 2)
	return Array(spaces + 1).join(' ') + string
}

function is_verbose() {
	if (!VERBOSE) clear_line(true)
}

export function clear_line(up_line?: boolean) {
	process.stdout.clearLine(0)
	if (up_line) {
		process.stdout.moveCursor(0, -1)
		process.stdout.clearLine(0)
	}
}

export function spin(opt?: Options) {
	return ora({ spinner: SPINNER as any, ...opt })
}
