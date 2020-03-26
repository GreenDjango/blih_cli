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
const chalk_1 = __importDefault(require("chalk"));
const ui_1 = require("./ui");
const utils_1 = require("./utils");
function options_menu(config) {
    return __awaiter(this, void 0, void 0, function* () {
        let should_quit = false;
        while (!should_quit) {
            const choices = [
                '↵ Back',
                `Remember password: ${config.save_token ? chalk_1.default.green.bold('✔') : chalk_1.default.red.bold('✗')}`,
                `Auto Ramassage-tek ACL: ${config.auto_acl ? chalk_1.default.green.bold('✔') : chalk_1.default.red.bold('✗')}`,
                `Mode verbose: ${config.verbose ? chalk_1.default.green.bold('✔') : chalk_1.default.red.bold('✗')}`,
                `Colors option`,
                'Reset all contact',
            ];
            const choice = yield ui_1.ask_list(choices, 'You want options ?');
            switch (choice) {
                case choices[1]:
                    config.save_token = !config.save_token;
                    break;
                case choices[2]:
                    config.auto_acl = !config.auto_acl;
                    break;
                case choices[3]:
                    config.verbose = !config.verbose;
                    break;
                case choices[4]:
                    yield colors_option(config);
                    break;
                case choices[5]:
                    const valid = yield ui_1.ask_question(`Are you sure ?`);
                    if (valid)
                        config.contact = [];
                    break;
                case choices[0]:
                default:
                    should_quit = true;
            }
        }
    });
}
exports.options_menu = options_menu;
function colors_option(config) {
    return __awaiter(this, void 0, void 0, function* () {
        const colorsKey = utils_1.clor.getColorsKey();
        const color_choices = [...utils_1.colorsValue].map(key => {
            return `${key.charAt(0).toUpperCase() + key.slice(1)}: ${chalk_1.default[key]('test ■')}`;
        });
        while (1) {
            const choices = colorsKey.map(key => {
                return `${key.charAt(0).toUpperCase() + key.slice(1)}: ${utils_1.clor[key]('current ■')}`;
            });
            const option = yield ui_1.ask_list(['↵ Back', ...choices], 'You want colors ?', true);
            if (option === '0')
                return;
            const color = yield ui_1.ask_autocomplete(['↵ Back', ...color_choices], undefined, true);
            if (color === '↵ Back')
                continue;
            const idx = color_choices.findIndex(value => value === color);
            if (idx >= 0) {
                switch (colorsKey[+option - 1]) {
                    case 'info':
                        config.colors.info = [...utils_1.colorsValue][idx];
                        break;
                    default:
                        continue;
                }
                config.colors = config.colors;
            }
        }
    });
}
