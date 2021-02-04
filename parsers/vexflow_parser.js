"use strict";
const voicePattern = /^([a-zA-Z-_]+)([0-9]*):\s(.*)/;
const emptyLine = /^[ \t]*\n?$/;

function parseNotes(lines,opts,indent) {
    var def={type:'notes',values:''};
    const re = new RegExp("^ {" + indent + "}(.*)");
    while (lines.length>0) {
        var firstLine = lines.shift();
        var match = re.exec(firstLine);
        def.values += match[1];
    }
    return def;
}

function parseVoice(lines,opts,indent) {
    var def={blocs:[],options:opts};
    const re = new RegExp("^ {" + indent + "}(tuplet|beam|notes( *= *.*)?)(( +\\w+=\\w+)*)");
    while (lines.length>0) {
        var parsed = parseOneLine(lines,re);
        if (parsed.verb=='notes') {
            def.blocs.push(parseNotes(parsed.block,parsed.options,parsed.indent))
        }
    }
    return def;
}

function parseStave(lines,opts,indent) {
    var def={voices:[],options:opts};
    const re = new RegExp("^ {" + indent + "}(voice|notes( *= *.*)?)(( +\\w+=\\w+)*)");
    while (lines.length>0) {
        var parsed = parseOneLine(lines,re);
        if (parsed.verb=='voice') {
            def.voices.push(parseVoice(parsed.block,parsed.options,parsed.indent))
        }
    }
    return def;
}

/**
 * Returns an object defining a list of staves with options {options:{},staves:[ ... ]}
 * @param {*} lines 
 * @param {*} indent 
 */
function parseDefinition(lines, indent) {
    var def = {staves:[]};
    const re = new RegExp("^ {" + indent + "}(stave|options?)(( +\\w+=\\w+)*)");
    while (lines.length>0) {
        var parsed = parseOneLine(lines,re);
        if (parsed.verb=='stave') {
            def.staves.push(parseStave(parsed.block,parsed.options,parsed.indent))
        }
    }
    return def;
}

function parseOneLine(lines,re) {
    var firstLine = lines.shift();
    var match = re.exec(firstLine)
    if (!match) throw "Unexected line : " + firstLine;
    var newIndent = getIndentSize(lines);
    var block = getLinesBelowIndent(lines,newIndent);
    var verb = match[1];
    var options = parseOptions(match[2]);
    return {verb:verb, options:options, block:block,indent:newIndent};
}

function getLinesBelowIndent(lines,indent) {
    var block = [];
    const re = new RegExp("^ {" + indent + "}");
    while (lines.length>0 && re.exec(lines[0]))
        block.push(lines.shift());
    return block;
}

/**
 * Converts an option line "opt1=val1 opt2=val2" to an object {opt1:val1, opt2:val2}
 * 
 * @param {String} line 
 */
function parseOptions(line) {
    return {};
}

/**
 * Returns the indentation of the given line
 *
 * @param {String} lines A line
 * @return {number} The indentation or 0 if lines is empty
 */
function getIndentSize(lines) {
    const re = /^( *)/;
    var match = re.exec(lines);
    if (match) {
        return match[1].length;
    }
    return 0;
}

function parseVex(definition) {
    var lines = definition.split(/[\n]/).filter(line => !emptyLine.exec(line));
    var indent = getIndentSize(lines[0]);
    return parseDefinition(lines, indent);
}

module.exports = {
    parseVex
};
