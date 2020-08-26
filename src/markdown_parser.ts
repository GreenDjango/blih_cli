import chalk from 'chalk'

export function md_parser(to_md: string) {
	let src = to_md
	const width = cli_width()

	// Remove empty lines
	src = src.replace(/^\s*\n/gm, '')
	// ``` Indented code Rules
	src = src.replace(/^ *`{3}.*?$(.*?)`{3} *$/gms, (_: string, p1: string) => {
		return p1
			.split('\n')
			.map((val) => (val ? `%NOPARSER%  |  ${chalk.inverse(val)}` : ''))
			.join('\n')
	})
	// 4spaces Indented code Rules
	src = src.replace(/^( {4}.*\n)+/gm, (_: string) => {
		return '\n' + _.replace(/^ {4}(.*)$/gm, `%NOPARSER%  |  ${chalk.inverse('$1')}`) + '\n'
	})
	// # Heading
	src = src.replace(/^(#{1,6}) *(.*)$/gm, (_: string, p1: string, p2: string) => {
		return `\n%NOPARSER%${'─'.repeat(p1.length - 1)}${chalk.bold(p2)} (H${p1.length})`
	})
	// >> Blockquotes Rules
	src = src.replace(/^(>[>| ]*)/gm, (_: string, p1: string) => {
		const indent = (p1.match(/>/g) || []).length
		return `%NOPARSER%${'|'.repeat(indent)} `
	})
	// - List Unordered Rules
	src = src.replace(/^( *)[*+-] /gm, (_: string, p1: string) => {
		return `%NOPARSER%${' '.repeat((p1.length / 2) * 2)}    • `
	})
	// 1. List Ordered Rules
	const arr: any = {}
	const gex = /^ *(\d+)\. .*$/gm
	for (let res = gex.exec(src); res !== null; res = gex.exec(src)) {
		arr[gex.lastIndex + 1] = parseInt(res[1])
	}
	src = src.replace(/^ *(\d+)\. (.*)$/gm, (_: string, p1: string, p2: string, idx: number) => {
		const new_list_nb = typeof arr[idx] === 'number' ? (arr[idx] || 0) + 1 : parseInt(p1)
		arr[idx + _.length + 1] = new_list_nb
		return `%NOPARSER%    ${new_list_nb}. ${p2}`
	})
	// --- Horizontal Rules
	src = src.replace(/^ *[-*_]{3,} *$/gm, () => {
		if (width < 3) return '─'.repeat(width)
		return `\n%NOPARSER%◈${'─'.repeat(width - 2)}◈\n`
	})
	// Strikethrough Rules
	src = src.replace(/[~]{2}(.+?)[~]{2}/gm, chalk.strikethrough('$1'))
	// Bold Rules
	src = src.replace(/[*_]{2}(.+?)[*_]{2}/gm, chalk.bold('$1'))
	// Italic Rules
	src = src.replace(/[*_](.+?)[*_]/gm, chalk.italic('$1'))
	// `` Inline code Rules
	src = src.replace(/[`](.+?)[`]/gm, chalk.inverse('$1'))
	// Indent all with 2 spaces & Remove #NOPARSER#
	src = src.replace(
		/^(%NOPARSER%|)( *)(.*$)/gm,
		(_: string, p1: string, p2: string, p3: string) => {
			if (p1) return p2 + p3
			return `  ${p3}`
		}
	)
	src = src.replace(/%NOPARSER%/gm, '')

	return src
}

function cli_width() {
	const opts = {
		defaultWidth: 80,
		output: process.stdout,
		tty: require('tty'),
	} as {
		defaultWidth: number
		output?: NodeJS.WriteStream
		tty?: NodeJS.WriteStream
	}

	if (opts.output?.getWindowSize) {
		return opts.output.getWindowSize()[0] || opts.defaultWidth
	}
	if (opts.tty?.getWindowSize) {
		return opts.tty.getWindowSize()[1] || opts.defaultWidth
	}
	if (opts.output?.columns) {
		return opts.output.columns
	}
	if (process.env.CLI_WIDTH) {
		const width = parseInt(process.env.CLI_WIDTH, 10)
		if (!isNaN(width) && width !== 0) {
			return width
		}
	}
	return opts.defaultWidth
}
