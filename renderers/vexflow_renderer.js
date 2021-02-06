"use strict";
const Vex = require('vexflow/releases/vexflow-min');
const VexParser =  require("../parsers/vexflow_parser.js");
const VF = Vex.Flow;

function concat(a, b) { return a.concat(b); }

function err(str) {
  throw new Vex.RERR('BadArgument', str);
}

function rendervexflow(str, opts) {
  // Parse the vexflow music notation
  var parsed = VexParser.parseVex(str);
  const svgContainer = document.createElement("div");
  var systemWidth = 600;
  var options = { renderer: {elementId: svgContainer, width: systemWidth+100, height: 900} }
  if (str.includes("bach")) {
    bachSample(options);
    return svgContainer.outerHTML;
  }

  var registry = new VF.Registry();
  function id(id) { return registry.getElementById(id); }

  VF.Registry.enableDefaultRegistry(registry);
  var vf = new VF.Factory(options);
  var score = vf.EasyScore({ throwOnError: true });

  var voice = score.voice.bind(score);
  var notes = score.notes.bind(score);
  var beam = score.beam.bind(score);
  var tuplet = score.tuplet.bind(score);

  var x = 20; // Place pour l'accolade ?
  var y = 80;
  function makeSystem(width) {
    var system = vf.System({ x: x, y: y, width: width, spaceBetweenStaves: 10 });
    x += width;
    return system;
  }
  
  if (parsed.staves.length==0) err("No staff defined.");
  if (parsed.staves[0])
  parsed.staves[0].options.clef='treble';
  if (parsed.staves[1])
    parsed.staves[1].options.clef='bass';

  // TODO : verifier qu'il y a le MEME nombre de bars par staff
  var barCount = parsed.staves[0].bars.length;
  for(let bar=0; bar<barCount; bar++) {
    var barWidth = systemWidth / barCount;
    var system = makeSystem(barWidth);
    parsed.staves.forEach(staff => {
      var clef = staff.options.clef;
      var newStave = system.addStave({
        voices: [
          voice(
            staff.bars[bar].blocs.map( bloc=> {
                if (bloc.type=='notes') {
                  var options = {clef: clef};
                  return notes(bloc.values, options);
                }
            }).reduce(concat)
          )
        ],
      });
      if (bar==0) {
        newStave.addClef(staff.options.clef);
        newStave.addTimeSignature('4/4');
        newStave.addKeySignature('Bb');
        /* First staff only
        newStave.setTempo({ duration: 'q', dots: 0, bpm: 60}, -10);
        */
      }
      /*      .addClef('treble')
        .addKeySignature('G')
        .addTimeSignature('3/4')
        .setTempo({ name: 'Allegretto', duration: 'h', dots: 1, bpm: 66}, -30);*/
    });
    if (bar==0) {
      system.addConnector('brace');
      system.addConnector('singleLeft');
    }
  }
  system.addConnector('singleRight');
  
  vf.draw();
  VF.Registry.disableDefaultRegistry();
  return svgContainer.outerHTML;
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
