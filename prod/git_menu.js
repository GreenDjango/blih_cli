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
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = __importDefault(require("fs"));
const ui_1 = require("./ui");
const utils_1 = require("./utils");
function git_menu(api, config) {
    return __awaiter(this, void 0, void 0, function* () {
        let should_quit = false;
        while (!should_quit) {
            const choices = ['↵ Back', 'My repository', 'Other repository'];
            const choice = yield ui_1.ask_list(choices, 'Git clone repositories');
            if (!config.verbose)
                ui_1.clear_line(true);
            switch (choice) {
                case choices[1]:
                    yield clone_my_repo(api, config);
                    break;
                case choices[2]:
                    //await clone_other_repo(api, config)
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
        const repo_name = yield ui_1.ask_autocomplete(['↵ Back', ...config.repo], undefined, false);
        const spinner = ora_1.default();
        spinner.color = 'blue';
        if (repo_name === '↵ Back')
            return;
        try {
            let repo_path = null;
            if (!(yield ui_1.ask_question('Git clone here ?')))
                repo_path = yield ui_1.ask_input('Repository destination:');
            if (repo_path !== null && !fs_1.default.existsSync(repo_path)) {
                if (yield ui_1.ask_question('Path not exist, create ?'))
                    fs_1.default.mkdirSync(repo_path, { recursive: true });
                else
                    return;
            }
            spinner.start(chalk_1.default.green(`Clone repository in ${repo_path || process.cwd()}...`));
            const cd = repo_path ? `cd ${repo_path}; ` : '';
            yield utils_1.sh(`${cd}git clone git@git.epitech.eu:/${config.email}/${repo_name}`);
            spinner.succeed(chalk_1.default.green('Repository ') + chalk_1.default.blue(repo_name) + chalk_1.default.green(' clone'));
        }
        catch (err) {
            spinner.fail(chalk_1.default.red(err));
        }
    });
}
