import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";

import { ƒ } from "./Utils";

import { Canvas_View } from "./Canvas_View";
import { Asset_Manager } from "./Asset_Manager";
import { Blit_Manager } from "./Blit_Manager";
import { Tile_Palette_Element } from "./Tile_Palette_Element";
import { Tilemap_Manager, Direction } from "./Tilemap_Manager";
import { Pathfinder } from "./Pathfinding";

import { Creature, PathNodeWithDirection } from "./Creature";

import "./Primary_View.scss";
import { Point2D, Rectangle } from './interfaces';

interface Game_View_Props {
	_Asset_Manager: Asset_Manager,
	_Blit_Manager: Blit_Manager,
	assets_loaded: boolean,
	initialize_tilemap_manager: Function,
	_Tilemap_Manager: Tilemap_Manager,
	dimensions: Point2D,
}

interface Game_State {
	current_turn: number,
	selected_object_index?: number,
	turn_list: Array<Individual_Game_Turn_State>,
}

interface Individual_Game_Turn_State {
	creature_list: Array<Creature>
}

const Individual_Game_Turn_State_Init = {
	creature_list: []
}

const GameStateInit: Game_State = {
	current_turn: 0,
	selected_object_index: undefined,
	turn_list: []
};

interface AnimationState {
	is_animating_turn_end: boolean,
	time_turn_end_anim_started__in_ms: number
}


class Game_Manager {
	_Blit_Manager: Blit_Manager;
	_Asset_Manager: Asset_Manager;
	_Tilemap_Manager: Tilemap_Manager;
	animation_state: AnimationState;
	game_state: Game_State;
	update_game_state_for_ui: Function;
	_Pathfinder: Pathfinder;
	
	/*
		We need to handle individual turns progressing, so we'll need something to track modality.  We'll need a set of flags indicating what our mode is - are we watching a turn be animated, are we watching the enemy do a move?  Are we watching the player do their move?
		
		We also need to track the progression of turns themselves - each turn will be represented by a Game_Turn_State that represents the complete status of the map.  From a UI perspective, we'll need to handle tracking each player's *intended* moves, since a core design point of this game is that "you plan moves and your plans are interrupted by conflicting/contending with enemy action" - these are going to differ from what actually ends up happening (whereas in many game designs there's a 1-to-1 correlation.  I'm not sure if we'll need to actually track these in the history, but we definitely need to track them for the current turn, before it gets resolved.
	
	
		Our immediate goals should be as follows:
			- wire in the conceptual display of units on the map.  These need to be interleaved with and rendered as part of the terrain, since they can be behind plants and such.
			- set up the canvas event handling to treat individual clicks as issuing a move command for a unit (in this current iteration, there will be no "planning", and no "commit to ending a turn" - you will have a single unit, it will immediately issue its move for the turn when you click, and complete the turn.   Those other concepts are a good "next step".
			- stack up this successive turn propagation in the history
	*/

	constructor(
		_Blit_Manager: Blit_Manager,
		_Asset_Manager: Asset_Manager,
		_Tilemap_Manager: Tilemap_Manager,
	) {
		this._Blit_Manager = _Blit_Manager;
		this._Asset_Manager = _Asset_Manager;
		this._Tilemap_Manager = _Tilemap_Manager;
		this.update_game_state_for_ui = ()=>{};

		this.animation_state = {
			is_animating_turn_end: false,
			time_turn_end_anim_started__in_ms: 0
		};

		this.game_state = {
			current_turn: 0,
			selected_object_index: undefined,
			turn_list: [{
				creature_list: [new Creature({
					tile_pos: {x: 0, y: 6},
					planned_tile_pos: {x: 0, y: 6},
					type_name: 'hermit',
				}), new Creature({
					tile_pos: {x: 2, y: 4},
					planned_tile_pos: {x: 2, y: 4},
					type_name: 'peasant',
				})],
			}],
		};
		
		this._Pathfinder = new Pathfinder();
	}

	set_update_function = (func: Function) => {
 		this.update_game_state_for_ui = func;
	}
	
	advance_turn = () => {
		/*
			First, sort the creatures by speed.  We'll store a concept called "reserved tiles", where basically the faster creatures will "take" a given tile they're planning to move to, and therefore, that tile is blocked (even though pathfinding will ignore this).
	
			We'll then step backwards through the path for each subsequent creature in our speed-sorted list, and place it in the first "open spot" in its path, closest to its actual goal.
			
			The next step after this will be enabling a concept of moving a limited number of tiles rather than an unlimited number, per turn.  You'll still pathfind as though you had infinite moves, you'll just move a subset of them (and recalc every turn).
			
			
			There's a ton of stuff where this whole algorithm/approach will probably shit the bed, but since this whole game design is so experimental to begin with, we really cannot just follow a blueprint we know will work - we have to commit to something we can't trust will work out.  The biggest thing I envison is units lining up single file, and not correctly clustering around a goal, or moving around each other.
			
			We'll take this step by step.
		*/
		//creature.path_this_turn = this._Pathfinder.find_path_between_map_tiles( this._Tilemap_Manager, creature.tile_pos, new_pos, creature )
		
		const creature_movespeed = 5;
		const reserved_tiles : Array<PathNodeWithDirection> = [];

		//push a new turn onto the end of the turns array
		this.game_state.turn_list = _.concat(
			this.game_state.turn_list,
			[{
				/*
					This new turn is functionally identical to the last turn, except that we go through the creatures in it, and "resolve" their moves - we change their "real" position to what their planned position had been, and we "clear out" their plans (i.e. make them identical to where they currently are).
					
					When we have other verbs, we'd add them here.
				*/
				creature_list: _.map( this.get_current_turn_state().creature_list, (creature, idx) => {
					let new_position =
						_.find(
							_.reverse(creature.path_reachable_this_turn_with_directions),
// 							ƒ.dump(_.slice( creature.path_this_turn,
// 								0, //_.size(creature.path_this_turn) - creature.yield_moves_per_turn(),
// 								creature.yield_moves_per_turn()
// 							)),
							(path_element) => {
								return (_.find(reserved_tiles, path_element) === undefined); 
							}
						);
			
					console.error(`new pos ${new_position}`);
					if( new_position == undefined){ //if we didn't find *any* open slots, give up and remain at our current pos
						new_position = {
							position: creature.tile_pos,
							direction: creature.facing_direction,
						};
					} else {
						reserved_tiles.push(new_position);
					}
			
			
					return new Creature({
						tile_pos: new_position.position,
						direction: new_position.direction,
						planned_tile_pos: new_position.position,
						type_name: creature.type_name,
						unique_id: creature.unique_id,
					})
				})
			}]
		);	

		var date = new Date();
	
		this.animation_state = {
			is_animating_turn_end: true,
			time_turn_end_anim_started__in_ms: date.getTime()
		};
	
		this.game_state.current_turn += 1;
	}
	
	get_time_offset = () => {
		var date = new Date();

		return (date.getTime() - this.animation_state.time_turn_end_anim_started__in_ms);
	}
	
	get_total_anim_duration = ():number => {
		if( _.size(this.get_previous_turn_state().creature_list) > 0){
			return _.reduce(
				_.map(
					this.get_previous_turn_state().creature_list,
					(val) => ( val.calculate_total_anim_duration() )
				),
				(left, right) => ( ƒ.if( left > right, left, right) )
			)
		} else {
			return 0;
		}
	}
	
	get_flip_state_from_direction = ( direction: Direction ): boolean => (
		ƒ.if(	direction == Direction.north_west ||
				direction == Direction.west ||
				direction == Direction.south_west,
					true,
					false
		)
	)

	do_one_frame_of_rendering = () => {
		this.update_game_state_for_ui(this.game_state);
		
		
			if(this.animation_state.is_animating_turn_end){
	
				//console.log(this.get_time_offset());
				//console.log('pos:', val.yield_position_for_time_in_post_turn_animation( this._Tilemap_Manager, this.get_time_offset() ) );
				if(this.get_time_offset() > this.get_total_anim_duration() ){
					this.animation_state.is_animating_turn_end = false;
				} else {
					_.map( this.get_previous_turn_state().creature_list, (val,idx) => {
						const direction = val.yield_direction_for_time_in_post_turn_animation(this.get_time_offset());

						this._Asset_Manager.draw_image_for_asset_name({
							asset_name:					val.yield_walk_asset_for_direction( direction ), //i.e. 'peasant-se-walk',
							_BM:						this._Blit_Manager,
							pos:						val.yield_position_for_time_in_post_turn_animation( this._Tilemap_Manager, this.get_time_offset() ),
							zorder:						12,
							current_milliseconds:		this.get_time_offset(),
							opacity:					1.0,
							horizontally_flipped:		this.get_flip_state_from_direction(direction),
							vertically_flipped:			false,
						})
					})
				}

			} else {
				_.map( this.get_current_turn_state().creature_list, (val,idx) => {
					this._Asset_Manager.draw_image_for_asset_name({
						asset_name:					val.yield_stand_asset_for_direction(val.facing_direction),
						_BM:						this._Blit_Manager,
						pos:						this._Tilemap_Manager.convert_tile_coords_to_pixel_coords(val.tile_pos),
						zorder:						12,
						current_milliseconds:		0,
						opacity:					1.0,
						horizontally_flipped:		this.get_flip_state_from_direction(val.facing_direction),
						vertically_flipped:			false,
					})

					/*
						Draw the "ghost" image of the position the unit will be in at the end of their move.
					*/
					this._Asset_Manager.draw_image_for_asset_name({
						asset_name:					val.yield_stand_asset_for_direction(val.facing_direction),
						_BM:						this._Blit_Manager,
						pos:						this._Tilemap_Manager.convert_tile_coords_to_pixel_coords(val.planned_tile_pos),
						zorder:						12,
						current_milliseconds:		0,
						opacity:					0.5,
						horizontally_flipped:		this.get_flip_state_from_direction(val.facing_direction),
						vertically_flipped:			false,
					})			
			
			
					if(this.game_state.selected_object_index == idx){
						this._Asset_Manager.draw_image_for_asset_name ({
							asset_name:					'cursor_green',
							_BM:						this._Blit_Manager,
							pos:						this._Tilemap_Manager.convert_tile_coords_to_pixel_coords(val.tile_pos),
							zorder:						10,
							current_milliseconds:		0,
							opacity:					1.0,
							horizontally_flipped:		false,
							vertically_flipped:			false,
					})

						_.map(val.path_this_turn, (path_val, path_idx) => {
							let asset_name = ƒ.if( _.includes(val.path_reachable_this_turn, path_val),
								'cursor_green_small',
								'cursor_red_small'
							);
						
							this._Asset_Manager.draw_image_for_asset_name ({
								asset_name:					asset_name,
								_BM:						this._Blit_Manager,
								pos:						this._Tilemap_Manager.convert_tile_coords_to_pixel_coords(path_val),
								zorder:						9,
								current_milliseconds:		0,
								opacity:					1.0,
								horizontally_flipped:		false,
								vertically_flipped:			false,
							})
						})
					}
				})
			}
	}

	handle_click = (pos: Point2D) => {
// 		this.game_state.creature_list = [{
// 			tile_pos: this._Tilemap_Manager.convert_pixel_coords_to_tile_coords( pos )
// 		}]
		this.select_object_based_on_tile_click(pos);
	}

	get_selected_creature = ():Creature|undefined => {
		const idx = this.game_state.selected_object_index;
		
		
		const returnVal = ƒ.if(!_.isNil(idx),
			this.get_current_turn_state().creature_list[idx as number],
			undefined
		)
		
		return returnVal;
	}

	get_previous_turn_state = () => {
		const state = this.game_state.turn_list[ _.size(this.game_state.turn_list) -2 ];
	
		return state ? state : Individual_Game_Turn_State_Init;
	}
	
	get_current_turn_state = () => {
		const state = _.last(this.game_state.turn_list);
	
		return state ? state : Individual_Game_Turn_State_Init;
	}
	
	select_object_based_on_tile_click = (pos: Point2D) => {
		/*
			This handles two "modes" simultaneously.  If we click on an object, then we change the current selected object to be the one we clicked on (its position is occupied, and ostensibly can't be moved into - this might need to change with our game rules being what they are, but we'll cross that bridge later).  If we click on the ground, then we're intending to move the current object to that location.
		*/
		const new_pos = this._Tilemap_Manager.convert_pixel_coords_to_tile_coords( pos );
		
		const newly_selected_creature = _.findIndex( this.get_current_turn_state().creature_list, {
			tile_pos: new_pos
		} );
		
		if(newly_selected_creature === -1){
			//do move command
			if( this.game_state.selected_object_index != undefined ){
				const creature = this.get_current_turn_state().creature_list[ this.game_state.selected_object_index ];
				creature.planned_tile_pos = new_pos;
				
				creature.set_path(
					this._Pathfinder.find_path_between_map_tiles( this._Tilemap_Manager, creature.tile_pos, new_pos, creature ).successful_path,
					this._Tilemap_Manager
				);
			}
		} else if(newly_selected_creature === this.game_state.selected_object_index ) {
			this.game_state.selected_object_index = undefined;
		} else {
		
			this.game_state.selected_object_index = newly_selected_creature;
		}
	}
}

class Game_Turn_State {
	/* state of an individual turn */

}

interface Game_Status_Display_Props {
	_Game_Manager: Game_Manager,
	advance_turn: Function,
}


class Game_Status_Display extends React.Component <Game_Status_Display_Props, {game_state: Game_State}> {
	constructor( props: Game_Status_Display_Props ) {
		super( props );

		this.state = {
			game_state: _.cloneDeep(GameStateInit)
		};
	}


	update_game_state_for_ui = (game_state: Game_State) => {
		this.setState({game_state: _.cloneDeep(game_state)});
	}

	render = () => {
		const _GS = this.state.game_state;
	
		return (
			<div>
				<div>
					{`turn: ${_GS.current_turn}`}
				</div>
				<div>
					{/*`creatures: ${_.size(_GS.creature_list)}`*/}
				</div>
				<div>
					{ `${ƒ.if(_GS.selected_object_index !== undefined, _GS.selected_object_index)}` }
				</div>
				<button
					onClick={(evt)=>{this.props.advance_turn()}}
				>
					Next Turn
				</button>
			</div>
		)
	}
}



export class Game_View extends React.Component <Game_View_Props> {
	render_loop_interval: number|undefined;
	_Game_Manager: Game_Manager;
	awaiting_render: boolean;
	gsd!: Game_Status_Display;

	constructor( props: Game_View_Props ) {
		super( props );

		this._Game_Manager = new Game_Manager(this.props._Blit_Manager, this.props._Asset_Manager, this.props._Tilemap_Manager);
		this.awaiting_render = false;
	}


/*----------------------- core drawing routines -----------------------*/
	iterate_render_loop = () => {
		this.awaiting_render = true;
		this.render_loop_interval = window.setTimeout( this.render_canvas, 16.666 );
	}

	render_canvas = () => {
		if(this.awaiting_render){
			this.props._Tilemap_Manager.do_one_frame_of_rendering();
			this._Game_Manager.do_one_frame_of_rendering();
			this.awaiting_render = false;
			this.iterate_render_loop();
		} else {
			this.iterate_render_loop();
		}
	}

	componentDidMount() {
		this._Game_Manager.set_update_function( this.gsd.update_game_state_for_ui );
		if(this.props.assets_loaded){
			this.iterate_render_loop();
		}
	}

	componentDidUpdate() {
		if(this.props.assets_loaded){
			this.iterate_render_loop();
		}
	}
	
	componentWillUnmount(){
		window.clearInterval(this.render_loop_interval);
		this.render_loop_interval = undefined;
	}

	render() {
		return <div className="master_node">
			<Canvas_View
				{...this.props}
				dimensions={this.props.dimensions}
				handle_canvas_click={ this._Game_Manager.handle_click }
				handle_canvas_keydown={ ()=>{ /*console.log('game_keydown')*/} }
				handle_canvas_mouse_move={ ()=>{ /*console.log('game_mouse_move')*/} }
			/>
			<Game_Status_Display
				ref={(node) => {this.gsd = node!;}}
				_Game_Manager={this._Game_Manager}
				advance_turn={this._Game_Manager.advance_turn}
			/>
		</div>;
	}

}