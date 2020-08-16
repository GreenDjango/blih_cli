/**
 * Copyright (c) 2020 Blih CLI
 *
 * Timeline prompt plugin for inquirer
 * (https://npmjs.com/package/inquirer)
 *
 * @summary Timeline prompt plugin for inquirer
 * @author Theo <@GreenDjango>
 */

/* tslint:disable */
import chalk from 'chalk'
import { Interface as ReadLineInterface } from 'readline'
import { fromEvent } from 'rxjs'
import { flatMap, map, take, takeUntil, filter, share } from 'rxjs/operators'
import Base from 'inquirer/lib/prompts/base'
import observe from 'inquirer/lib/utils/events'
import Paginator from 'inquirer/lib/utils/paginator'
import { Answers, ListQuestionOptions } from 'inquirer'
// @ts-ignore
import cliCursor from 'cli-cursor'
// @ts-ignore
import runAsync from 'run-async'
// @ts-ignore
import cliWidth from 'cli-width'

const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
const unitSize = '--------------------------'

type Project = { project: string; start: string; end: string }
type Extra = { project: string; start: Date; end: Date }

/**
 * message: string, top content
 * choices: { module: string; projects: { project: string; start: string; end: string }[]}[], timeline projects
 * pageSize: number, size of list to show
 * default: number | string, index or value to show first
 */
export default class TimelinePrompt extends Base {
	public showHelp: boolean
	private selected: number
	private offsetX: number
	private readonly paginator: Paginator
	private done: Function | undefined
	private axeX: string
	private unitsX: string
	private longestName: number

	constructor(questions: ListQuestionOptions, rl: ReadLineInterface, answers: Answers) {
		questions.choices = [...(questions.choices as any)].map((value) => {
			value.name = value.module
			value.extra = value.projects.map((v: Project) => {
				const end_date = new Date(v.end)
				end_date.setDate(end_date.getDate() + 1)
				return { project: v.project, start: new Date(v.start), end: end_date }
			})
			delete value.module
			delete value.projects
			return value
		})
		super(questions, rl, answers)

		if (!this.opt.choices) {
			this.throwParamError('choices')
		}

		this.longestName =
			this.opt.choices.realChoices.reduce((a: any, b: any) => {
				return a.name.length > b.name.length ? a : b
			}).name?.length || 0

		this.showHelp = true
		this.selected = 0
		this.offsetX = 0
		this.done = undefined
		this.axeX = Array(13)
			.fill(1)
			.reduce((prev) => {
				return prev + unitSize + '|'
			}, '')
		this.unitsX = months.reduce((prev, curr) => {
			return (
				prev +
				' '.repeat(
					unitSize.length - Math.floor(curr.length / 2) - (prev.length % (unitSize.length + 1))
				) +
				curr
			)
		}, '')
		this.axeX = '─'.repeat(this.longestName + 5) + '┤' + this.axeX
		this.unitsX = ' '.repeat(this.longestName + 4) + this.unitsX.replace(/^./, 'Aug')

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
		const eventsCustom = observeCustom(this.rl)
		events.normalizedUpKey.pipe(takeUntil(events.line)).forEach(this.onUpKey.bind(this))
		events.normalizedDownKey.pipe(takeUntil(events.line)).forEach(this.onDownKey.bind(this))
		eventsCustom.normalizedLeftKey.pipe(takeUntil(events.line)).forEach(this.onLeftKey.bind(this))
		eventsCustom.normalizedRightKey.pipe(takeUntil(events.line)).forEach(this.onRightKey.bind(this))

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
		this.render()

		return this
	}

	// Render the prompt to screen
	render() {
		// Render question
		let message = this.getQuestion()

		if (this.showHelp) {
			message += chalk.dim('(Use arrow keys)')
			this.showHelp = false
		}

		// Render choices or answer depending on the state
		if (this.status === 'answered') {
			message += chalk.cyan(this.opt.choices.getChoice(this.selected).short)
		} else {
			const choicesStr = this.listRender()
			// @ts-ignore
			const indexPosition = this.opt.choices.indexOf(this.opt.choices.getChoice(this.selected))
			// prettier-ignore
			// @ts-ignore
			message += '\n' + this.paginator.paginate(choicesStr, indexPosition * 3 +1, this.opt.pageSize)
		}

		const bottomContent = this.status === 'answered' ? undefined : this.bottomRender()
		this.screen.render(message, bottomContent as any)
	}

	// Function for rendering list choices
	listRender() {
		let output = ''
		let separatorOffset = 0
		const width = cliWidth({ defaultWidth: 80, output: (this.rl as any).output })

		this.opt.choices.forEach((choice, i) => {
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

			const isSelected = i - separatorOffset === this.selected
			let outLine = '─'.repeat(choice.name.length)
			const offsetLine = ' '.repeat(this.longestName - choice.name.length)
			let upLine = offsetLine + `  ╭─${outLine}─┤`
			let midLine = (isSelected ? '>' : ' ') + offsetLine + ' │ ' + choice.name + ' │'
			let downLine = offsetLine + `  ╰─${outLine}─┤`
			;(choice.extra as Extra[])
				.sort((a, b) => a.start.getTime() - b.start.getTime())
				.forEach((val) => {
					outLine = '─'.repeat(val.project.length)
					upLine += ` ╭─${outLine}─╮`
					midLine += ` │ ${val.project} │`
					downLine += ` ╰─${outLine}─╯`
				})

			let lines =
				applyOffset(upLine, this.offsetX, width) +
				' \n' +
				applyOffset(midLine, this.offsetX, width) +
				' \n' +
				applyOffset(downLine, this.offsetX, width)
			if (isSelected) lines = chalk.cyan(lines)
			output += lines + ' \n'
		})

		return output.replace(/\n$/, '')
	}

	// Function for rendering bottom content
	bottomRender() {
		const width = cliWidth({ defaultWidth: 80, output: (this.rl as any).output })
		const axe = applyOffset(this.axeX, this.offsetX, width)
		const output = axe + ' \n' + applyOffset(this.unitsX, this.offsetX, width) + ' \n'

		return output.replace(/\n$/, '')
	}

	/**
	 * When user press `enter` key
	 */
	onSubmit(value: any) {
		this.status = 'answered'

		// Rerender prompt
		this.render()

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
		this.render()
	}

	onDownKey() {
		const len = this.opt.choices.realLength
		this.selected = this.selected < len - 1 ? this.selected + 1 : 0
		this.render()
	}

	onLeftKey() {
		if (this.offsetX >= 0) return
		this.offsetX += 4
		this.render()
	}

	onRightKey() {
		if (this.offsetX <= -200) return
		this.offsetX -= 4
		this.render()
	}

	onNumberKey(input: number) {
		if (input <= this.opt.choices.realLength) {
			this.selected = input - 1
		}
		this.render()
	}
}

function applyOffset(line: string, offsetX: number, width: number) {
	if (offsetX < 0) {
		const regex = new RegExp('(?:(?:\\033[[0-9;]*m)*.?){1,' + Math.abs(offsetX) + '}')
		// Real line length with Escape sequences (visual length)
		const chunk = line.match(regex)
		if (chunk) {
			line = line.substr(chunk[0].length)
		}
	} else line = ' '.repeat(offsetX) + line
	// TODO : shift with Escape sequence when offsetX >= 0
	return line.substr(0, width - 1)
}

function observeCustom(rl: any) {
	var keypress = fromEvent(rl.input, 'keypress', (value, key) => {
		return { value: value, key: key || {} }
	})
		// Ignore `enter` key. On the readline, we only care about the `line` event.
		.pipe(filter(({ key }) => key.name !== 'enter' && key.name !== 'return'))

	return {
		normalizedLeftKey: keypress.pipe(
			filter(({ key }) => key.name === 'left'),
			share()
		),
		normalizedRightKey: keypress.pipe(
			filter(({ key }) => key.name === 'right'),
			share()
		),
	}
}
