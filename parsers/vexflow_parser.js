"use strict";
const barPattern = /^([a-zA-Z-_]+)([0-9]*):\s(.*)/;
const emptyLine = /^[ \t]*\n?$/;

/**
 * parse a full bloc, extracts the easynotes définition and the modificators
 * 
 * "A4,B4{c:EM}_C4-D4" -> {type:"notes",values:"A4,B4,C4,D4",mods:{chords:[{val:"EM",idx:1}],links:[{from:1,to:2,high:false},{from:2,to:3,high:true}]}}
 * @param {*} definition 
 */
function parseBlocDefinition(definition) {
    // First of all, removes all spaces
    definition = definition.replace(/ /g,'');
    const comma_or_link = new RegExp("([,_-])");
    var parts = definition.split(comma_or_link);

    var notes = []
    var chords = []
    var idx=0;
    const note_option = new RegExp("{(.*?)}");
    const chord_subs = new RegExp('([/\\\\])(/?[^/\\\\]+)$');
    for(var i=0;i<parts.length;i+=2) {
        var note = parts[i];
        while (var m = note.match(note_option)) {
            var value=m[1];
            var chord = {idx:idx};
            while (subs = value.match(chord_subs)) {
                var sub_type = subs[1];
                var sub = subs[2];
                if (sub_type=='/') {
                    chord.sub = sub;
                } else {
                    chord.super = sub;
                }
                value = value.replace(chord_subs,'');
            }
            chord.value = value;
            chords = chords.concat(chord);
            note = note.replace(note_option,'');
        }
        // Remove everything after { to avoid error messages while typing
        note = note.replace(/{.*/,'');
        notes = notes.concat(note);
        idx++;
    }
    definition = notes.join(',');

    var links = []
    idx=0;
    for(var i=1;i<parts.length;i+=2) {
        if (parts[i] != ',') {
            var high = parts[i]=='-';
            links = links.concat({from:idx, to:idx+1, high:high});
        }
        idx++;
    }
    definition = notes.join(',');

    return [ {type:'notes',values:definition, mods:{links:links,chords:chords}} ];
}

function parseBar(lines,opts,indent) {
    var definition='';
    const re = new RegExp("^ {" + indent + "}(.*)");
    while (lines.length>0) {
        var firstLine = lines.shift();
        var match = re.exec(firstLine);
        definition += match[1];
    }
    return {blocs: parseBlocDefinition(definition), options:opts};
}

function parseStaff(lines,opts,indent) {
    var def={bars:[],options:opts};
    const re = new RegExp("^ {" + indent + "}(bar)(( +\\w+(=\\S*)?)*) *$");
    while (lines.length>0) {
        var parsed = parseOneLine(lines,re,indent);
        if (parsed.verb=='bar') {
            def.bars.push(parseBar(parsed.block,parsed.options,parsed.indent))
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
    var def = {options:{},staves:[]};
    const re = new RegExp("^ {" + indent + "}(staff|options)(( +\\w+(=\\S*)?)*) *$");
    while (lines.length>0) {
        var parsed = parseOneLine(lines,re,indent);
        if (parsed.verb=='staff') {
            def.staves.push(parseStaff(parsed.block,parsed.options,parsed.indent))
        } else
        if (parsed.verb=='options') {
            def.options = parsed.options;
        }
    }
    return def;
}

function parseOneLine(lines,re,indent) {
    var firstLine = lines.shift();
    var match = re.exec(firstLine)
    if (!match) return { error:"Unexected line : " + firstLine };
    var verb = match[1];
    var options = parseOptions(match[2]);
    var newIndent = getIndentSize(lines);
    var block=[];
    if (newIndent>indent)
        block = getLinesBelowIndent(lines,newIndent);
    return {verb:verb, options:options, block:block, indent:newIndent};
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
    const re = /(\w+)=(\S+)/g;
    var options = {};
    var match;
    while (match = re.exec(line)) {
        var key = match[1];
        var val = match[2];
        options[key]=val;
    }
    return options;
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
