"use strict";
/**
 * Copyright (c) 2020 Blih CLI
 *
 * Timeline prompt plugin for inquirer
 * (https://npmjs.com/package/inquirer)
 *
 * @summary Timeline prompt plugin for inquirer
 * @author Theo <@GreenDjango>
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const base_1 = __importDefault(require("inquirer/lib/prompts/base"));
const events_1 = __importDefault(require("inquirer/lib/utils/events"));
const paginator_1 = __importDefault(require("inquirer/lib/utils/paginator"));
const cli_cursor_1 = __importDefault(require("cli-cursor"));
// @ts-expect-error no type invalide
const run_async_1 = __importDefault(require("run-async"));
// @ts-expect-error no type invalide
const cli_width_1 = __importDefault(require("cli-width"));
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const unitSize = '------------------------------------------------------';
/**
 * @param message string, top content
 * @param choices: { module: string; projects: { project: string; start: string; end: string }[]}[], timeline projects
 * @param pageSize: number, size of list to show
 * @param default: number | string, index or value to show first
 */
class TimelinePrompt extends base_1.default {
    constructor(questions, rl, answers) {
        questions.choices = [...questions.choices].map((value) => {
            value.name = value.module;
            value.type = value.type || 'choice';
            value.extra = value.projects
                .map((v) => {
                const end_date = new Date(v.end);
                end_date.setDate(end_date.getDate() + 1);
                return { project: v.project, start: new Date(v.start), end: end_date };
            })
                .sort((a, b) => a.start.getTime() - b.start.getTime());
            delete value.module;
            delete value.projects;
            return value;
        });
        super(questions, rl, answers);
        if (!this.opt.choices) {
            this.throwParamError('choices');
        }
        this.showHelp = true;
        this.selected = 0;
        this.offsetX = 0;
        this.done = null;
        this.axeX = '';
        this.unitsX = '';
        this.longestName = 0;
        this.oldestDate = null;
        this.latestDate = null;
        this.setup();
        const def = this.opt.default;
        // If def is a Number, then use as index. Otherwise, check for value.
        if (typeof def === 'number' && def >= 0 && def < this.opt.choices.realLength) {
            this.selected = def;
        }
        else if (!(typeof def === 'number') && def != null) {
            const index = this.opt.choices.realChoices.findIndex(({ value }) => value === def);
            this.selected = Math.max(index, 0);
        }
        // Make sure no default is set (so it won't be printed)
        this.opt.default = null;
        this.paginator = new paginator_1.default(this.screen);
    }
    setup() {
        // set longestName, oldestDate, latestDate
        this.opt.choices.forEach((choice) => {
            if (choice.type !== 'choice')
                return;
            const extra = choice.extra;
            if (choice.name.length > this.longestName)
                this.longestName = choice.name.length;
            if (!this.oldestDate || (extra[0]?.start && this.oldestDate > extra[0].start)) {
                this.oldestDate = extra[0]?.start ?? null;
            }
            const latest = extra.reduce((a, b) => (a.end > b.end ? a : b));
            if (!this.latestDate || this.latestDate < latest?.end)
                this.latestDate = latest?.end;
        });
        if (!this.oldestDate || !this.latestDate) {
            this.oldestDate = new Date();
            this.latestDate = new Date(this.oldestDate.getFullYear(), this.oldestDate.getMonth() + 3);
        }
        const monthLength = getBetweenMonth(this.oldestDate, this.latestDate) + 1;
        this.axeX = '─'.repeat(this.longestName + 5) + '┤' + `${unitSize}|`.repeat(monthLength);
        for (let i = 0; i <= monthLength; i++) {
            const month = months[(this.oldestDate.getMonth() + i) % 12] ?? '';
            this.unitsX +=
                ' '.repeat(unitSize.length -
                    Math.floor(month.length / 2) -
                    (this.unitsX.length % (unitSize.length + 1))) + month;
        }
        this.unitsX = ' '.repeat(this.longestName + 4) + this.unitsX.replace(/ */, '');
    }
    //Start the Inquiry session
    _run(cb) {
        this.done = cb;
        const self = this;
        const events = (0, events_1.default)(this.rl);
        const eventsCustom = observeCustom(this.rl);
        events.normalizedUpKey.pipe((0, operators_1.takeUntil)(events.line)).forEach(this.onUpKey.bind(this));
        events.normalizedDownKey.pipe((0, operators_1.takeUntil)(events.line)).forEach(this.onDownKey.bind(this));
        eventsCustom.normalizedLeftKey.pipe((0, operators_1.takeUntil)(events.line)).forEach(this.onLeftKey.bind(this));
        eventsCustom.normalizedRightKey.pipe((0, operators_1.takeUntil)(events.line)).forEach(this.onRightKey.bind(this));
        events.line
            .pipe((0, operators_1.take)(1), (0, operators_1.map)(this.getCurrentValue.bind(this)), (0, operators_1.flatMap)((value) => (0, run_async_1.default)(self.opt.filter)(value).catch((err) => err)))
            .forEach(this.onSubmit.bind(this));
        // Init the prompt
        cli_cursor_1.default.hide();
        this.render();
        return this;
    }
    getAbsPos(d) {
        const monthDiff = getBetweenMonth(this.oldestDate ?? new Date(), d);
        //Day 0 is the last day in the previous month
        const dayInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        const monthOffset = Math.round((unitSize.length + 1) * (d.getDate() / dayInMonth));
        if (monthDiff === 0)
            return monthOffset;
        return monthOffset + (unitSize.length + 1) * monthDiff;
    }
    // Render the prompt to screen
    render() {
        // Render question
        let message = this.getQuestion();
        if (this.showHelp) {
            message += chalk_1.default.dim('(Use arrow keys)');
            this.showHelp = false;
        }
        // Render choices or answer depending on the state
        if (this.status === 'answered') {
            message += chalk_1.default.cyan(this.opt.choices.getChoice(this.selected).short);
        }
        else {
            const choicesStr = this.listRender();
            const indexPosition = this.opt.choices.indexOf(this.opt.choices.getChoice(this.selected));
            message += '\n' + this.paginator.paginate(choicesStr, indexPosition * 3 + 1);
        }
        const bottomContent = this.status === 'answered' ? undefined : this.bottomRender();
        this.screen.render(message, bottomContent);
    }
    // Function for rendering list choices
    listRender() {
        let output = '';
        let separatorOffset = 0;
        const width = (0, cli_width_1.default)({ defaultWidth: 80, output: this.rl.output });
        this.opt.choices.forEach((choice, i) => {
            if (choice.type === 'separator') {
                separatorOffset++;
                output += '  ' + choice + '\n';
                return;
            }
            if (choice.disabled) {
                separatorOffset++;
                output += '  - ' + choice.name;
                output += ' (' + (typeof choice.disabled === 'string' ? choice.disabled : 'Disabled') + ')';
                output += '\n';
                return;
            }
            let upLine = '';
            let midLine = '';
            let downLine = '';
            choice.extra.forEach((val) => {
                let pos = this.getAbsPos(val.start);
                const length = this.getAbsPos(val.end) - pos - 4;
                if (midLine.length > pos)
                    pos = midLine.length;
                const offsetPos = ' '.repeat(pos - midLine.length);
                const outLineLength = val.project.length > length ? val.project.length : length;
                const outLine = '─'.repeat(outLineLength);
                upLine += `${offsetPos}╭─${outLine}─╮`;
                midLine +=
                    `${offsetPos}│ ${val.project}` + ' '.repeat(outLineLength - val.project.length) + ' │';
                downLine += `${offsetPos}╰─${outLine}─╯`;
            });
            const isSelected = i - separatorOffset === this.selected;
            const outLine = '─'.repeat(choice.name.length);
            const offsetLine = ' '.repeat(this.longestName - choice.name.length);
            upLine = offsetLine + `  ╭─${outLine}─┤` + upLine;
            midLine = (isSelected ? '>' : ' ') + offsetLine + ' │ ' + choice.name + ' │' + midLine;
            downLine = offsetLine + `  ╰─${outLine}─┤` + downLine;
            // If one line is empty (just '\n'), paginator remove it
            let lines = (applyOffset(upLine, this.offsetX, width) || ' ') +
                '\n' +
                (applyOffset(midLine, this.offsetX, width) || ' ') +
                '\n' +
                (applyOffset(downLine, this.offsetX, width) || ' ');
            if (isSelected)
                lines = chalk_1.default.cyan(lines);
            output += lines + '\n';
        });
        return output.replace(/\n$/, '');
    }
    // Function for rendering bottom content
    bottomRender() {
        const width = (0, cli_width_1.default)({ defaultWidth: 80, output: this.rl.output });
        const axe = applyOffset(this.axeX, this.offsetX, width);
        const output = axe + ' \n' + applyOffset(this.unitsX, this.offsetX, width) + ' \n';
        return output.replace(/\n$/, '');
    }
    /**
     * When user press `enter` key
     */
    onSubmit(value) {
        this.status = 'answered';
        // Rerender prompt
        this.render();
        this.screen.done();
        cli_cursor_1.default.show();
        if (this.done)
            this.done(value);
    }
    getCurrentValue() {
        return this.opt.choices.getChoice(this.selected).value;
    }
    /**
     * When user press a key
     */
    onUpKey() {
        const len = this.opt.choices.realLength;
        this.selected = this.selected > 0 ? this.selected - 1 : len - 1;
        this.render();
    }
    onDownKey() {
        const len = this.opt.choices.realLength;
        this.selected = this.selected < len - 1 ? this.selected + 1 : 0;
        this.render();
    }
    onLeftKey() {
        if (this.offsetX >= 0)
            return;
        this.offsetX += 8;
        this.render();
    }
    onRightKey() {
        if (this.offsetX <= -this.axeX.length)
            return;
        this.offsetX -= 8;
        this.render();
    }
}
exports.default = TimelinePrompt;
function getBetweenMonth(a, b) {
    return (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth();
}
/**
 *
 * eg: 'my lonnnnnng line', -1, 9
 * remove left offset: 'y lonnnnnng line'
 * match term length: 'y lonnnnn'
 */
function applyOffset(line, offsetX, width) {
    let newLine = line;
    // Real line length with Escape sequences (visual length) for left remove
    const regexLeft = new RegExp('(?:(?:\\033[[0-9;]*m)*.?){0,' + Math.abs(offsetX) + '}');
    const chunkLeft = newLine.match(regexLeft);
    if (chunkLeft) {
        newLine = newLine.substr(chunkLeft[0].length);
    }
    // width - 1 is for terminal length - \n
    const regexSub = new RegExp('(?:(?:\\033[[0-9;]*m)*.?){0,' + Math.floor(width > 0 ? width - 1 : 0) + '}');
    const chunkSub = newLine.match(regexSub);
    if (chunkSub) {
        newLine = chunkSub[0];
    }
    // offsetX >= 0 is lock by default
    // TODO : shift with Escape sequence when offsetX >= 0
    return newLine;
}
function observeCustom(rl) {
    const keypress = (0, rxjs_1.fromEvent)(rl.input, 'keypress', (value, key) => {
        return { value: value, key: key || {} };
    })
        // Ignore `enter` key. On the readline, we only care about the `line` event.
        .pipe((0, operators_1.filter)(({ key }) => key.name !== 'enter' && key.name !== 'return'));
    return {
        normalizedLeftKey: keypress.pipe((0, operators_1.filter)(({ key }) => key.name === 'left'), (0, operators_1.share)()),
        normalizedRightKey: keypress.pipe((0, operators_1.filter)(({ key }) => key.name === 'right'), (0, operators_1.share)()),
    };
}
