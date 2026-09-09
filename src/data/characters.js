// The characters who carry a release.
//
// Three of Auny's records are told through a single recurring figure. This is
// the public version of each one: enough to read the album through them, and
// nothing more. The full canon — physical description, outfit, room, the
// image-generation prompts that keep them consistent across runs — lives in
// the vault under 🎵 Music/Characters/ and is production material, not site
// copy. Do not paste it in here.
//
// Keyed by name. A release opts in with `character: '<Name>'` in albums.js or
// singles.js, and both page types render the same block from this one source.
// Adding a character to a future release is a data edit, nothing more.

export const CHARACTERS = {
  Izzy: {
    name: 'Izzy',
    role: 'plays every track',
    story: [
      'A lyrical genius and instrument savant who lives inside the music, perpetually melancholy, her face veiled by each song’s flower. The vocal album personified each instrument as the lone figure; here a real one plays them.',
      'She carries the arc on her body. Lost across the first four tracks, she plays alone in deep shadow, half-turned away. Anchored through the middle, she steadies and begins to face forward as the palette warms. Empowered across the last three, she commands the machines, the color breaking from fire to a white-gold dawn.',
    ],
    arc: 'lost → dawn',
  },

  Annalise: {
    name: 'Annalise',
    role: 'the body in the song',
    story: [
      'A tribal Viking witch from the distant past, time-travelled into a present where the machine does everything for her. She is not horrified by it. She is not enchanted by it. She is studying it.',
      'The clash is the point: a woman whose entire culture was built on hand-made ritual, on the body’s intelligence, on analog magic, now sitting in front of something that paints, sings and writes faster than she can think. Everything in her room is hand-made or analog except the computer.',
      'The watching “she” of the second verse is doubled. The screen watches Annalise; Annalise watches the screen back. They are each other’s mirror, which is why the song ends by handing the choice back rather than laying blame.',
    ],
    arc: 'observation, not verdict',
  },

  // Rebel carries Perfect World. She is the only one of the four who MAKES the
  // art the record is about, which is why her block reads as craft rather than
  // interiority. Full canon (likeness, wardrobe, the generation prompts) stays
  // in the vault; this is the public half.
  Rebel: {
    name: 'Rebel',
    role: 'the one painting the wall',
    story: [
      'A street artist working at night, after rain, in parking lots and underpasses and on subway platforms. Every mark in this record\u2019s world is hers, and the cobalt-blue paint on her face and hands is how you know it.',
      'She does not narrate the song, she illustrates it. Each stanza pairs a good thing with a bad one happening at the same moment, and her job is to paint the good half onto a world delivering the other half behind her: a rainbow sprayed on a rooftop while a tornado closes in; her crying on a kerb while a lit window across town holds two people celebrating, the two joined by a trail of her own blue paint.',
      'Her register is weary defiance, not triumph. She keeps painting and it keeps getting painted over. The last line of the song is \u201cthere\u2019s no such thing as a perfect world\u201d, and her answer to it is to sit on a bench and watch a council worker roller flat grey across her mural, one stencilled bird escaping the edge.',
    ],
    arc: 'keeps painting anyway',
  },

  Caelle: {
    name: 'Caelle',
    role: 'the figure in all nineteen tracks',
    story: [
      'A boy who flatlined once and came back. He is alive on borrowed time, and across the record he slowly loses it again. He does not die in a burst; he winds down.',
      'The decay is mechanical, never gory. Doll-pale skin veined with cracks that glow cyan from beneath, clockwork where his heart used to beat, a stillness that reads as android rather than dead. He is the cover made into a person: the cyan flatline, the gold gears, the crimson-and-bluebell bloom, all carried on his body and all of it fading from organic to mechanism as the album plays.',
      'A seam of neon-cyan light runs across his chest, and it is his readout in every scene. It blooms roses and bluebells while he can still feel, spikes when something breaks through, turns to gold clockwork as life gives way to mechanism, and finally goes flat.',
    ],
    arc: 'alive → clockwork revenant',
  },
};
