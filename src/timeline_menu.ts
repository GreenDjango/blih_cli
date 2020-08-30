import chalk from 'chalk'
import { TimelineApi } from './timeline_api'
import { ask_list_index, ask_timeline, spin } from './ui'
import { ConfigType, print_message } from './utils'

export async function timeline_menu(config: ConfigType) {
	if (!config.timelines.length) await fetch_timelines(config)

	let should_quit = false
	const choices = config.timelines
		.sort((a, b) => a.promo - b.promo)
		.map((val) => {
			return { name: `Promo ${val.promo}`, value: val, short: `Promo ${val.promo}` }
		})
	choices.unshift({ name: '↵ Back', value: undefined as any, short: '↵ Back' })

	while (!should_quit) {
		const choice = await ask_list_index(choices, 'Explore Epitech timelines (Beta test)')
		if (!choice) {
			should_quit = true
			continue
		}

		await ask_timeline(
			choice.projects.filter((value) => value.bttf !== true),
			`Promo ${choice.promo}`
		)
	}
}

async function fetch_timelines(config: ConfigType) {
	const spinner = spin().start(chalk.green('Fetch timelines...'))

	const timelineApi = new TimelineApi()
	let error = 0
	let errorMsg = ''

	config.timelines = []
	await Promise.all(
		TimelineApi.timelines.map(async (value) => {
			try {
				const timeline_info = await timelineApi.getTimeline(value)
				timeline_info.projects.forEach((proj) => {
					proj.module = proj.module.replace(/^B\d* *- */m, '')
				})
				if (timeline_info) config.timelines.push(timeline_info)
			} catch (err) {
				error++
				if (errorMsg) errorMsg += '\n' + err
				else errorMsg += err
			}
		})
	)
	spinner.stop()
	if (error) {
		print_message(errorMsg, '', 'fail')
	}
}
