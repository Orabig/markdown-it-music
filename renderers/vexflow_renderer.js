"use strict";
const Vex = require('vexflow').default; // Remove .default when vexflow is updated : see https://github.com/0xfe/vexflow/issues/822
const VexParser =  require("../parsers/vexflow_parser.js");
const VF = Vex.Flow;
function concat(a, b) { return a.concat(b); }

const DEFAULT_FONT = 'Bravura';
const FONT_STACKS = {
  bravura: [VF.Fonts.Bravura, VF.Fonts.Gonville, VF.Fonts.Custom],
  gonville: [VF.Fonts.Gonville, VF.Fonts.Bravura, VF.Fonts.Custom],
  petaluma: [VF.Fonts.Petaluma, VF.Fonts.Gonville, VF.Fonts.Custom],
  // Some aliases
  jazz: [VF.Fonts.Petaluma, VF.Fonts.Gonville, VF.Fonts.Custom],
  classic: [VF.Fonts.Bravura, VF.Fonts.Gonville, VF.Fonts.Custom]
};

function rendervexflow(str, opts) {
  try {
  var parsed = VexParser.parseVex(str);
  } catch (error) {
    return '<table border="1"><tr><td>' + error + '</td></tr></table>';
  }

  function err(str) {
    if (parsed.options.debug=="true") {
      str += "<pre>" + JSON.stringify(parsed) + "</pre>";
    }
    return '<table border="1"><tr><td>' + str + '</td></tr></table>';
  }

  try{
  // Parse the vexflow music notation
  var systemWidth = 600;
  const div = document.createElement("div");
  if (str.includes("bach")) {
    var options = { renderer: {elementId: div, width: systemWidth+100, height: 900} }
    bachSample(options);
    return div.outerHTML;
  }

  var options = { renderer: {elementId: div, width: systemWidth+100, height: 220} }
  //var renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);
  //renderer.resize(systemWidth+100, 100);
  //var options = { renderer: renderer};
  var registry = new VF.Registry();
  function id(id) { return registry.getElementById(id); }

  VF.Registry.enableDefaultRegistry(registry);
  var vf = new VF.Factory(options);
  var score = vf.EasyScore({ throwOnError: true });
  
  var font = parsed.options.font;
  if (!font) font = DEFAULT_FONT;
  VF.DEFAULT_FONT_STACK = FONT_STACKS[font.toLowerCase()];
  if (!VF.DEFAULT_FONT_STACK) return err("Invalid font : must be one of 'Bravura', 'Gonville' or 'Petaluma'.");

  var timeSignature = parsed.options.timeSignature
  var keySignature = parsed.options.key

  var voice = score.voice.bind(score);
  var notes = score.notes.bind(score);
  var beam = score.beam.bind(score);
  var tuplet = score.tuplet.bind(score);

  var x = 20; // Place pour l'accolade ?
  var y = 0;
  function makeSystem(width) {
    var system = vf.System({ x: x, y: y, width: width, spaceBetweenStaves: 10 });
    x += width;
    return system;
  }
  
  
  if (parsed.staves.length==0) {
    // err("No staff defined.");
    return err("vexflow empty : there should be at least one staff defined.");
  } else {
  if (parsed.staves[0] && !parsed.staves[0].options.clef)
    parsed.staves[0].options.clef='treble';
  if (parsed.staves[1] && !parsed.staves[1].options.clef)
    parsed.staves[1].options.clef='bass';
  
  var beams = [];
  var automaticBeam = true;

  var barCount = parsed.staves[0].bars.length;
  for (let i=0;i<parsed.staves.length;i++) {
    if (!parsed.staves[i].bars || parsed.staves[i].length==0)
      return err("All staves should contain at least one bar.");
    if (parsed.staves[i].bars.length!=barCount)
      return err("All staves should have the same number of bar")
      if (!parsed.staves[i].bars[0])
      return err("All bars should have notes")
      if (!parsed.staves[i].bars[0].blocs || parsed.staves[i].bars[0].blocs.length==0)
      return err("All bars should have notes")
  }


  for(let bar=0; bar<barCount; bar++) {
    var barWidth = systemWidth / barCount;
    if (parsed.staves[0].bars[bar].options.width)
      barWidth = parseInt(parsed.staves[0].bars[bar].options.width);

    var system = makeSystem(barWidth);
      parsed.staves.forEach(staff => {
      var clef = staff.options.clef;
      var voices = [
        voice(
          staff.bars[bar].blocs.map( bloc=> {
              if (bloc.type=='notes') {
                var options = {clef: clef};
                return notes(bloc.values, options)/*.map( note => {
                  note.setStyle({strokeStyle: "#0000"});
                  return note;
                });*/
              }
          }).reduce(concat)
        )
      ].map(voice => { // Map voices to plugin generateBeams
        if (automaticBeam) {
          var be = VF.Beam.generateBeams(voice.getTickables(), {});
          beams = beams.concat(be);
        }
        return voice;
      });

      var newStave = system.addStave({
        voices: voices,
      });

      if (bar==0) {
        newStave.addClef(staff.options.clef);
        if (timeSignature)
          newStave.addTimeSignature(timeSignature);
        if (keySignature)
          newStave.addKeySignature(keySignature);
        /* First staff only
        newStave.setTempo({ duration: 'q', dots: 0, bpm: 60}, -10);
        */
      }
      /*      .addClef('treble')
        .addKeySignature('G')
        .addTimeSignature('3/4')
        .setTempo({ name: 'Allegretto', duration: 'h', dots: 1, bpm: 66}, -30);*/
      /*
      vf.Formatter()
      .joinVoices(voices)
      .formatToStave(voices, newStave);*/

    });
    if (bar==0) {
      if (parsed.staves.length>1)
        system.addConnector('brace');
      system.addConnector('singleLeft');
    }
/*
    c1 = vf.ChordSymbol({vJustify:'top',fontFamily:'Roboto Slab,Times'}).addText('C').addTextSuperscript('7');
    c2 = vf.ChordSymbol({vJustify:'top',fontFamily:'PetalumaScript,Arial'}).addText('F').addTextSuperscript('7');
    c3 = vf.ChordSymbol({vJustify:'top',fontFamily:'PetalumaScript,Arial'}).addText('C').addTextSuperscript('7');
    c4 = vf.ChordSymbol({vJustify:'top',fontFamily:'PetalumaScript,Arial'}).addText('C').addGlyphOrText('7(b9)', { symbolModifier: VF.ChordSymbol.symbolModifiers.SUPERSCRIPT });
      //.addGlyphSuperscript('dim'); // see https://github.com/0xfe/vexflow/issues/822    
    registry.getElementById("1").addModifier(0,c1);
    registry.getElementById("2").addModifier(0,c2);
    registry.getElementById("3").addModifier(0,c3);
    registry.getElementById("4").addModifier(0,c4); // CAN'T be reused
*/
/* */
    // WORKS
    //registry.getElementById("1").addModifier(0, vf.Fingering({ number: '1', position: 'left' }));
    //registry.getElementById("1").addModifier(0,  vf.StringNumber({ number: '2', position: 'left' }).setOffsetY(-10));
    //registry.getElementById("1").addModifier(0, new VF.Ornament('mordent'));
    //var grace = vf.GraceNote({ keys: ['d/3'], clef: 'bass', duration: '8', slash: true });
    //registry.getElementById("1").addModifier(0, vf.GraceNoteGroup({ notes: [grace] }));

    // DOES NOT WORK
    //registry.getElementById("1").addModifier(new vf.Vibrato(), 0);
    
  }
  system.addConnector('singleRight');
  
  vf.draw();
  }

  if (automaticBeam) {
    beams.forEach(function(beam) {
      return beam.setContext(vf.getContext()).draw();
    });
  }

  VF.Registry.disableDefaultRegistry();
  return div.outerHTML;
  } catch (error) {
    return err(error);
  }
}

// Source : https://github.com/0xfe/vexflow/blob/master/tests/bach_tests.js
// Image : https://github.com/0xfe/vexflow/issues/471
function bachSample(options) {
  var registry = new VF.Registry();
  VF.Registry.enableDefaultRegistry(registry);
  var vf = new VF.Factory(options);
  var score = vf.EasyScore({ throwOnError: true });

  var voice = score.voice.bind(score);
  var notes = score.notes.bind(score);
  var beam = score.beam.bind(score);
  var tuplet = score.tuplet.bind(score);

  var x = 120;
  var y = 80;
  function makeSystem(width) {
    var system = vf.System({ x: x, y: y, width: width, spaceBetweenStaves: 10 });
    x += width;
    return system;
  }

  function id(id) { return registry.getElementById(id); }

  score.set({ time: '3/4' });

  /*  Measure 1 */
  var system = makeSystem(220);
  system.addStave({
    voices: [
      voice([
        notes('D5/q[id="m1a"]'),
        beam(notes('G4/8, A4, B4, C5', { stem: 'up' })),
      ].reduce(concat)),
      voice([vf.TextDynamics({ text: 'p', duration: 'h', dots: 1, line: 9 })]),
    ],
  })
    .addClef('treble')
    .addKeySignature('G')
    .addTimeSignature('3/4')
    .setTempo({ /*name: 'Allegretto',*/ duration: 'h', dots: 1, bpm: 66}, -30);

  system.addStave({ voices: [voice(notes('(G3 B3 D4)/h, A3/q', { clef: 'bass' }))] })
    .addClef('bass').addKeySignature('G').addTimeSignature('3/4');
  system.addConnector('brace');
  system.addConnector('singleRight');
  system.addConnector('singleLeft');

  id('m1a').addModifier(0, vf.Fingering({ number: '5' }));

  /*  Measure 2 */
  system = makeSystem(150);
  system.addStave({ voices: [voice(notes('D5/q[id="m2a"], G4[id="m2b"], G4[id="m2c"]'))] });
  system.addStave({ voices: [voice(notes('E2/h, D2/q', { clef: 'bass' })),voice(notes('B3/h.', { clef: 'bass' }))] });
  system.addConnector('singleRight');

  id('m2a').addModifier(0, vf.Articulation({ type: 'a.', position: 'above' }));
  id('m2b').addModifier(0, vf.Articulation({ type: 'a.', position: 'below' }));
  id('m2c').addModifier(0, vf.Articulation({ type: 'a.', position: 'below' }));

  vf.Curve({
    from: id('m1a'),
    to: id('m2a'),
    options: { cps: [{ x: 0, y: 40 }, { x: 0, y: 40 }] },
  });

  /*  Measure 3 */
  system = makeSystem(150);
  system.addStave({
    voices: [
      voice([
        notes('E5/q[id="m3a"], E5/8'),
        tuplet(beam(notes('C5/8, D5, E5', { stem: 'down' }))),
        beam(notes('F5/16, E5/16', { stem: 'down' })),
      ].reduce(concat)),
    ],
  });
  id('m3a').addModifier(0, vf.Fingering({ number: '3', position: 'above' }));

  system.addStave({ voices: [voice(notes('C4/h.', { clef: 'bass' }))] });
  system.addConnector('singleRight');

  /*  Measure 4 */
  system = makeSystem(150);
  system.addStave({ voices: [voice(notes('G5/q[id="m4a"], G4[id="m4b"], G4[id="m4c"]'))] });

  system.addStave({ voices: [voice(notes('B3/h.', { clef: 'bass' }))] });
  system.addConnector('singleRight');

  id('m4a').addModifier(0, vf.Articulation({ type: 'a.', position: 'above' }));
  id('m4b').addModifier(0, vf.Articulation({ type: 'a.', position: 'below' }));
  id('m4c').addModifier(0, vf.Articulation({ type: 'a.', position: 'below' }));

  vf.Curve({
    from: id('m3a'),
    to: id('m4a'),
    options: { cps: [{ x: 0, y: 20 }, { x: 0, y: 20 }] },
  });

  /*  Measure 5 */
  system = makeSystem(150);
  system.addStave({
    voices: [
      voice([
        notes('C5/q[id="m5a"]'),
        beam(notes('D5/8, C5, B4, A4', { stem: 'down' })),
      ].reduce(concat)),
    ],
  });
  id('m5a').addModifier(0, vf.Fingering({ number: '4', position: 'above' }));

  system.addStave({ voices: [voice(notes('A3/h.', { clef: 'bass' }))] });
  system.addConnector('singleRight');

  /*  Measure 6 */
  system = makeSystem(150);
  system.addStave({
    voices: [
      voice([
        notes('B4/q'),
        beam(notes('C5/8, B4, A4, G4[id="m6a"]', { stem: 'up' })),
      ].reduce(concat)),
    ],
  });

  system.addStave({ voices: [voice(notes('G3/h.', { clef: 'bass' }))] });
  system.addConnector('singleRight');

  vf.Curve({
    from: id('m5a'),
    to: id('m6a'),
    options: {
      cps: [{ x: 0, y: 20 }, { x: 0, y: 20 }],
      invert: true,
      position_end: 'nearTop',
      y_shift: 20,
    },
  });

  /*  Measure 7 (New system) */
  x = 20;
  y += 230;

  system = makeSystem(220);
  system.addStave({
    voices: [
      voice([
        notes('F4/q[id="m7a"]'),
        beam(notes('G4/8[id="m7b"], A4, B4, G4', { stem: 'up' })),
      ].reduce(concat)),
    ],
  }).addClef('treble').addKeySignature('G');

  system.addStave({ voices: [voice(notes('D4/q, B3[id="m7c"], G3', { clef: 'bass' }))] })
    .addClef('bass').addKeySignature('G');
  system.addConnector('brace');
  system.addConnector('singleRight');
  system.addConnector('singleLeft');

  id('m7a').addModifier(0, vf.Fingering({ number: '2', position: 'below' }));
  id('m7b').addModifier(0, vf.Fingering({ number: '1' }));
  id('m7c').addModifier(0, vf.Fingering({ number: '3', position: 'above' }));

  /*  Measure 8 */
  system = makeSystem(180);
  var grace = vf.GraceNote({ keys: ['d/3'], clef: 'bass', duration: '8', slash: true });

  system.addStave({ voices: [voice(notes('A4/h.[id="m8c"]'))] });
  system.addStave({
    voices: [
      score.set({ clef: 'bass' }).voice([
        notes('D4/q[id="m8a"]'),
        beam(notes('D3/8, C4, B3[id="m8b"], A3', { stem: 'down' })),
      ].reduce(concat)),
    ],
  });
  system.addConnector('singleRight');

  id('m8b').addModifier(0, vf.Fingering({ number: '1', position: 'above' }));
  id('m8c').addModifier(0, vf.GraceNoteGroup({ notes: [grace] }));

  vf.Curve({
    from: id('m7a'),
    to: id('m8c'),
    options: {
      cps: [{ x: 0, y: 20 }, { x: 0, y: 20 }],
      invert: true,
      position: 'nearTop',
      position_end: 'nearTop',
    },
  });

  vf.StaveTie({ from: grace, to: id('m8c') });

  /*  Measure 9 */
  system = makeSystem(180);
  system.addStave({
    voices: [
      score.set({ clef: 'treble' }).voice([
        notes('D5/q[id="m9a"]'),
        beam(notes('G4/8, A4, B4, C5', { stem: 'up' })),
      ].reduce(concat)),
    ],
  });

  system.addStave({ voices: [voice(notes('B3/h, A3/q', { clef: 'bass' }))] });
  system.addConnector('singleRight');

  id('m9a').addModifier(0, vf.Fingering({ number: '5' }));

  /*  Measure 10 */
  system = makeSystem(170);
  system.addStave({ voices: [voice(notes('D5/q[id="m10a"], G4[id="m10b"], G4[id="m10c"]'))] });
  system.addStave({ voices: [voice(notes('G3/q[id="m10d"], B3, G3', { clef: 'bass' }))] });
  system.addConnector('singleRight');

  id('m10a').addModifier(0, vf.Articulation({ type: 'a.', position: 'above' }));
  id('m10b').addModifier(0, vf.Articulation({ type: 'a.', position: 'below' }));
  id('m10c').addModifier(0, vf.Articulation({ type: 'a.', position: 'below' }));
  id('m10d').addModifier(0, vf.Fingering({ number: '4' }));

  vf.Curve({
    from: id('m9a'),
    to: id('m10a'),
    options: { cps: [{ x: 0, y: 40 }, { x: 0, y: 40 }] },
  });

  /*  Measure 11 */
  system = makeSystem(150);
  system.addStave({
    voices: [
      voice([
        notes('E5/q[id="m11a"]'),
        beam(notes('C5/8, D5, E5, F5', { stem: 'down' })),
      ].reduce(concat)),
    ],
  });
  id('m11a').addModifier(0, vf.Fingering({ number: '3', position: 'above' }));

  system.addStave({ voices: [voice(notes('C4/h.', { clef: 'bass' }))] });
  system.addConnector('singleRight');

  /*  Measure 12 */
  system = makeSystem(170);
  system.addStave({ voices: [voice(notes('G5/q[id="m12a"], G4[id="m12b"], G4[id="m12c"]'))] });

  system.addStave({
    voices: [
      score.set({ clef: 'bass' }).voice([
        notes('B3/q[id="m12d"]'),
        beam(notes('C4/8, B3, A3, G3[id="m12e"]', { stem: 'down' })),
      ].reduce(concat)),
    ],
  });
  system.addConnector('singleRight');

  id('m12a').addModifier(0, vf.Articulation({ type: 'a.', position: 'above' }));
  id('m12b').addModifier(0, vf.Articulation({ type: 'a.', position: 'below' }));
  id('m12c').addModifier(0, vf.Articulation({ type: 'a.', position: 'below' }));

  id('m12d').addModifier(0, vf.Fingering({ number: '2', position: 'above' }));
  id('m12e').addModifier(0, vf.Fingering({ number: '4', position: 'above' }));

  vf.Curve({
    from: id('m11a'),
    to: id('m12a'),
    options: { cps: [{ x: 0, y: 20 }, { x: 0, y: 20 }] },
  });

  /*  Measure 13 (New system) */
  x = 20;
  y += 230;

  system = makeSystem(220);
  system.addStave({
    voices: [
      score.set({ clef: 'treble' }).voice([
        notes('c5/q[id="m13a"]'),
        beam(notes('d5/8, c5, b4, a4', { stem: 'down' })),
      ].reduce(concat)),
    ],
  }).addClef('treble').addKeySignature('G');

  system.addStave({ voices: [voice(notes('a3/h[id="m13b"], f3/q[id="m13c"]', { clef: 'bass' }))] })
    .addClef('bass').addKeySignature('G');

  system.addConnector('brace');
  system.addConnector('singleRight');
  system.addConnector('singleLeft');

  id('m13a').addModifier(0, vf.Fingering({ number: '4', position: 'above' }));
  id('m13b').addModifier(0, vf.Fingering({ number: '1' }));
  id('m13c').addModifier(0, vf.Fingering({ number: '3', position: 'above' }));

  /*  Measure 14 */
  system = makeSystem(180);
  system.addStave({
    voices: [
      score.set({ clef: 'treble' }).voice([
        notes('B4/q'),
        beam(notes('C5/8, b4, a4, g4', { stem: 'up' })),
      ].reduce(concat)),
    ],
  });

  system.addStave({ voices: [voice(notes('g3/h[id="m14a"], b3/q[id="m14b"]', { clef: 'bass' }))] });
  system.addConnector('singleRight');

  id('m14a').addModifier(0, vf.Fingering({ number: '2' }));
  id('m14b').addModifier(0, vf.Fingering({ number: '1' }));

  /*  Measure 15 */
  system = makeSystem(180);
  system.addStave({
    voices: [
      score.set({ clef: 'treble' }).voice([
        notes('a4/q'),
        beam(notes('b4/8, a4, g4, f4[id="m15a"]', { stem: 'up' })),
      ].reduce(concat)),
    ],
  });

  system.addStave({ voices: [voice(notes('c4/q[id="m15b"], d4, d3', { clef: 'bass' }))] });
  system.addConnector('singleRight');

  id('m15a').addModifier(0, vf.Fingering({ number: '2' }));
  id('m15b').addModifier(0, vf.Fingering({ number: '2' }));

  /*  Measure 16 */
  system = makeSystem(130);
  system.addStave({
    voices: [
      score.set({ clef: 'treble' }).voice([
        notes('g4/h.[id="m16a"]'),
      ].reduce(concat)),
    ],
  }).setEndBarType(VF.Barline.type.REPEAT_END);

  system.addStave({ voices: [voice(notes('g3/h[id="m16b"], g2/q', { clef: 'bass' }))] })
    .setEndBarType(VF.Barline.type.REPEAT_END);
  system.addConnector('boldDoubleRight');

  id('m16a').addModifier(0, vf.Fingering({ number: '1' }));
  id('m16b').addModifier(0, vf.Fingering({ number: '1' }));

  vf.Curve({
    from: id('m13a'),
    to: id('m16a'),
    options: {
      cps: [{ x: 0, y: 50 }, { x: 0, y: 20 }],
      invert: true,
      position_end: 'nearTop',
    },
  });

  /* Measure 17 */
  system = makeSystem(180);
  system.addStave({
    voices: [
      score.set({ clef: 'treble' }).voice([
        notes('b5/q[id="m17a"]'),
        beam(notes('g5/8, a5, b5, g5', { stem: 'down' })),
      ].reduce(concat)),
      voice([vf.TextDynamics({ text: 'mf', duration: 'h', dots: 1, line: 10 })]),
    ],
  }).setBegBarType(VF.Barline.type.REPEAT_BEGIN);

  system.addStave({ voices: [voice(notes('g3/h.', { clef: 'bass' }))] })
    .setBegBarType(VF.Barline.type.REPEAT_BEGIN);

  system.addConnector('boldDoubleLeft');
  system.addConnector('singleRight');

  id('m17a').addModifier(0, vf.Fingering({ number: '5', position: 'above' }));

  /* Measure 18 */
  system = makeSystem(180);
  system.addStave({
    voices: [
      score.set({ clef: 'treble' }).voice([
        notes('a5/q[id="m18a"]'),
        beam(notes('d5/8, e5, f5, d5[id="m18b"]', { stem: 'down' })),
      ].reduce(concat)),
    ],
  });

  system.addStave({ voices: [voice(notes('f3/h.', { clef: 'bass' }))] });
  system.addConnector('singleRight');

  id('m18a').addModifier(0, vf.Fingering({ number: '4', position: 'above' }));

  vf.Curve({
    from: id('m17a'),
    to: id('m18b'),
    options: {
      cps: [{ x: 0, y: 20 }, { x: 0, y: 30 }],
    },
  });

  /* Done */

  vf.draw();
  VF.Registry.disableDefaultRegistry();
}

module.exports = {
  lang: "vexflow",
  callback: rendervexflow,
};
