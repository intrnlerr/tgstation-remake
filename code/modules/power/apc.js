'use strict';
const {Component, make_watched_property, has_component} = require('bluespess');
const layers = require('../../defines/layers.js');
const {_areas} = require('../../game/area/area.js').symbols;
const channels = ["lighting", "equipment", "environment"];

class Apc extends Component {
	constructor(atom, template) {
		super(atom, template);

		this.channel_on = {};
		this.channel_auto = {};
		for(let channel of channels) {
			this.channel_on[channel] = true;
			this.channel_auto[channel] = true;
		}

		this.a.once("map_instance_done", (map) => {
			if(this.area_override_id && map[_areas]) {
				let area = map[_areas][this.area_override_id];
				if(!area || !has_component(area, "AreaPower")) {
					console.warn(new Error(`"${this.area_override_id}" (${area}) is not a valid APC area`));
					return;
				}
				if(area.c.AreaPower.apc) {
					console.warn(new Error(`"${this.area_override_id}" already has an APC`));
					return;
				}
				this.area = map[_areas][this.area_override_id];
				return;
			}
			for(let brush of this.a.crosses()) {
				if(!has_component(brush, "AreaBrush"))
					continue;
				let area = brush.c.AreaBrush.area;
				if(!area) {
					area = map[_areas][brush.c.AreaBrush.map_id];
				}
				if(!area)
					continue;
				if(has_component(area, "AreaPower") && !area.c.AreaPower.apc) {
					this.area = area;
				}
			}
			if(!this.area) {
				console.warn(new Error(`APC at (${this.a.x}, ${this.a.y}) has no valid area!`));
				return;
			}
		});
		this.on("area_changed", this.area_changed.bind(this));
		make_watched_property(this, "area");
	}

	area_changed(from, to) {
		if(from && from.c.AreaPower.apc == this.a)
			from.c.AreaPower.apc = null;
		if(to) {
			if(to.c.AreaPower.apc)
				console.warn(new Error(`This apc at (${this.a.x},${this.a.y}) was assigned an area that already has one!`));
			to.c.AreaPower.apc = this.a;
			this.a.name = to.name + " APC";
		}
	}

	get_available_power(channel = "equipment") {
		if(!this.channel_on[channel])
			return 0;
		let available_power = 0;
		if(this.cell)
			available_power += this.cell.c.PowerCell.charge * 1000;
		available_power += this.a.c.PowerNode.surplus;
		return available_power;
	}

	use_power(amount, channel = "equipment") {
		if(!this.channel_on[channel])
			return 0;

		let powernet_surplus = this.a.c.PowerNode.surplus;
		let to_use_powernet = Math.min(amount, powernet_surplus);
		this.a.c.PowerNode.load += to_use_powernet;
		amount -= to_use_powernet;

		let to_use_cell = 0;
		if(this.cell) {
			to_use_cell = Math.min(amount, this.cell.c.PowerCell.charge * 1000);
			to_use_cell = this.cell.c.PowerCell.use(to_use_cell / 1000) * 1000;
			amount -= to_use_cell;
		}

		return to_use_powernet + to_use_cell;
	}
}

Apc.loadBefore = ["Destructible", "PowerNode", "LightSource"];
Apc.depends = ["Destructible", "PowerNode", "LightSource"];

Apc.template = {
	vars: {
		components: {
			"Apc": {
				area_override_id: null,
				start_charge: 0.9,
				cell_type: "cell_upgraded",

				opened: false,
				has_cover: true,
				shorted: false,

			},
			"LightSource": {
				radius: 2
			},
			"Destructible": {
				max_integrity: 200,
				integrity_failure: 0
			},
			"Tangible": {
				anchored: true
			},
			"Examine": {
				desc: "A control terminal for the area electrical systems."
			}
		},
		name: "area power controller",
		icon: 'icons/obj/power.png',
		icon_state: "apc0",
		layer: layers.OBJ_LAYER
	}
};

module.exports.templates = {
	"apc": {
		components: ["Apc"],
		variants: [
			{
				type: "single",
				var_path: ["dir"],
				values: [1, 2, 4, 8],
				orientation: "horizontal"
			}
		],
		tree_path: ["basic_structures/apc"]
	}
};

module.exports.components = {Apc};
module.exports.channels = channels;
