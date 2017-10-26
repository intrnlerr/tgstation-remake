'use strict';
var {Component} = require('bluespess');
class Tangible extends Component {
	constructor(atom, template) {
		super(atom, template);
		this.fingerprints = [];
		this.fingerprints_hidden = [];
		this.pullers = [];
		this.atom.on("bumped_by", this.bumped_by.bind(this));
	}

	bumped_by(atom, offsetx, offsety, reason) {
		if(!this.anchored && (reason == "walking" || reason == "bumped")) {
			this.atom.appearance.glide_size = atom.appearance.glide_size;
			this.atom.move(Math.sign(offsetx), Math.sign(offsety), "bumped");
		}
	}
}

Tangible.LAVA_PROOF = -2;
Tangible.FIRE_PROOF = -1;
Tangible.FLAMMABLE = 0;
Tangible.ON_FIRE = 1;

Tangible.template = {
	vars: {
		components: {
			Tangible: {
				anchored: false,
				unacidable: false,
				throw_speed: 2,
				throw_range: 7,
				throw_force: 0,
				burn_state: Tangible.FIRE_PROOF, // LAVA_PROOF, FIRE_PROOF, FLAMMABLE, or ON_FIRE
				burn_time: 10, // How long it takes to burn to ashes, in seconds
			}
		}
	}
};

module.exports.components = {Tangible};
