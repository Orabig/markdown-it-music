"use strict";
const Vex = require('vexflow/releases/vexflow-min');
const VexParser =  require("../parsers/vexflow_parser.js");

/**
 * 
 * {
    voices: [
      score.voice(score.notes('C#5/q, B4, A4, G#4', {stem: 'up'})),
      score.factory.Voice()
        .addTickables(score.notes('C#4/h,D4/q'))
        .addTickables(score.tuplet(score.beam(score.notes('E4/8, c4, D4',{stem: 'down'}))))
          // score.voice(score.notes('C#4/h', {stem: 'down'})).addTickables(score.notes('C#4', {stem: 'down'}))
    ]
  }
 * 
 * @param {*} score 
 * @param {*} stave 
 */
function renderStave(score, stave, clef) {
  
  var voices = stave.voices.map(voiceDefinition => {
    var parsedVoice = score.factory.Voice();
    voiceDefinition.blocs.forEach( bloc=> {
      if (bloc.type=='notes') {
        var options = {clef: clef};
        parsedVoice.addTickables(score.notes(bloc.values, options));
      }
    });
    return parsedVoice;
  });
  return { voices: voices };/*
  return {
    voices: [
      score.factory.Voice().addTickables(score.notes('C#5/q, B4, A4, G#4', {stem: 'up'})),
      score.factory.Voice()
        .addTickables(score.notes('C#4/h,D4/q'))
        .addTickables(score.tuplet(score.beam(score.notes('E4/8, c4, D4',{stem: 'down'}))))
          // score.voice(score.notes('C#4/h', {stem: 'down'})).addTickables(score.notes('C#4', {stem: 'down'}))
    ]
  };*/
}

function rendervexflow(str, opts) {
  // Parse the vexflow music notation
  var parsed = VexParser.parseVex(str);

  const VF = Vex.Flow;
  const svgContainer = document.createElement("div");
  //const renderer = new VF.Renderer(svgContainer, VF.Renderer.Backends.SVG);

  var vf = new VF.Factory({
    renderer: {elementId: svgContainer, width: 800, height: 400}
  });
  var score = vf.EasyScore();
  var system = vf.System();
  /*
  system.addStave({
    voices: [
      score.voice(
        score.notes('C#5/q, B4[stem="down"]',{stem: 'up'})
        .concat(
          score.notes('B4/8.',{stem: 'up'})
        )
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
  // ?? ne fonctionne pas .setRepetitionTypeRight(VF.Repetition.FINE)  http://public.vexflow.com/build/docs/staverepetition.html
  // ?? Idem . setEndBarType(VF.Barline.NONE)
  .setText("Am   Cm       Bb7",VF.StaveText.Position.ABOVE,{}); // http://public.vexflow.com/build/docs/stavetext.html
  
  system.addStave({
    voices: [
      score.voice(score.notes('C#3/q, B2, A2/8, B2, C#3, D3', {clef: 'bass', stem: 'up'})),
    ]
  }).addClef('bass').addTimeSignature('4/4');*/
  // v= score.factory.Voice();
  //x=v.addTickables(score.notes('C#4/h,D4/q',{stem: 'down'}));
  //x=v.addTickables(score.tuplet(score.beam(score.notes('E4/8, c4, D4',{stem: 'down'}))));
  
  parsed.staves.forEach(stave => stave.options.timeSignature='4/4')
  if (parsed.staves[0])
    parsed.staves[0].options.clef='treble';
  if (parsed.staves[1])
    parsed.staves[1].options.clef='bass';

  parsed.staves.forEach(stave => {
    system.addStave( renderStave(score, stave, stave.options.clef) )
    .addClef(stave.options.clef)
    .addTimeSignature(stave.options.timeSignature);
  });
  /*
  system.addStave({
    voices: [
      score.voice(score.notes('C#5/q, B4, A4, G#4', {stem: 'up'})),
      score.factory.Voice()
        .addTickables(score.notes('C#4/h,D4/q'))
        .addTickables(score.tuplet(score.beam(score.notes('E4/8, c4, D4',{stem: 'down'}))))
          // score.voice(score.notes('C#4/h', {stem: 'down'})).addTickables(score.notes('C#4', {stem: 'down'}))
    ]
  }).addClef('treble').addTimeSignature('4/4');
  
  system.addStave({
    voices: [
      score.voice(score.notes('(C#3 E3 G3)/q, B2, A2/8, B2, C#3, D3', {clef: 'bass', stem: 'up'})),
      score.voice(score.notes('C#2/h, C#2', {clef: 'bass', stem: 'down'}))
    ]
  }).addClef('bass').addTimeSignature('4/4');
  */
  system.addConnector()

/*
From https://groups.google.com/g/vexflow/c/qsG9Qv4W8Xc/m/VEvJQQy3DAAJ
  // Formatter
  const formatter = new Vex.Flow.Formatter()
  formatter.joinVoices([voice, voiceForScaleNameText])
  formatter.format([voice], 48 * noteWidth)
  formatter.format([voiceForScaleNameText], 48 * noteWidth)
*/
  //system.addConnector().setType(0); // http://public.vexflow.com/build/docs/staveconnector.html
  //system.addConnector().setType(1);
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
