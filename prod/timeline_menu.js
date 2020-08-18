"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeline_menu = void 0;
const chalk_1 = __importDefault(require("chalk"));
const timeline_api_1 = require("./timeline_api");
const ui_1 = require("./ui");
const utils_1 = require("./utils");
async function timeline_menu(config) {
    if (!config.timelines.length)
        await fetch_timelines(config);
    /*await ask_timeline(
        config.timelines[0].projects.filter((value) => value.bttf !== true),
        `Promo ${config.timelines[0].promo}`
    )*/
    let should_quit = false;
    const choices = config.timelines
        .sort((a, b) => a.promo - b.promo)
        .map((val) => {
        return { name: `Promo ${val.promo}`, value: val, short: `Promo ${val.promo}` };
    });
    choices.unshift({ name: '↵ Back', value: undefined, short: '↵ Back' });
    while (!should_quit) {
        const choice = await ui_1.ask_list_index(choices, 'Explore Epitech timelines');
        if (!choice) {
            should_quit = true;
            continue;
        }
        await ui_1.ask_timeline(choice.projects.filter((value) => value.bttf !== true), `Promo ${choice.promo}`);
    }
}
exports.timeline_menu = timeline_menu;
async function fetch_timelines(config) {
    const spinner = ui_1.spin().start(chalk_1.default.green('Fetch timelines...'));
    const timelineApi = new timeline_api_1.TimelineApi();
    let error = 0;
    let errorMsg = '';
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
    config.timelines = [];
    await Promise.all(timeline_api_1.TimelineApi.timelines.map(async (value) => {
        try {
            const timeline_info = await timelineApi.getTimeline(value);
            /* TODO : remove 'B5 -' before module name
            timeline_info.projects = timeline_info.projects.map((proj) => {
                proj.module = proj.module.split('-').slice(1).join().trim()
                return proj
            })*/
            if (timeline_info)
                config.timelines.push(timeline_info);
        }
        catch (err) {
            error++;
            if (errorMsg)
                errorMsg += '\n' + err;
            else
                errorMsg += err;
        }
    }));
    spinner.stop();
    if (error) {
        utils_1.print_message(errorMsg, '', 'fail');
    }
}
