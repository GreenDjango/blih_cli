"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.md_parser = void 0;
const chalk_1 = __importDefault(require("chalk"));
function md_parser(to_md) {
    let src = to_md;
    const width = cli_width();
    // Remove empty lines
    src = src.replace(/^\s*\n/gm, '');
    // ``` Indented code Rules
    src = src.replace(/^ *`{3}.*?$(.*?)`{3} *$/gms, (_, p1) => {
        return p1
            .split('\n')
            .map((val) => (val ? `%NOPARSER%  |  ${chalk_1.default.inverse(val)}` : ''))
            .join('\n');
    });
    // 4spaces Indented code Rules
    src = src.replace(/^( {4}.*\n)+/gm, (_) => {
        return '\n' + _.replace(/^ {4}(.*)$/gm, `%NOPARSER%  |  ${chalk_1.default.inverse('$1')}`) + '\n';
    });
    // # Heading
    src = src.replace(/^(#{1,6}) *(.*)$/gm, (_, p1, p2) => {
        return `\n%NOPARSER%${'─'.repeat(p1.length - 1)}${chalk_1.default.bold(p2)} (H${p1.length})`;
    });
    // >> Blockquotes Rules
    src = src.replace(/^(>[>| ]*)/gm, (_, p1) => {
        const indent = (p1.match(/>/g) || []).length;
        return `%NOPARSER%${'|'.repeat(indent)} `;
    });
    // - List Unordered Rules
    src = src.replace(/^( *)[*+-] /gm, (_, p1) => {
        return `%NOPARSER%${' '.repeat((p1.length / 2) * 2)}    • `;
    });
    // 1. List Ordered Rules
    const arr = {};
    const gex = /^ *(\d+)\. .*$/gm;
    for (let res = gex.exec(src); res !== null; res = gex.exec(src)) {
        arr[gex.lastIndex + 1] = parseInt(res[1] ?? '1');
    }
    src = src.replace(/^ *(\d+)\. (.*)$/gm, (_, p1, p2, idx) => {
        const new_list_nb = typeof arr[idx] === 'number' ? (arr[idx] || 0) + 1 : parseInt(p1);
        arr[idx + _.length + 1] = new_list_nb;
        return `%NOPARSER%    ${new_list_nb}. ${p2}`;
    });
    // --- Horizontal Rules
    src = src.replace(/^ *[-*_]{3,} *$/gm, () => {
        if (width < 3)
            return '─'.repeat(width);
        return `\n%NOPARSER%◈${'─'.repeat(width - 2)}◈\n`;
    });
    // Strikethrough Rules
    src = src.replace(/[~]{2}(.+?)[~]{2}/gm, chalk_1.default.strikethrough('$1'));
    // Bold Rules
    src = src.replace(/[*_]{2}(.+?)[*_]{2}/gm, chalk_1.default.bold('$1'));
    // Italic Rules
    src = src.replace(/[*_](.+?)[*_]/gm, chalk_1.default.italic('$1'));
    // `` Inline code Rules
    src = src.replace(/[`](.+?)[`]/gm, chalk_1.default.inverse('$1'));
    // Indent all with 2 spaces & Remove #NOPARSER#
    src = src.replace(/^(%NOPARSER%|)( *)(.*$)/gm, (_, p1, p2, p3) => {
        if (p1)
            return p2 + p3;
        return `  ${p3}`;
    });
    src = src.replace(/%NOPARSER%/gm, '');
    return src;
}
exports.md_parser = md_parser;
function cli_width() {
    const opts = {
        defaultWidth: 80,
        output: process.stdout,
        tty: require('tty'),
    };
    if (opts.output?.getWindowSize) {
        return opts.output.getWindowSize()[0] || opts.defaultWidth;
    }
    if (opts.tty?.getWindowSize) {
        return opts.tty.getWindowSize()[1] || opts.defaultWidth;
    }
    if (opts.output?.columns) {
        return opts.output.columns;
    }
    if (process.env['CLI_WIDTH']) {
        const width = parseInt(process.env['CLI_WIDTH'], 10);
        if (!isNaN(width) && width !== 0) {
            return width;
        }
    }
    return opts.defaultWidth;
}
