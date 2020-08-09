"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clear_line = exports.ctext = exports.ask_input = exports.ask_path = exports.ask_autocomplete = exports.ask_question = exports.ask_qcm = exports.ask_email = exports.ask_password = exports.ask_list = void 0;
const inquirer = __importStar(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const utils_1 = require("./utils");
inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));
inquirer.registerPrompt('fuzzypath', require('inquirer-fuzzy-path'));
function ask_list(choices, message, return_index) {
    return __awaiter(this, void 0, void 0, function* () {
        const prompted = yield inquirer.prompt([
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
            const idx = choices.findIndex(value => value === prompted.list);
            if (idx >= 0)
                return idx.toString();
            return '0';
        }
        return prompted.list;
    });
}
exports.ask_list = ask_list;
function ask_password() {
    return __awaiter(this, void 0, void 0, function* () {
        const prompted = yield inquirer.prompt([
            {
                type: 'password',
                name: 'password',
                mask: '*',
            },
        ]);
        is_verbose();
        return prompted.password;
    });
}
exports.ask_password = ask_password;
function ask_email() {
    return __awaiter(this, void 0, void 0, function* () {
        const regex_email = RegExp('([\\w.-]+@([\\w-]+)\\.+\\w{2,})');
        let prompted;
        do {
            prompted = yield inquirer.prompt([
                {
                    type: 'input',
                    name: 'email',
                },
            ]);
            is_verbose();
        } while (!regex_email.test(prompted.email));
        return prompted.email;
    });
}
exports.ask_email = ask_email;
function ask_qcm(choices, values, checked, message) {
    return __awaiter(this, void 0, void 0, function* () {
        const choices_bis = choices.map((choice, index) => {
            return { name: choice, value: values[index], checked: checked[index] };
        });
        const prompted = yield inquirer.prompt([
            {
                type: 'checkbox',
                choices: choices_bis,
                name: 'checkbox',
                message: message || '>',
            },
        ]);
        is_verbose();
        return prompted.checkbox;
    });
}
exports.ask_qcm = ask_qcm;
function ask_question(message) {
    return __awaiter(this, void 0, void 0, function* () {
        const prompted = yield inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: message || '>',
            },
        ]);
        is_verbose();
        return prompted.confirm;
    });
}
exports.ask_question = ask_question;
function ask_autocomplete(source, message, suggestOnly) {
    return __awaiter(this, void 0, void 0, function* () {
        let prompted;
        do {
            prompted = yield inquirer.prompt([
                {
                    type: 'autocomplete',
                    name: 'autocomplete',
                    message: message || '>',
                    pageSize: 10,
                    suggestOnly: suggestOnly ? false : true,
                    source: (answer, input) => __awaiter(this, void 0, void 0, function* () {
                        const regex_input = RegExp(input, 'i');
                        return source.filter(value => regex_input.test(value));
                    }),
                },
            ]);
            is_verbose();
            if (!prompted.autocomplete)
                console.log(chalk_1.default.yellow('Use tab for select'));
        } while (!prompted.autocomplete);
        return prompted.autocomplete;
    });
}
exports.ask_autocomplete = ask_autocomplete;
function ask_path(message, filter, path, depth, folder) {
    return __awaiter(this, void 0, void 0, function* () {
        let prompted;
        do {
            prompted = yield inquirer.prompt([
                {
                    type: 'fuzzypath',
                    name: 'fuzzypath',
                    message: message || '>',
                    itemType: folder ? 'folder' : 'file',
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
    });
}
exports.ask_path = ask_path;
function ask_input(message) {
    return __awaiter(this, void 0, void 0, function* () {
        const prompted = yield inquirer.prompt([
            {
                type: 'input',
                name: 'input',
                message: message || '>',
            },
        ]);
        is_verbose();
        return prompted.input;
    });
}
exports.ask_input = ask_input;
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
