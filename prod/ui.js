"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const inquirer = __importStar(require("inquirer"));
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
        if (return_index) {
            const idx = choices.findIndex(value => value === prompted.list);
            if (idx >= 0)
                return idx.toString();
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
        return prompted.confirm;
    });
}
exports.ask_question = ask_question;
function ask_autocomplete(source, message) {
    return __awaiter(this, void 0, void 0, function* () {
        let prompted;
        do {
            prompted = yield inquirer.prompt([
                {
                    type: 'autocomplete',
                    name: 'autocomplete',
                    message: message || '>',
                    suggestOnly: true,
                    source: (answer, input) => __awaiter(this, void 0, void 0, function* () {
                        const regex_input = RegExp(input);
                        return source.filter(value => regex_input.test(value));
                    }),
                },
            ]);
        } while (!prompted.autocomplete);
        return prompted.autocomplete;
    });
}
exports.ask_autocomplete = ask_autocomplete;
function ask_path(message, filter, path) {
    return __awaiter(this, void 0, void 0, function* () {
        let prompted;
        do {
            prompted = yield inquirer.prompt([
                {
                    type: 'fuzzypath',
                    name: 'fuzzypath',
                    message: message,
                    itemType: 'file',
                    depthLimit: 4,
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
        return prompted.input;
    });
}
exports.ask_input = ask_input;
