import chalk from 'chalk'
import { TimelineApi } from './timeline_api'
import { ask_list_index, ask_timeline, spin } from './ui'
import { ConfigType, print_message } from './utils'

export async function timeline_menu(config: ConfigType) {
	if (!config.timelines.length) await fetch_timelines(config)
	/*await ask_timeline(
		config.timelines[0].projects.filter((value) => value.bttf !== true),
		`Promo ${config.timelines[0].promo}`
	)*/

	let should_quit = false
	const choices = config.timelines
		.sort((a, b) => a.promo - b.promo)
		.map((val) => {
			return { name: `Promo ${val.promo}`, value: val, short: `Promo ${val.promo}` }
		})
	choices.unshift({ name: '↵ Back', value: undefined as any, short: '↵ Back' })

	while (!should_quit) {
		const choice = await ask_list_index(choices, 'Explore Epitech timelines')
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
	/*
	config.timelines.push({
		promo: 2022,
		semester: 5,
		projects: [
			{
				module: 'B5 - FR - Écrits Professionnels',
				project: 'Mémo professionel',
				start: '2019-10-28',
				end: '2019-11-17',
				bttf: false,
			},
			{
				module: 'B5 - FR - Écrits Professionnels',
				project: 'Avocat du diable',
				start: '2019-09-16',
				end: '2019-10-06',
				bttf: false,
			},
			{
				module: 'B5 - FR - Écrits Professionnels',
				project: '3 emails',
				start: '2019-10-07',
				end: '2019-10-27',
				bttf: false,
			},
			{
				module: 'B5 - AppDev - AREA',
				project: 'AREA',
				start: '2020-01-06',
				end: '2020-03-01',
				bttf: false,
			},
			{
				module: 'B5 - AppDev - Dashboard',
				project: 'Dashboard',
				start: '2019-10-28',
				end: '2019-11-17',
				bttf: false,
			},
		],
	})
	spinner.stop()
	return*/
	config.timelines = []
	await Promise.all(
		TimelineApi.timelines.map(async (value) => {
			try {
				const timeline_info = await timelineApi.getTimeline(value)
				/* TODO : remove 'B5 -' before module name
				timeline_info.projects = timeline_info.projects.map((proj) => {
					proj.module = proj.module.split('-').slice(1).join().trim()
					return proj
				})*/
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
