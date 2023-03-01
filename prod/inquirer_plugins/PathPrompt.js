"use strict";
/**
 * Copyright (c) 2020 Blih CLI
 *
 * Path prompt plugin for inquirer
 * Work like the autocomplete of bash
 * (https://npmjs.com/package/inquirer)
 *
 * @summary Path prompt plugin for inquirer
 * @author Theo <@GreenDjango>
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const choices_1 = __importDefault(require("inquirer/lib/objects/choices"));
const inquirer_autocomplete_prompt_1 = __importDefault(require("inquirer-autocomplete-prompt"));
// @ts-ignore
const strip_ansi_1 = __importDefault(require("strip-ansi"));
const ansi_styles_1 = __importDefault(require("ansi-styles"));
const fuzzy_1 = __importDefault(require("fuzzy"));
/**
 * message: string, top content
 * pageSize: number, size of list to show
 * itemType: 'any' | 'directory' | 'file'
 * rootPath: string
 * excludePath: (path: string) => boolean
 * excludeFilter: (path: string) => boolean
 * suggestOnly: boolean
 * default: number | string, index or value to show first
 */
class PathPrompt extends inquirer_autocomplete_prompt_1.default {
    constructor(question, rl, answers) {
        const { itemType = 'any', rootPath = '.', excludePath = () => false, excludeFilter = false, } = question;
        const questionBase = {
            ...question,
            source: async (_, searchTerm) => getPaths(rootPath, searchTerm, excludePath, excludeFilter, itemType, question.default),
        };
        super(questionBase, rl, answers);
    }
    search(searchTerm) {
        return super.search(searchTerm).then(() => {
            this.currentChoices.getChoice = (choiceIndex) => {
                const choice = choices_1.default.prototype.getChoice.call(this.currentChoices, choiceIndex);
                return {
                    value: (0, strip_ansi_1.default)(choice.value),
                    name: (0, strip_ansi_1.default)(choice.name || 'Empty'),
                    short: (0, strip_ansi_1.default)(choice.name || 'Empty'),
                };
            };
        });
    }
    /**
     * When user press `enter` key
     */
    onSubmit(line) {
        super.onSubmit((0, strip_ansi_1.default)(line));
    }
}
exports.default = PathPrompt;
function getPaths(rootPath, searchTerm, excludePath, excludeFilter, itemType, defaultItem) {
    const pathDir = searchTerm?.includes('/')
        ? searchTerm.substring(0, searchTerm.lastIndexOf('/') + 1)
        : rootPath;
    const nodeList = [pathDir].map((nodePath) => {
        if (excludePath(nodePath)) {
            return [];
        }
        try {
            const res = [];
            const currentNode = itemType === 'file' ? [] : ['.', '..'];
            currentNode.push(...(0, fs_1.readdirSync)(nodePath));
            currentNode.forEach((val) => {
                let realPath = path_1.default.join(nodePath, val);
                const stat = (0, fs_1.statSync)(realPath);
                if ((itemType === 'directory' && stat.isFile()) ||
                    (itemType === 'file' && stat.isDirectory()))
                    return;
                if (stat.isDirectory() && realPath[realPath.length - 1] !== '/')
                    realPath += '/';
                res.push(realPath);
            });
            return res;
        }
        catch (err) {
            return [];
        }
    })[0];
    const preFilteredNodes = !excludeFilter
        ? nodeList
        : nodeList?.filter((node) => excludeFilter(node));
    const fuzzOptions = {
        pre: ansi_styles_1.default.green.open,
        post: ansi_styles_1.default.green.close,
    };
    const filteredNodes = fuzzy_1.default
        .filter(searchTerm || '', preFilteredNodes ?? [], fuzzOptions)
        .map((e) => e.string);
    if (!searchTerm && defaultItem) {
        filteredNodes.unshift(defaultItem);
    }
    return filteredNodes;
}
