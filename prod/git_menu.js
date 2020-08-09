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
exports.clone_repo = exports.git_menu = void 0;
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = __importDefault(require("fs"));
const ui_1 = require("./ui");
const utils_1 = require("./utils");
function git_menu(api, config) {
    return __awaiter(this, void 0, void 0, function* () {
        let should_quit = false;
        const choices = ['↵ Back', 'My repository', 'Other repository', 'All my repositories'];
        while (!should_quit) {
            const choice = yield ui_1.ask_list(choices, 'Git clone repositories');
            switch (choice) {
                case choices[1]:
                    yield clone_my_repo(api, config);
                    break;
                case choices[2]:
                    yield clone_other_repo(api, config);
                    break;
                case choices[3]:
                    yield clone_all_repo(api, config);
                    break;
                case choices[0]:
                default:
                    should_quit = true;
            }
        }
    });
}
exports.git_menu = git_menu;
function clone_my_repo(api, config) {
    return __awaiter(this, void 0, void 0, function* () {
        const repo_name = yield ui_1.ask_autocomplete(['↵ Back', ...config.repo], undefined, true);
        if (repo_name === '↵ Back')
            return;
        yield clone_repo(api, repo_name, config.email);
    });
}
function clone_other_repo(api, config) {
    return __awaiter(this, void 0, void 0, function* () {
        const repo_name = yield ui_1.ask_input('Repository name ?');
        const email = yield ui_1.ask_autocomplete(config.contact, 'Enter repository email');
        if (!config.contact.some((value) => value === email)) {
            config.contact.push(email);
            config.contact = config.contact;
        }
        yield clone_repo(api, repo_name, email);
    });
}
function clone_repo(api, repo_name, email) {
    return __awaiter(this, void 0, void 0, function* () {
        const spinner = ora_1.default();
        spinner.color = 'blue';
        try {
            let repo_path = null;
            if (!(yield ui_1.ask_question('Git clone here ?')))
                repo_path = yield ui_1.ask_input('Repository destination:');
            if (repo_path === '')
                return;
            if (repo_path && !fs_1.default.existsSync(repo_path)) {
                if (yield ui_1.ask_question('Path not exist, create ?'))
                    fs_1.default.mkdirSync(repo_path, { recursive: true });
                else
                    return;
                process.chdir(repo_path);
            }
            spinner.start(chalk_1.default.green('Clone ') + utils_1.clor.info(repo_name) + chalk_1.default.green(' repository...'));
            yield utils_1.sh(`git clone git@git.epitech.eu:/${email}/${repo_name}`);
            spinner.succeed(chalk_1.default.green(`Repository ${process.cwd()}/`) + utils_1.clor.info(repo_name) + chalk_1.default.green('/ clone'));
        }
        catch (err) {
            spinner.fail(chalk_1.default.red(err));
        }
    });
}
exports.clone_repo = clone_repo;
function clone_all_repo(api, config) {
    return __awaiter(this, void 0, void 0, function* () {
        const spinner = ora_1.default();
        spinner.color = 'blue';
        spinner.start(chalk_1.default.green(utils_1.WAIT_MSG));
        try {
            const repo_list = yield api.listRepositories();
            spinner.stop();
            let repo_path = null;
            const repo_nb = repo_list.length;
            if (!(yield ui_1.ask_question(`Git clone ${utils_1.clor.info(repo_nb)} repositories here ?`)))
                repo_path = yield ui_1.ask_input('Repository destination:');
            if (repo_path !== null && !fs_1.default.existsSync(repo_path)) {
                if (yield ui_1.ask_question('Path not exist, create ?'))
                    fs_1.default.mkdirSync(repo_path, { recursive: true });
                else
                    return;
            }
            const cd = repo_path ? `cd ${repo_path}; ` : '';
            for (let idx = 0; idx < repo_nb; idx++) {
                spinner.stop();
                spinner.start(chalk_1.default.green(`(${idx}/${repo_nb}): Clone '${repo_list[idx].name}' in ${repo_path || process.cwd()}...`));
                try {
                    yield utils_1.sh(`${cd}git clone git@git.epitech.eu:/${config.email}/${repo_list[idx].name}`);
                }
                catch (err) {
                    spinner.fail(chalk_1.default.red(err));
                }
            }
            spinner.succeed(chalk_1.default.green(`${repo_nb} repositories clone`));
        }
        catch (err) {
            spinner.fail(chalk_1.default.red(err));
        }
    });
}
