import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";
import { v4 as uuid } from "uuid";

import { ƒ } from "./Utils";

// import { Canvas_View } from "./Canvas_View";
// import { Asset_Manager } from "./Asset_Manager";
// import { Blit_Manager } from "./Blit_Manager";
// import { Tile_Palette_Element } from "./Tile_Palette_Element";
// import { Tilemap_Manager } from "./Tilemap_Manager";
// import { Pathfinder } from "./Pathfinding";

import { Point2D, Rectangle } from './interfaces';


export class Creature {
	tile_pos: Point2D;
	creature_image: string;
	planned_tile_pos: Point2D;
	unique_id: string;
	path_this_turn: Array<Point2D>;

	constructor(p: {
		tile_pos: Point2D,
		creature_image: string,
		planned_tile_pos: Point2D,
		unique_id?: string,
	}) {
		this.tile_pos = p.tile_pos;
		this.creature_image = p.creature_image;
		this.planned_tile_pos = p.planned_tile_pos;
		this.path_this_turn = [];
		
		if(p.unique_id != undefined){
			this.unique_id = p.unique_id;
		} else {
			this.unique_id = uuid();
		}
	}
	
	yield_move_cost_for_tile_type = (tile_type: string): number|null => {
		if(tile_type == 'water'){
			return null;
		} else if (tile_type == 'menhir'){
			return 10;
		} else {
			return 1;
		}
	}
	
	yield_moves_per_turn = (): number => {
		if(this.creature_image == 'hermit'){
			return 5;
		} else /* if(this.creature_image == 'peasant') */ {
			return 8;
		}
	}
}


export class Creature_Type {

}