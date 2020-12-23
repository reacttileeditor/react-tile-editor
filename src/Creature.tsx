import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";
import { v4 as uuid } from "uuid";

import { ƒ } from "./Utils";

// import { Canvas_View } from "./Canvas_View";
// import { Asset_Manager } from "./Asset_Manager";
// import { Blit_Manager } from "./Blit_Manager";
// import { Tile_Palette_Element } from "./Tile_Palette_Element";
import { Tilemap_Manager } from "./Tilemap_Manager";
import { Pathfinder, Pathfinding_Result } from "./Pathfinding";

import { Point2D, Rectangle } from './interfaces';



export class Creature {
	tile_pos: Point2D;
	planned_tile_pos: Point2D;
	unique_id: string;
	path_this_turn: Array<Point2D>;
	path_reachable_this_turn: Array<Point2D>;
	animation_this_turn: Array<Anim_Schedule_Element>;
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
		this.path_reachable_this_turn = [];
		this.animation_this_turn = [];
		
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
	
	yield_walk_asset_for_direction = (direction: Direction):string => (
		this.creature_basetype_delegate.yield_walk_asset_for_direction(direction)
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
	
	set_path = (new_path: Array<Point2D>) => {
		this.path_this_turn = new_path;
		this.path_reachable_this_turn = this.yield_path_reachable_this_turn(new_path);
		
		this.build_anim_from_path();
	}
	
	yield_path_reachable_this_turn = (new_path: Array<Point2D>):Array<Point2D> => {
		let moves_remaining = this.yield_moves_per_turn();
		let final_path: Array<Point2D> = [];
	
		_.map( new_path, (val) => {
			moves_remaining = moves_remaining - 1;
			
			if(moves_remaining > 0){
				final_path.push(val);
			}
		})
		
		return final_path;
	}
	
	build_anim_from_path = () => {
		var time_so_far = 0;
		this.animation_this_turn = [];

		_.map(this.path_reachable_this_turn, (val,idx) => {
			if(idx != _.size(this.path_reachable_this_turn) - 1){
				this.animation_this_turn.push({
					direction: this.extract_direction_from_map_vector(
						val,
						this.path_reachable_this_turn[idx + 1]	
					),
					duration: 300,
					start_time: time_so_far,
					start_pos: val,
					end_pos: this.path_reachable_this_turn[idx + 1],
				})
				
				time_so_far = time_so_far + 300;
			}
		})
	}

	extract_direction_from_map_vector = (start_pos: Point2D, end_pos: Point2D):Direction => {
		if( start_pos.y == end_pos.y ){
			if(start_pos.x < end_pos.x){
				return Direction.east;
			} else {
				return Direction.west;
			}
		} else if( start_pos.y >= end_pos.y  ){
			if(start_pos.x < end_pos.x){
				return Direction.north_east;
			} else {
				return Direction.north_west;
			}
		} else {
			if(start_pos.x < end_pos.x){
				return Direction.south_east;
			} else {
				return Direction.south_west;
			}
		}
	}
	
	calculate_total_anim_duration = (): number => {
		return ƒ.if( _.size(this.animation_this_turn) > 0,
			_.reduce(
				_.map(this.animation_this_turn, (val)=> (val.duration)),
				(left,right) => (left + right)
			) as number,
			0
		)
	}

	yield_animation_segment_for_time_offset = (offset_in_ms: number): Anim_Schedule_Element|undefined => (
		_.find(this.animation_this_turn, (val) => {
			//			console.log(`start ${val.start_time}, offset ${offset_in_ms}, end ${val.start_time + val.duration}`);
		
			return val.start_time <= offset_in_ms
			&&
			offset_in_ms < (val.start_time + val.duration)
		})
	)


	yield_direction_for_time_in_post_turn_animation = ( offset_in_ms: number ):Direction => {
		var animation_segment = this.yield_animation_segment_for_time_offset(offset_in_ms);

		if(animation_segment == undefined){
			/*
				TODO -I don't really have the time to think through this - this comment's getting written during some test implementation.
				We'll just return 'east' for now.
			*/
			return Direction.east;
		} else {
			return this.extract_direction_from_map_vector(
				animation_segment.start_pos,
				animation_segment.end_pos 
			);
		}
	}
	
	yield_position_for_time_in_post_turn_animation = (_Tilemap_Manager: Tilemap_Manager, offset_in_ms: number):Point2D => {
//		console.log(this.animation_this_turn);
		var animation_segment = this.yield_animation_segment_for_time_offset(offset_in_ms);
		
		if(animation_segment == undefined){
			/*
				There are a few reasons we might not be able to find a corresponding animation segment.
				If the desired time is off the end of the animation, return our final position.
				
				If it's absolutely anything else, then let's just return the initial starting position.  The most common case for this would be one where we just don't really have an animation.
				(Nominally this would include "before the start of the animation", but as much as that's an error case, it makes no sense why we'd end up there)
			*/

			if(offset_in_ms >= this.calculate_total_anim_duration() ){
				return _Tilemap_Manager.convert_tile_coords_to_pixel_coords(this.planned_tile_pos)
			} else {
				return _Tilemap_Manager.convert_tile_coords_to_pixel_coords(this.tile_pos)
			}
		} else {
			//cheating for some test code - first we'll just do the start pos; then we'll linearly interpolate.   We want to linearly interpolate here, because any "actual" easing function should happen over the whole animation, not one segment (otherwise we'll have a very 'stuttery' movement pattern.
			
			let time_offset_in_anim_segment = (offset_in_ms - animation_segment.start_time);
			let time_offset_normalized = 1.0 - (time_offset_in_anim_segment / animation_segment.duration)
			
            return ƒ.round_point_to_nearest_pixel( 
                ƒ.tween_points(
                    _Tilemap_Manager.convert_tile_coords_to_pixel_coords( animation_segment.start_pos ),
                    _Tilemap_Manager.convert_tile_coords_to_pixel_coords( animation_segment.end_pos ),
                    time_offset_normalized
                )
            );
			
			//return _Tilemap_Manager.convert_tile_coords_to_pixel_coords(animation_segment.start_pos);
		}
	}
}

export enum Direction {
	north_east,
	east,
	south_east,
	north_west,
	west,
	south_west,
}

type Anim_Schedule_Element = {
	direction: Direction,
	duration: number,
	start_time: number,
	start_pos: Point2D,
	end_pos: Point2D,
}


type CreatureType = CT_Hermit | CT_Peasant | CT_Skeleton;


class Creature_Base_Type {
	yield_walk_asset_for_direction = (direction:Direction):string => ( this.yield_creature_image() )


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

	yield_walk_asset_for_direction = (direction:Direction):string => {
		switch(direction){
			case Direction.north_east:
				return 'peasant-ne-walk'; break;
			case Direction.north_west:
				return 'peasant-ne-walk'; break;
			case Direction.east:
				return 'peasant-ne-walk'; break;
			case Direction.south_east:
				return 'peasant-se-walk'; break;
			case Direction.west:
				return 'peasant-se-walk'; break;
			case Direction.south_west:
				return 'peasant-se-walk'; break;
		}
	}

	yield_moves_per_turn = () => ( 8 )
	yield_creature_image = () => ( 'peasant' )

}

class CT_Skeleton extends Creature_Base_Type {

	yield_moves_per_turn = () => ( 8 )
	yield_creature_image = () => ( 'skeleton' )

}
