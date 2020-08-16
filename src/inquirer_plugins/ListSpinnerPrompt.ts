/**
 * Copyright (c) 2020 Blih CLI
 *
 * List spinner prompt plugin for inquirer
 * (https://npmjs.com/package/inquirer)
 *
 * @summary List spinner prompt plugin for inquirer
 * @author Theo <@GreenDjango>
 */

/* tslint:disable */
import chalk from 'chalk'
import { Interface as ReadLineInterface } from 'readline'
import { flatMap, map, take, takeUntil } from 'rxjs/operators'
import Base from 'inquirer/lib/prompts/base'
import observe from 'inquirer/lib/utils/events'
import Paginator from 'inquirer/lib/utils/paginator'
import Choices from 'inquirer/lib/objects/choices'
import { Answers, ListQuestionOptions } from 'inquirer'
import cliSpinners from 'cli-spinners'
// @ts-ignore
import cliCursor from 'cli-cursor'
// @ts-ignore
import runAsync from 'run-async'

/**
 * message: string, top content
 * choices: string[], spinner names or text
 * pageSize: number, size of list to show
 * default: number | string, index or value to show first
 */
export default class ListSpinnerPrompt extends Base {
	public showHelp: boolean
	private selected: number
	private readonly paginator: Paginator
	private done: Function | undefined
	private id: NodeJS.Timeout | undefined
	private frame_idx: number

	constructor(questions: ListQuestionOptions, rl: ReadLineInterface, answers: Answers) {
		super(questions, rl, answers)

		if (!this.opt.choices) {
			this.throwParamError('choices')
		}

		this.showHelp = true
		this.selected = 0
		this.done = undefined
		this.id = undefined
		this.frame_idx = 0

		const def = this.opt.default

		// If def is a Number, then use as index. Otherwise, check for value.
		if (typeof def === 'number' && def >= 0 && def < this.opt.choices.realLength) {
			this.selected = def
		} else if (!(typeof def === 'number') && def != null) {
			const index = this.opt.choices.realChoices.findIndex(({ value }: any) => value === def)
			this.selected = Math.max(index, 0)
		}

		// Make sure no default is set (so it won't be printed)
		this.opt.default = null

		this.paginator = new Paginator(this.screen)
	}

	//Start the Inquiry session
	public _run(cb: Function) {
		this.done = cb

		const self = this

		const events = observe(this.rl)
		events.normalizedUpKey.pipe(takeUntil(events.line)).forEach(this.onUpKey.bind(this))
		events.normalizedDownKey.pipe(takeUntil(events.line)).forEach(this.onDownKey.bind(this))
		// @ts-ignore
		events.numberKey.pipe(takeUntil(events.line)).forEach(this.onNumberKey.bind(this))
		events.line
			.pipe(
				take(1),
				map(this.getCurrentValue.bind(this)),
				flatMap((value) => runAsync(self.opt.filter)(value).catch((err: any) => err))
			)
			.forEach(this.onSubmit.bind(this))

		// Init the prompt
		cliCursor.hide()
		this.render(true)
		// Init interval render for spinners
		this.id = setInterval(this.render.bind(this), 110) as any

		return this
	}

	// Render the prompt to screen
	render(ignore_spinners?: boolean) {
		// Render question
		let message = this.getQuestion()

		if (this.showHelp) {
			message += chalk.dim('(Use arrow keys)')
		}

		// Render choices or answer depending on the state
		if (this.status === 'answered') {
			message += chalk.cyan(this.opt.choices.getChoice(this.selected).short)
		} else {
			const choicesStr = listRender(this.opt.choices, this.selected, this.frame_idx)
			if (!ignore_spinners) this.frame_idx++
			// @ts-ignore
			const indexPosition = this.opt.choices.indexOf(this.opt.choices.getChoice(this.selected))
			// @ts-ignore
			message += '\n' + this.paginator.paginate(choicesStr, indexPosition, this.opt.pageSize)
		}

		this.screen.render(message, undefined as any)
	}

	/**
	 * When user press `enter` key
	 */
	onSubmit(value: any) {
		this.status = 'answered'

		if (this.id) clearInterval(this.id)
		this.id = undefined

		this.showHelp = false
		// Rerender prompt
		this.render(true)

		this.screen.done()
		cliCursor.show()
		if (this.done) this.done(value)
	}

	getCurrentValue() {
		return this.opt.choices.getChoice(this.selected).value
	}

	/**
	 * When user press a key
	 */
	onUpKey() {
		const len = this.opt.choices.realLength
		this.selected = this.selected > 0 ? this.selected - 1 : len - 1
		this.showHelp = false
		this.render(true)
	}

	onDownKey() {
		const len = this.opt.choices.realLength
		this.selected = this.selected < len - 1 ? this.selected + 1 : 0
		this.showHelp = false
		this.render(true)
	}

	onNumberKey(input: number) {
		if (input <= this.opt.choices.realLength) {
			this.selected = input - 1
		}
		this.showHelp = false
		this.render(true)
	}
}

// Function for rendering list choices
function listRender(choices: Choices, pointer: number, frame_idx: number) {
	let output = ''
	let separatorOffset = 0

	choices.forEach((choice, i) => {
		if (choice.type === 'separator') {
			separatorOffset++
			output += '  ' + choice + '\n'
			return
		}

		if (choice.disabled) {
			separatorOffset++
			output += '  - ' + choice.name
			output += ' (' + (typeof choice.disabled === 'string' ? choice.disabled : 'Disabled') + ')'
			output += '\n'
			return
		}

		const isSelected = i - separatorOffset === pointer
		//spinner.spinner = choice.name as any
		let spinner_frame = ''
		if ((cliSpinners as any)[choice.name]) {
			const length = (cliSpinners as any)[choice.name].frames.length
			spinner_frame = ' ' + (cliSpinners as any)[choice.name].frames[frame_idx % length]
		}
		let line = (isSelected ? '> ' : '  ') + choice.name + spinner_frame
		if (isSelected) {
			line = chalk.cyan(line)
		}

		output += line + ' \n'
	})

	return output.replace(/\n$/, '')
}
