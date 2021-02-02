"use strict";
const Vex = require('vexflow/releases/vexflow-min');

function rendervexflow(str, opts) {
  // Parse the vexflow music notation

  const VF = Vex.Flow;
  const svgContainer = document.createElement("div");
  //const renderer = new VF.Renderer(svgContainer, VF.Renderer.Backends.SVG);

  var vf = new VF.Factory({
    renderer: {elementId: svgContainer, width: 600, height: 400}
  });
  var score = vf.EasyScore();
  var system = vf.System();
  
  system.addStave({
    voices: [
      score.voice(
        score.notes('C#5/q, B4[stem="down"], B4/8.',{stem: 'up'})
        .concat(
          vf.GraceNote(
            {keys: ['d/4'], duration: '16', slash: true}
          )
        )
        .concat(
          score.tuplet(score.beam(
            score.notes('B3/8, C#4/8, D4/8',{stem: 'up'})
            )
          )
        )
      ),
      score.voice(score.notes('(C#4 E4 G4)/h, C4', {stem: 'down'}))
    ]
  }).addClef('treble').addTimeSignature('4/4')
  .setText("Am   Cm       Bb7",VF.StaveText.Position.ABOVE,{}); // http://public.vexflow.com/build/docs/stavetext.html
  
  system.addStave({
    voices: [
      score.voice(score.notes('C#3/q, B2, A2/8, B2, C#3, D3', {clef: 'bass', stem: 'up'})),
      score.voice(score.notes('C#2/h, C#2', {clef: 'bass', stem: 'down'}))
    ]
  }).addClef('bass').addTimeSignature('4/4');
  
  system.addConnector().setType(0); // http://public.vexflow.com/build/docs/staveconnector.html
  system.addConnector().setType(1);
  vf.draw();
  return svgContainer.outerHTML;
  // Configure the rendering context.
//  
//  const context = renderer.getContext();
//  context.setFont("Arial", 10, "").setBackgroundFillStyle("#eed");
/*
// measure 1
var staveMeasure1 = new Vex.Flow.Stave(10, 0, 300);
staveMeasure1.addClef("treble").setContext(context).draw();

var notesMeasure1 = [
  new Vex.Flow.StaveNote({ keys: ["c/4"], duration: "q" })
];

// Helper function to justify and draw a 4/4 voice
Vex.Flow.Formatter.FormatAndDraw(context, staveMeasure1, notesMeasure1);


// Format and justify the notes to 400 pixels.
//  var formatter = new VF.Formatter().joinVoices([voice]).format([voice], 400);
  
  // Render voice
  //voice.draw(context, stave);

  return svgContainer.outerHTML;*/
}

module.exports = {
  lang: "vexflow",
  callback: rendervexflow,
};
