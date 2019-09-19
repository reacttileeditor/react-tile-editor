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
	planned_tile_pos: Point2D;
	unique_id: string;
	path_this_turn: Array<Point2D>;
	type_name: string;

	creature_basetype_delegate: CreatureType;

	constructor(p: {
		tile_pos: Point2D,
		planned_tile_pos: Point2D,
		type_name: string,
		unique_id?: string,
	}) {
		this.tile_pos = p.tile_pos;
		this.type_name = p.type_name;
		this.planned_tile_pos = p.planned_tile_pos;
		this.path_this_turn = [];
		
		if(p.unique_id != undefined){
			this.unique_id = p.unique_id;
		} else {
			this.unique_id = uuid();
		}
		
		this.creature_basetype_delegate = this.instantiate_basetype_delegate();
	}
	
	yield_move_cost_for_tile_type = (tile_type: string): number|null => (
		this.creature_basetype_delegate.yield_move_cost_for_tile_type(tile_type)
	)
	
	yield_moves_per_turn = (): number => (
		this.creature_basetype_delegate.yield_moves_per_turn()
	)
	
	yield_creature_image = () => (
		this.creature_basetype_delegate.yield_creature_image()
	)

	instantiate_basetype_delegate = ():CreatureType => {
		switch(this.type_name){
			case 'hermit':
				return new CT_Hermit();
				break;
			case 'peasant':
				return new CT_Peasant();
				break;            
			case 'skeleton':
			default:
				return new CT_Skeleton();
		}
	}
}


type CreatureType = CT_Hermit | CT_Peasant | CT_Skeleton;


class Creature_Base_Type {

	yield_move_cost_for_tile_type = (tile_type: string): number|null => {
		if(tile_type == 'water'){
			return null;
		} else if (tile_type == 'menhir'){
			return 10;
		} else {
			return 1;
		}
	}

	yield_moves_per_turn = (): number => ( 1 )

	yield_creature_image = () => ( '' )

}

class CT_Hermit extends Creature_Base_Type {

	yield_moves_per_turn = () => ( 5 )
	yield_creature_image = () => ( 'hermit' )

}

class CT_Peasant extends Creature_Base_Type {

	yield_moves_per_turn = () => ( 8 )
	yield_creature_image = () => ( 'peasant' )

}

class CT_Skeleton extends Creature_Base_Type {

	yield_moves_per_turn = () => ( 8 )
	yield_creature_image = () => ( 'skeleton' )

}
