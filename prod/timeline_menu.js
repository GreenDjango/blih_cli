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
    let should_quit = false;
    const choices = config.timelines
        .sort((a, b) => a.promo - b.promo)
        .map((val) => {
        return { name: `Promo ${val.promo}`, value: val, short: `Promo ${val.promo}` };
    });
    choices.unshift({ name: '↵ Back', value: undefined, short: '↵ Back' });
    while (!should_quit) {
        const choice = await ui_1.ask_list_index(choices, 'Explore Epitech timelines (Beta test)');
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
    config.timelines = [];
    await Promise.all(timeline_api_1.TimelineApi.timelines.map(async (value) => {
        try {
            const timeline_info = await timelineApi.getTimeline(value);
            timeline_info.projects.forEach((proj) => {
                proj.module = proj.module.replace(/^B\d* *- */m, '');
            });
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
