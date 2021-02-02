"use strict";
const Vex = require('vexflow/releases/vexflow-min');

function rendervexflow(str, opts) {
  // Parse the vexflow music notation

  const VF = Vex.Flow;
  const div = document.createElement("div");
  const renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);

  // Configure the rendering context.
  renderer.resize(500, 500);
  const context = renderer.getContext();
  context.setFont("Arial", 10, "").setBackgroundFillStyle("#eed");
  
// measure 1
var staveMeasure1 = new Vex.Flow.Stave(10, 0, 300);
staveMeasure1.addClef("treble").setContext(context).draw();

var notesMeasure1 = [
  new Vex.Flow.StaveNote({ keys: ["c/4"], duration: "q" }),
  new Vex.Flow.StaveNote({ keys: ["d/4"], duration: "q" }),
  new Vex.Flow.StaveNote({ keys: ["b/4"], duration: "qr" }),
  new Vex.Flow.StaveNote({ keys: ["c/4", "e/4", "g/4"], duration: "q" }),
];

// Helper function to justify and draw a 4/4 voice
Vex.Flow.Formatter.FormatAndDraw(context, staveMeasure1, notesMeasure1);

// measure 2 - juxtaposing second measure next to first measure
var staveMeasure2 = new Vex.Flow.Stave(
  staveMeasure1.width + staveMeasure1.x,
  0,
  400
);
staveMeasure2.setContext(context).draw();

var notesMeasure2_part1 = [
  new Vex.Flow.StaveNote({ keys: ["c/4"], duration: "8" }),
  new Vex.Flow.StaveNote({ keys: ["d/4"], duration: "8" }),
  new Vex.Flow.StaveNote({ keys: ["b/4"], duration: "8" }),
  new Vex.Flow.StaveNote({ keys: ["c/4", "e/4", "g/4"], duration: "8" }),
];

var notesMeasure2_part2 = [
  new Vex.Flow.StaveNote({ keys: ["c/4"], duration: "8" }),
  new Vex.Flow.StaveNote({ keys: ["d/4"], duration: "8" }),
  new Vex.Flow.StaveNote({ keys: ["b/4"], duration: "8" }),
  new Vex.Flow.StaveNote({ keys: ["c/4", "e/4", "g/4"], duration: "8" }),
];

// create the beams for 8th notes in 2nd measure
var beam1 = new Vex.Flow.Beam(notesMeasure2_part1);
var beam2 = new Vex.Flow.Beam(notesMeasure2_part2);

var notesMeasure2 = notesMeasure2_part1.concat(notesMeasure2_part2);

Vex.Flow.Formatter.FormatAndDraw(context, staveMeasure2, notesMeasure2);

// Render beams
beam1.setContext(context).draw();
beam2.setContext(context).draw();
  // Format and justify the notes to 400 pixels.
//  var formatter = new VF.Formatter().joinVoices([voice]).format([voice], 400);
  
  // Render voice
  //voice.draw(context, stave);

  return div.outerHTML;
}

module.exports = {
  lang: "vexflow",
  callback: rendervexflow,
};
