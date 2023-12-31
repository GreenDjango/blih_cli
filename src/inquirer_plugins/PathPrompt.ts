/**
 * Copyright (c) 2020 Blih CLI
 *
 * Path prompt plugin for inquirer
 * Work like the autocomplete of bash
 * (https://npmjs.com/package/inquirer)
 *
 * @summary Path prompt plugin for inquirer
 * @author Theo <@GreenDjango>
 */

import type { Interface as ReadLineInterface } from 'readline'
import type { Answers, Question } from 'inquirer'
import { readdirSync, statSync } from 'fs'
import path from 'path'
import Choices from 'inquirer/lib/objects/choices'
import InquirerAutocomplete from 'inquirer-autocomplete-prompt'
// @ts-expect-error no type invalide
import stripAnsi from 'strip-ansi'
import style from 'ansi-styles'
import fuzzy from 'fuzzy'

type Options = Question & {
	itemType?: 'any' | 'directory' | 'file'
	rootPath?: string
	excludePath?: (path: string) => boolean
	excludeFilter?: (path: string) => boolean
}

/**
 * message: string, top content
 * pageSize: number, size of list to show
 * itemType: 'any' | 'directory' | 'file'
 * rootPath: string
 * excludePath: (path: string) => boolean
 * excludeFilter: (path: string) => boolean
 * suggestOnly: boolean
 * default: number | string, index or value to show first
 */
export default class PathPrompt<T extends Answers> extends InquirerAutocomplete<T> {
	constructor(question: Options, rl: ReadLineInterface, answers: Answers) {
		const {
			itemType = 'any',
			rootPath = '.',
			excludePath = () => false,
			excludeFilter = false as any,
		} = question
		const questionBase = {
			...question,
			source: async (_: Answers, searchTerm: string) =>
				getPaths(rootPath, searchTerm, excludePath, excludeFilter, itemType, question.default),
		}
		super(questionBase as any, rl, answers)
	}

	override search(searchTerm: string) {
		return super.search(searchTerm).then(() => {
			this.currentChoices.getChoice = (choiceIndex) => {
				const choice = Choices.prototype.getChoice.call(this.currentChoices, choiceIndex)
				return {
					value: stripAnsi(choice.value),
					name: stripAnsi(choice.name || 'Empty'),
					short: stripAnsi(choice.name || 'Empty'),
				}
			}
		})
	}

	/**
	 * When user press `enter` key
	 */
	override onSubmit(line: string) {
		super.onSubmit(stripAnsi(line))
	}
}

function getPaths(
	rootPath: string,
	searchTerm: string,
	excludePath: (path: string) => boolean,
	excludeFilter: ((path: string) => boolean) | undefined,
	itemType: 'any' | 'directory' | 'file',
	defaultItem: any
) {
	const pathDir = searchTerm?.includes('/')
		? searchTerm.substring(0, searchTerm.lastIndexOf('/') + 1)
		: rootPath

	const nodeList = [pathDir].map((nodePath) => {
		if (excludePath(nodePath)) {
			return []
		}
		try {
			const res: string[] = []
			const currentNode = itemType === 'file' ? [] : ['.', '..']
			currentNode.push(...readdirSync(nodePath))
			currentNode.forEach((val) => {
				let realPath = path.join(nodePath, val)
				const stat = statSync(realPath)
				if (
					(itemType === 'directory' && stat.isFile()) ||
					(itemType === 'file' && stat.isDirectory())
				)
					return
				if (stat.isDirectory() && realPath[realPath.length - 1] !== '/') realPath += '/'
				res.push(realPath)
			})
			return res
		} catch (err) {
			return []
		}
	})[0]

	const preFilteredNodes = !excludeFilter
		? nodeList
		: nodeList?.filter((node) => excludeFilter(node))

	const fuzzOptions = {
		pre: style.green.open,
		post: style.green.close,
	}
	const filteredNodes = fuzzy
		.filter(searchTerm || '', preFilteredNodes ?? [], fuzzOptions)
		.map((e) => e.string)
	if (!searchTerm && defaultItem) {
		filteredNodes.unshift(defaultItem)
	}
	return filteredNodes
}
