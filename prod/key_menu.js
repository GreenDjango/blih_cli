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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.key_menu = void 0;
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
const os_1 = require("os");
const fs_1 = __importDefault(require("fs"));
const ui_1 = require("./ui");
const utils_1 = require("./utils");
const HOME_DIR = os_1.homedir();
function key_menu(api) {
    return __awaiter(this, void 0, void 0, function* () {
        let should_quit = false;
        const choices = ['↵ Back', 'Add key', 'Delete key', 'Show keys list'];
        while (!should_quit) {
            const choice = yield ui_1.ask_list(choices, 'Manage your SSH keys');
            switch (choice) {
                case choices[1]:
                    yield add_key(api);
                    break;
                case choices[2]:
                    yield delete_key(api);
                    break;
                case choices[3]:
                    yield show_key(api);
                    break;
                case choices[0]:
                default:
                    should_quit = true;
            }
        }
    });
}
exports.key_menu = key_menu;
function add_key(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const new_ssh = yield ui_1.ask_question('Create new ssh key ?');
        const spinner = ora_1.default();
        spinner.color = 'blue';
        try {
            let path = '';
            if (new_ssh) {
                let name = 'epitech_key';
                if (fs_1.default.existsSync(`${HOME_DIR}/.ssh/${name}.pub`)) {
                    do {
                        name = yield ui_1.ask_input(`${name} already exist, new Key name ?`);
                    } while (fs_1.default.existsSync(`${HOME_DIR}/.ssh/${name}.pub`));
                }
                if (!fs_1.default.existsSync(`${HOME_DIR}/.ssh`)) {
                    fs_1.default.mkdirSync(`${HOME_DIR}/.ssh`);
                }
                spinner.start(chalk_1.default.green(utils_1.WAIT_MSG));
                yield utils_1.sh(`ssh-keygen -f ${HOME_DIR}/.ssh/${name} -N ""`);
                yield utils_1.sh(`ssh-add ${HOME_DIR}/.ssh/${name}`);
                path = `${HOME_DIR}/.ssh/${name}.pub`;
            }
            else {
                path = yield ui_1.ask_path('Ssh key path:', '\\.pub$', `${HOME_DIR}/`);
                spinner.info(utils_1.clor.info('Use `ssh-add ' + path + '` for enable the key'));
                spinner.start(chalk_1.default.green(utils_1.WAIT_MSG));
            }
            let key = fs_1.default.readFileSync(path, 'utf8');
            key = key.replace('\n', '');
            const res = yield api.uploadKey(key);
            spinner.succeed(chalk_1.default.green(res));
        }
        catch (err) {
            spinner.fail(chalk_1.default.red(err));
        }
    });
}
function delete_key(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const spinner = ora_1.default().start(chalk_1.default.green(utils_1.WAIT_MSG));
        spinner.color = 'blue';
        try {
            const key_list = yield api.listKeys();
            spinner.stop();
            const choice = yield ui_1.ask_list(['↵ Back', ...key_list.map(value => value.name + ' ...' + value.data.substr(-20))], 'Select a key');
            if (choice === '↵ Back' || !(yield ui_1.ask_question('Are you sure ?')))
                return;
            const key = choice.split(' ')[0];
            spinner.start(chalk_1.default.green(utils_1.WAIT_MSG));
            const res = yield api.deleteKey(key);
            spinner.succeed(chalk_1.default.green(res));
        }
        catch (err) {
            spinner.fail(chalk_1.default.red(err));
        }
    });
}
function show_key(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const spinner = ora_1.default().start(chalk_1.default.green(utils_1.WAIT_MSG));
        spinner.color = 'blue';
        try {
            const key_list = yield api.listKeys();
            spinner.stop();
            const idx = yield ui_1.ask_list(['↵ Back', ...key_list.map(value => value.name + ' ...' + value.data.substr(-20))], undefined, true);
            if (idx === '0')
                return;
            const key = key_list[+idx - 1];
            spinner.info(utils_1.clor.info(`Name:		${key.name}` + `\n  Data:		${key.data}`));
        }
        catch (err) {
            spinner.fail(chalk_1.default.red(err));
        }
    });
}
