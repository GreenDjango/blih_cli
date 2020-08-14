"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable */
const chalk_1 = __importDefault(require("chalk"));
const operators_1 = require("rxjs/operators");
const base_1 = __importDefault(require("inquirer/lib/prompts/base"));
const events_1 = __importDefault(require("inquirer/lib/utils/events"));
const paginator_1 = __importDefault(require("inquirer/lib/utils/paginator"));
const cli_spinners_1 = __importDefault(require("cli-spinners"));
// @ts-ignore
const cli_cursor_1 = __importDefault(require("cli-cursor"));
// @ts-ignore
const run_async_1 = __importDefault(require("run-async"));
/**
 * message: string, top content
 * choices: string[], spinner names or text
 * pageSize: number, size of list to show
 * default: number | string, index or value to show first
 */
class ListSpinnerPrompt extends base_1.default {
    constructor(questions, rl, answers) {
        super(questions, rl, answers);
        if (!this.opt.choices) {
            this.throwParamError('choices');
        }
        this.showHelp = true;
        this.selected = 0;
        this.done = undefined;
        this.id = undefined;
        this.frame_idx = 0;
        const def = this.opt.default;
        // If def is a Number, then use as index. Otherwise, check for value.
        if (typeof def === 'number' && def >= 0 && def < this.opt.choices.realLength) {
            this.selected = def;
        }
        else if (!(typeof def === 'number') && def !== null) {
            const index = this.opt.choices.realChoices.findIndex(({ value }) => value === def);
            this.selected = Math.max(index, 0);
        }
        // Make sure no default is set (so it won't be printed)
        this.opt.default = null;
        this.paginator = new paginator_1.default(this.screen);
    }
    //Start the Inquiry session
    _run(cb) {
        this.done = cb;
        const self = this;
        const events = events_1.default(this.rl);
        events.normalizedUpKey.pipe(operators_1.takeUntil(events.line)).forEach(this.onUpKey.bind(this));
        events.normalizedDownKey.pipe(operators_1.takeUntil(events.line)).forEach(this.onDownKey.bind(this));
        // @ts-ignore
        events.numberKey.pipe(operators_1.takeUntil(events.line)).forEach(this.onNumberKey.bind(this));
        events.line
            .pipe(operators_1.take(1), operators_1.map(this.getCurrentValue.bind(this)), operators_1.flatMap((value) => run_async_1.default(self.opt.filter)(value).catch((err) => err)))
            .forEach(this.onSubmit.bind(this));
        // Init the prompt
        cli_cursor_1.default.hide();
        this.render(true);
        // Init interval render for spinners
        this.id = setInterval(this.render.bind(this), 110);
        return this;
    }
    // Render the prompt to screen
    render(ignore_spinners) {
        // Render question
        let message = this.getQuestion();
        if (this.showHelp) {
            message += chalk_1.default.dim('(Use arrow keys)');
        }
        // Render choices or answer depending on the state
        if (this.status === 'answered') {
            message += chalk_1.default.cyan(this.opt.choices.getChoice(this.selected).short);
        }
        else {
            const choicesStr = listRender(this.opt.choices, this.selected, this.frame_idx);
            if (!ignore_spinners)
                this.frame_idx++;
            // @ts-ignore
            const indexPosition = this.opt.choices.indexOf(this.opt.choices.getChoice(this.selected));
            // @ts-ignore
            message += '\n' + this.paginator.paginate(choicesStr, indexPosition, this.opt.pageSize);
        }
        this.screen.render(message, undefined);
    }
    /**
     * When user press `enter` key
     */
    onSubmit(value) {
        this.status = 'answered';
        if (this.id)
            clearInterval(this.id);
        this.id = undefined;
        this.showHelp = false;
        // Rerender prompt
        this.render(true);
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
        this.showHelp = false;
        this.render(true);
    }
    onDownKey() {
        const len = this.opt.choices.realLength;
        this.selected = this.selected < len - 1 ? this.selected + 1 : 0;
        this.showHelp = false;
        this.render(true);
    }
    onNumberKey(input) {
        if (input <= this.opt.choices.realLength) {
            this.selected = input - 1;
        }
        this.showHelp = false;
        this.render(true);
    }
}
exports.default = ListSpinnerPrompt;
// Function for rendering list choices
function listRender(choices, pointer, frame_idx) {
    let output = '';
    let separatorOffset = 0;
    choices.forEach((choice, i) => {
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
        const isSelected = i - separatorOffset === pointer;
        //spinner.spinner = choice.name as any
        let spinner_frame = '';
        if (cli_spinners_1.default[choice.name]) {
            const length = cli_spinners_1.default[choice.name].frames.length;
            spinner_frame = ' ' + cli_spinners_1.default[choice.name].frames[frame_idx % length];
        }
        let line = (isSelected ? '> ' : '  ') + choice.name + spinner_frame;
        if (isSelected) {
            line = chalk_1.default.cyan(line);
        }
        output += line + ' \n';
    });
    return output.replace(/\n$/, '');
}
