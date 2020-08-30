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

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const unitSize = '------------------------------------------------------'

type Project = { project: string; start: string; end: string }
type Extra = { project: string; start: Date; end: Date }

/**
 * @param message string, top content
 * @param choices: { module: string; projects: { project: string; start: string; end: string }[]}[], timeline projects
 * @param pageSize: number, size of list to show
 * @param default: number | string, index or value to show first
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
	private oldestDate: Date
	private latestDate: Date

	constructor(questions: ListQuestionOptions, rl: ReadLineInterface, answers: Answers) {
		questions.choices = [...(questions.choices as any)].map((value) => {
			value.name = value.module
			value.type = value.type || 'choice'
			value.extra = (value.projects as Project[])
				.map(
					(v): Extra => {
						const end_date = new Date(v.end)
						end_date.setDate(end_date.getDate() + 1)
						return { project: v.project, start: new Date(v.start), end: end_date }
					}
				)
				.sort((a, b) => a.start.getTime() - b.start.getTime())
			delete value.module
			delete value.projects
			return value
		})
		super(questions, rl, answers)

		if (!this.opt.choices) {
			this.throwParamError('choices')
		}

		this.showHelp = true
		this.selected = 0
		this.offsetX = 0
		this.done = undefined
		this.axeX = ''
		this.unitsX = ''
		this.longestName = 0
		this.oldestDate = undefined as any
		this.latestDate = undefined as any

		this.setup()

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

	setup() {
		// set longestName, oldestDate, latestDate
		this.opt.choices.forEach((choice) => {
			if (choice.type !== 'choice') return
			const extra = choice.extra as Extra[]
			if (choice.name.length > this.longestName) this.longestName = choice.name.length
			if (!this.oldestDate || this.oldestDate > extra[0]?.start) {
				this.oldestDate = extra[0]?.start
			}
			const latest = extra.reduce((a, b) => (a.end > b.end ? a : b))
			if (!this.latestDate || this.latestDate < latest?.end) this.latestDate = latest?.end
		})
		if (!this.oldestDate || !this.latestDate) {
			this.oldestDate = new Date()
			this.latestDate = new Date(this.oldestDate.getFullYear(), this.oldestDate.getMonth() + 3)
		}

		const monthLength = getBetweenMonth(this.oldestDate, this.latestDate) + 1
		this.axeX = '─'.repeat(this.longestName + 5) + '┤' + `${unitSize}|`.repeat(monthLength)
		for (let i = 0; i <= monthLength; i++) {
			const month = months[(this.oldestDate.getMonth() + i) % 12]
			this.unitsX +=
				' '.repeat(
					unitSize.length -
						Math.floor(month.length / 2) -
						(this.unitsX.length % (unitSize.length + 1))
				) + month
		}
		this.unitsX = ' '.repeat(this.longestName + 4) + this.unitsX.replace(/ */, '')
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

	getAbsPos(d: Date) {
		const monthDiff = getBetweenMonth(this.oldestDate, d)
		//Day 0 is the last day in the previous month
		const dayInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
		const monthOffset = Math.round((unitSize.length + 1) * (d.getDate() / dayInMonth))
		if (monthDiff === 0) return monthOffset
		return monthOffset + (unitSize.length + 1) * monthDiff
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

			let upLine = ''
			let midLine = ''
			let downLine = ''
			;(choice.extra as Extra[]).forEach((val) => {
				let pos = this.getAbsPos(val.start)
				const length = this.getAbsPos(val.end) - pos - 4
				if (midLine.length > pos) pos = midLine.length

				const offsetPos = ' '.repeat(pos - midLine.length)
				const outLineLength = val.project.length > length ? val.project.length : length
				const outLine = '─'.repeat(outLineLength)

				upLine += `${offsetPos}╭─${outLine}─╮`
				midLine +=
					`${offsetPos}│ ${val.project}` + ' '.repeat(outLineLength - val.project.length) + ' │'
				downLine += `${offsetPos}╰─${outLine}─╯`
			})

			const isSelected = i - separatorOffset === this.selected
			const outLine = '─'.repeat(choice.name.length)
			const offsetLine = ' '.repeat(this.longestName - choice.name.length)
			upLine = offsetLine + `  ╭─${outLine}─┤` + upLine
			midLine = (isSelected ? '>' : ' ') + offsetLine + ' │ ' + choice.name + ' │' + midLine
			downLine = offsetLine + `  ╰─${outLine}─┤` + downLine

			// If one line is empty (just '\n'), paginator remove it
			let lines =
				(applyOffset(upLine, this.offsetX, width) || ' ') +
				'\n' +
				(applyOffset(midLine, this.offsetX, width) || ' ') +
				'\n' +
				(applyOffset(downLine, this.offsetX, width) || ' ')
			if (isSelected) lines = chalk.cyan(lines)
			output += lines + '\n'
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
		this.offsetX += 8
		this.render()
	}

	onRightKey() {
		if (this.offsetX <= -this.axeX.length) return
		this.offsetX -= 8
		this.render()
	}

	onNumberKey(input: number) {
		if (input <= this.opt.choices.realLength) {
			this.selected = input - 1
		}
		this.render()
	}
}

function getBetweenMonth(a: Date, b: Date) {
	return (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth()
}

/**
 *
 * eg: 'my lonnnnnng line', -1, 9
 * remove left offset: 'y lonnnnnng line'
 * match term length: 'y lonnnnn'
 */
function applyOffset(line: string, offsetX: number, width: number) {
	let newLine = line

	// Real line length with Escape sequences (visual length) for left remove
	const regexLeft = new RegExp('(?:(?:\\033[[0-9;]*m)*.?){0,' + Math.abs(offsetX) + '}')
	const chunkLeft = newLine.match(regexLeft)
	if (chunkLeft) {
		newLine = newLine.substr(chunkLeft[0].length)
	}
	// width - 1 is for terminal length - \n
	const regexSub = new RegExp(
		'(?:(?:\\033[[0-9;]*m)*.?){0,' + Math.floor(width > 0 ? width - 1 : 0) + '}'
	)
	const chunkSub = newLine.match(regexSub)
	if (chunkSub) {
		newLine = chunkSub[0]
	}
	// offsetX >= 0 is lock by default
	// TODO : shift with Escape sequence when offsetX >= 0
	return newLine
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
