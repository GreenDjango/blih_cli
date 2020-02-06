//import ora from 'ora'
//import chalk from 'chalk'
import * as inquirer from 'inquirer'
inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'))

export async function ask_list(choices: string[], message?: string) {
	const prompted: any = await inquirer.prompt([
		{
			type: 'list',
			choices: choices,
			name: 'prompted',
			message: message || '>',
			pageSize: 10,
		},
	])
	return prompted.prompted as string
}

export async function ask_password() {
	const password: any = await inquirer.prompt([
		{
			type: 'password',
			name: 'password',
			mask: '*',
		},
	])
	return password.password as string
}

export async function ask_email() {
	const regex_email = RegExp('([\\w.-]+@([\\w-]+)\\.+\\w{2,})')
	let email: any

	do {
		email = await inquirer.prompt([
			{
				type: 'input',
				name: 'email',
			},
		])
	} while (!regex_email.test(email.email))

	return email.email as string
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
			name: 'prompted',
			message: message || '>',
		},
	])
	return prompted.prompted as string[]
}

export async function ask_question(message?: string) {
	const bool: any = await inquirer.prompt([
		{
			type: 'confirm',
			name: 'prompted',
			message: message || '>',
		},
	])
	return bool.prompted
}

export async function ask_autocomplete(message: string, source: string[]) {
	let input: any

	do {
		input = await inquirer.prompt([
			{
				type: 'autocomplete',
				name: 'from',
				message: message,
				suggestOnly: true,
				source: async (answer: any, input: any) => {
					const regex_input = RegExp(input)
					return source.filter(value => regex_input.test(value))
				},
			},
		])
	} while (!input.from)
	return input.from as string
}

export async function ask_input(message: string) {
	let input: any

	input = await inquirer.prompt([
		{
			type: 'input',
			name: message,
		},
	])
	return input[message] as string
}
