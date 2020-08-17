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
exports.acl_menu = exports.create_repo = exports.repo_menu = void 0;
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
const ui_1 = require("./ui");
const utils_1 = require("./utils");
const git_menu_1 = require("./git_menu");
function repo_menu(api, config) {
    return __awaiter(this, void 0, void 0, function* () {
        let should_quit = false;
        const choices = [
            '↵ Back',
            'Create repository',
            'Delete repository',
            'Change ACL',
            'Show repositories list',
        ];
        while (!should_quit) {
            const choice = yield ui_1.ask_list(choices, 'Repository');
            switch (choice) {
                case choices[1]:
                    yield create_repo(api, config);
                    break;
                case choices[2]:
                    yield delete_repo(api, config);
                    break;
                case choices[3]:
                    yield acl_menu(api, config);
                    break;
                case choices[4]:
                    yield show_repo(api, config);
                    break;
                case choices[0]:
                default:
                    should_quit = true;
            }
        }
    });
}
exports.repo_menu = repo_menu;
function create_repo(api, config, repo_name) {
    return __awaiter(this, void 0, void 0, function* () {
        const input = repo_name || (yield ui_1.ask_input('Repository name'));
        const spinner = ora_1.default().start(chalk_1.default.green(utils_1.WAIT_MSG));
        try {
            let res = yield api.createRepository(input);
            config.repo.push(input);
            spinner.succeed(chalk_1.default.green(res));
            if (config.auto_acl) {
                spinner.start(chalk_1.default.green(utils_1.WAIT_MSG));
                res = yield api.setACL(input, 'ramassage-tek', 'r');
                spinner.succeed(chalk_1.default.green(res + ' (ramassage-tek)'));
            }
            yield acl_menu(api, config, input);
            if (yield ui_1.ask_question(`Git clone ${input} ?`))
                yield git_menu_1.clone_repo(api, input, config.email);
        }
        catch (err) {
            spinner.fail(chalk_1.default.red(err));
        }
    });
}
exports.create_repo = create_repo;
function delete_repo(api, config) {
    return __awaiter(this, void 0, void 0, function* () {
        const to_delete = yield ui_1.ask_autocomplete(['↵ Back', ...config.repo], undefined, true);
        if (to_delete === '↵ Back')
            return;
        const valid = yield ui_1.ask_question(`Delete ${to_delete} ?`);
        if (valid) {
            const spinner = ora_1.default().start(chalk_1.default.green(utils_1.WAIT_MSG));
            try {
                const res = yield api.deleteRepository(to_delete);
                config.repo = config.repo.filter((value) => value !== to_delete);
                spinner.succeed(chalk_1.default.green(res));
            }
            catch (err) {
                spinner.fail(chalk_1.default.red(err));
            }
        }
    });
}
function acl_menu(api, config, repo_name) {
    return __awaiter(this, void 0, void 0, function* () {
        const repo = repo_name || (yield ui_1.ask_autocomplete(['↵ Back', ...config.repo], undefined, true));
        if (repo === '↵ Back')
            return;
        const spinner = ora_1.default().start(chalk_1.default.green(utils_1.WAIT_MSG));
        try {
            let acl_list = (yield api.getACL(repo)).map((val) => to_ACL(val));
            spinner.stop();
            let acl = yield change_acl(acl_list, config);
            while (acl) {
                spinner.start(chalk_1.default.green(utils_1.WAIT_MSG));
                const res = yield api.setACL(repo, acl.name, acl.rights);
                acl_list = (yield api.getACL(repo)).map((val) => to_ACL(val));
                spinner.succeed(chalk_1.default.green(res) + ` ${acl.name} ${acl.rights_str}`);
                acl = yield change_acl(acl_list, config);
            }
        }
        catch (err) {
            spinner.fail(chalk_1.default.red(err));
        }
    });
}
exports.acl_menu = acl_menu;
function change_acl(acl_list, config) {
    return __awaiter(this, void 0, void 0, function* () {
        const ask = [
            { name: '↵ Back', value: undefined, short: '↵ Back' },
            { name: 'Add', value: 'ADD', short: 'Add' },
            ...acl_list.map((val) => {
                const to_show = `${val.name} ${val.rights_str}`;
                return { name: to_show, value: val, short: to_show };
            }),
        ];
        const acl = yield ui_1.ask_list_index(ask, 'Give ACL');
        if (!acl)
            return undefined;
        if (typeof acl === 'string')
            return yield ask_acl(config);
        const rights = (yield ui_1.ask_qcm(['Read', 'Write', 'Admin'], ['r', 'w', 'a'], acl.rights_bool, acl.name)).join('');
        return to_ACL({ name: acl.name, rights });
    });
}
function ask_acl(config) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield ui_1.ask_autocomplete(['ramassage-tek', ...config.contact], 'Enter new email');
        const rights = (yield ui_1.ask_qcm(['Read', 'Write', 'Admin'], ['r', 'w', 'a'], [false, false, false], user)).join('');
        if (user !== 'ramassage-tek' && !config.contact.some((value) => value === user)) {
            config.contact.push(user);
            config.contact = config.contact;
        }
        return to_ACL({ name: user, rights });
    });
}
function to_ACL(acl) {
    const new_r = Object.assign(Object.assign({}, acl), { rights_bool: [acl.rights.includes('r'), acl.rights.includes('w'), acl.rights.includes('a')], rights_str: chalk_1.default.bold('deleted') });
    if (new_r.rights_bool[0] || new_r.rights_bool[1] || new_r.rights_bool[2]) {
        new_r.rights_str = new_r.rights_bool[0] ? chalk_1.default.bold('r') : '-';
        new_r.rights_str += new_r.rights_bool[1] ? chalk_1.default.bold('w') : '-';
        new_r.rights_str += new_r.rights_bool[2] ? chalk_1.default.bold('a') : '-';
    }
    return new_r;
}
function show_repo(api, config) {
    return __awaiter(this, void 0, void 0, function* () {
        const repo = yield ui_1.ask_autocomplete(['↵ Back', ...config.repo], undefined, true);
        if (repo === '↵ Back')
            return;
        const spinner = ora_1.default().start(chalk_1.default.green(utils_1.WAIT_MSG));
        try {
            const repo_info = yield api.repositoryInfo(repo);
            const creation_date = new Date(0);
            creation_date.setUTCSeconds(repo_info.creation_time);
            const repo_acl = (yield api.getACL(repo)).map((value) => `${value.name} - ${value.rights}`);
            if (!repo_acl.length)
                repo_acl.push('no sharing');
            spinner.info(utils_1.clor.info(`Name:		${repo_info.name}` +
                `\n  Uuid:		${repo_info.uuid}` +
                `\n  Url:		${repo_info.url}` +
                `\n  Creation:	${creation_date.toLocaleString()}` +
                `\n  Public:	${repo_info.public}` +
                `\n  Share:	${repo_acl.join('\n		')}`));
        }
        catch (err) {
            spinner.fail(chalk_1.default.red(err));
        }
    });
}
