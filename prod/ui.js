"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.spin = exports.clear_line = exports.ctext = exports.ask_timeline = exports.ask_spinner = exports.ask_local_path = exports.ask_path = exports.ask_autocomplete = exports.ask_question = exports.ask_qcm = exports.ask_email = exports.ask_password = exports.ask_list_index = exports.ask_list = exports.ask_input = void 0;
const inquirer = __importStar(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const utils_1 = require("./utils");
inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));
inquirer.registerPrompt('fuzzypath', require('inquirer-fuzzy-path'));
inquirer.registerPrompt('path', require('./inquirer_plugins/PathPrompt').default);
inquirer.registerPrompt('listspinner', require('./inquirer_plugins/ListSpinnerPrompt').default);
inquirer.registerPrompt('timeline', require('./inquirer_plugins/TimelinePrompt').default);
async function ask_input(message) {
    const prompted = await inquirer.prompt([
        {
            type: 'input',
            name: 'input',
            message: message || '>',
        },
    ]);
    is_verbose();
    return prompted.input;
}
exports.ask_input = ask_input;
async function ask_list(choices, message, return_index) {
    const prompted = await inquirer.prompt([
        {
            type: 'list',
            choices: choices,
            name: 'list',
            message: message || '>',
            pageSize: 10,
        },
    ]);
    is_verbose();
    if (return_index) {
        const idx = choices.findIndex((value) => value === prompted.list);
        if (idx >= 0)
            return idx.toString();
        return '0';
    }
    return prompted.list;
}
exports.ask_list = ask_list;
async function ask_list_index(choices, message) {
    const prompted = await inquirer.prompt([
        {
            type: 'list',
            choices: choices.map((val) => {
                if (!val.short)
                    val.short = val.name;
                return val;
            }),
            name: 'list',
            message: message || '>',
            pageSize: 10,
        },
    ]);
    is_verbose();
    return prompted.list;
}
exports.ask_list_index = ask_list_index;
async function ask_password() {
    const prompted = await inquirer.prompt([
        {
            type: 'password',
            name: 'password',
            mask: '*',
        },
    ]);
    is_verbose();
    return prompted.password;
}
exports.ask_password = ask_password;
async function ask_email() {
    const regex_email = RegExp('([\\w.-]+@([\\w-]+)\\.+\\w{2,})');
    let prompted;
    do {
        prompted = await inquirer.prompt([
            {
                type: 'input',
                name: 'email',
            },
        ]);
        is_verbose();
    } while (!regex_email.test(prompted.email));
    return prompted.email;
}
exports.ask_email = ask_email;
async function ask_qcm(choices, values, checked, message) {
    const choices_bis = choices.map((choice, index) => {
        return { name: choice, value: values[index], checked: checked[index] };
    });
    const prompted = await inquirer.prompt([
        {
            type: 'checkbox',
            choices: choices_bis,
            name: 'checkbox',
            message: message || '>',
        },
    ]);
    is_verbose();
    return prompted.checkbox;
}
exports.ask_qcm = ask_qcm;
async function ask_question(message) {
    const prompted = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirm',
            message: message || '>',
        },
    ]);
    is_verbose();
    return prompted.confirm;
}
exports.ask_question = ask_question;
async function ask_autocomplete(source, message, suggestOnly) {
    let prompted;
    do {
        prompted = await inquirer.prompt([
            {
                type: 'autocomplete',
                name: 'autocomplete',
                message: message || '>',
                pageSize: 10,
                suggestOnly: suggestOnly ? false : true,
                source: async (answer, input) => {
                    const regex_input = RegExp(input, 'i');
                    return source.filter((value) => regex_input.test(value));
                },
            },
        ]);
        is_verbose();
        if (!prompted.autocomplete)
            console.log(chalk_1.default.yellow('Use tab for select'));
    } while (!prompted.autocomplete);
    return prompted.autocomplete;
}
exports.ask_autocomplete = ask_autocomplete;
async function ask_path(message, filter, path, depth, folder) {
    let prompted;
    do {
        prompted = await inquirer.prompt([
            {
                type: 'fuzzypath',
                name: 'fuzzypath',
                message: message || '>',
                itemType: folder === undefined ? undefined : folder ? 'directory' : 'file',
                depthLimit: depth || 4,
                rootPath: path ? path : undefined,
                suggestOnly: true,
                excludePath: (nodePath) => {
                    const regex_input = RegExp('node_modules|\\.git|\\.cache');
                    return regex_input.test(nodePath);
                },
                excludeFilter: (nodePath) => {
                    if (!filter)
                        return false;
                    const regex_input = RegExp(filter);
                    return !regex_input.test(nodePath);
                },
            },
        ]);
        is_verbose();
        if (!prompted.fuzzypath)
            console.log(chalk_1.default.yellow('Use tab for select'));
    } while (!prompted.fuzzypath);
    return prompted.fuzzypath;
}
exports.ask_path = ask_path;
async function ask_local_path(message, path, folder) {
    let prompted;
    do {
        prompted = await inquirer.prompt([
            {
                type: 'path',
                name: 'path',
                message: message || '>',
                itemType: folder === undefined ? undefined : folder ? 'directory' : 'file',
                rootPath: path ? path : undefined,
                suggestOnly: true,
                excludePath: undefined,
                excludeFilter: undefined,
            },
        ]);
        is_verbose();
        if (!prompted.path)
            console.log(chalk_1.default.yellow('Use tab for select'));
    } while (!prompted.path);
    return prompted.path;
}
exports.ask_local_path = ask_local_path;
async function ask_spinner(choices, message) {
    const prompted = await inquirer.prompt([
        {
            type: 'listspinner',
            name: 'listspinner',
            choices: choices,
            message: message || '>',
            pageSize: 10,
        },
    ]);
    is_verbose();
    return prompted.listspinner;
}
exports.ask_spinner = ask_spinner;
async function ask_timeline(choices, message) {
    const new_choices = [];
    // Group all project whith the same module together
    choices.forEach((choice) => {
        const idx = new_choices.findIndex((value2) => value2.module === choice.module);
        if (idx >= 0)
            new_choices[idx].projects.push({
                project: choice.project,
                start: choice.start,
                end: choice.end,
            });
        else
            new_choices.push({
                module: choice.module,
                projects: [{ project: choice.project, start: choice.start, end: choice.end }],
            });
    });
    const prompted = await inquirer.prompt([
        {
            type: 'timeline',
            name: 'timeline',
            choices: new_choices,
            message: message || '>',
            pageSize: 9,
        },
    ]);
    return prompted.listspinner;
}
exports.ask_timeline = ask_timeline;
function ctext(string) {
    const spaces = Math.floor(process.stdout.getWindowSize()[0] / 2 - string.length / 2);
    return Array(spaces + 1).join(' ') + string;
}
exports.ctext = ctext;
function is_verbose() {
    if (!utils_1.VERBOSE)
        clear_line(true);
}
function clear_line(up_line) {
    process.stdout.clearLine(0);
    if (up_line) {
        process.stdout.moveCursor(0, -1);
        process.stdout.clearLine(0);
    }
}
exports.clear_line = clear_line;
function spin(opt) {
    return (0, ora_1.default)({ spinner: utils_1.SPINNER, ...opt });
}
exports.spin = spin;
