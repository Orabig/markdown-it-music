"use strict";

const rewire = require("rewire");
const parser = rewire("./vexflow_parser.js");

describe("Vexflow Parser", () => {
    test("should parse definitions", () => {
        const expectedDefinition = {
            staves:[
                {
                    voices:[
                        {
                            blocs: [
                              { type: 'notes', values: 'a, b, c' }
                            ], options: {}
                        }
                    ], options: {}
                }
            ]
        };
    
        const text = `
          stave
              voice
                  notes
                      a, b, c`;
        const actualDefinition = parser.parseVex(text);
    
        expect(actualDefinition).toEqual(expectedDefinition);
      });
  

      test("should parse more definitions", () => {
        const expectedDefinition = {
            staves:[
                {  voices:[
                    {  blocs: [
                            { type: 'notes', values: 'a, b' },
                            { type: 'notes', values: 'a, b' }
                        ], options: {}
                    },
                    {  blocs: [
                            { type: 'notes', values: 'a, b, c' },
                            { type: 'notes', values: 'a, b, c' }
                        ], options: {}
                    }
                ], options: {}
            }
        ]};
    
        const text = `
          stave
              voice
                notes
                    a
                    , b
                notes
                    a
                    , b
              voice
                  notes
                      a
                      , b
                      , c
                  notes
                      a
                      , b
                      , c`;
        const actualDefinition = parser.parseVex(text);
    
        expect(actualDefinition).toEqual(expectedDefinition);
      });


    });