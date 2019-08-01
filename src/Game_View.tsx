import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";

import { Canvas_View } from "./Canvas_View";
import { Asset_Manager } from "./Asset_Manager";
import { Blit_Manager } from "./Blit_Manager";
import { Tile_Palette_Element } from "./Tile_Palette_Element";
import { Tilemap_Manager } from "./Tilemap_Manager";

import "./Primary_View.scss";
import { Point2D, Rectangle } from './interfaces';

interface Game_View_Props {
	_Asset_Manager: Asset_Manager,
	_Blit_Manager: Blit_Manager,
	assets_loaded: boolean,
	initialize_tilemap_manager: Function,
	_Tilemap_Manager: Tilemap_Manager,
}

interface Game_State {
	selected_object_index?: number,
	creature_list: Array<Creature>
	//turn_num
}

interface Creature {
	tile_pos: Point2D,
	creature_image: string
	//type
	//team
}


var ıf = function(test, true_case, false_case?){
	//because ternaries have awful legibility, but we need a "expression" rather than the "statement" provided by a builtin if() clause.  We need something terse that resolves to a value.
	if( test ){
		return true_case;
	} else {
		if( !_.isUndefined(false_case) ){
			return false_case;
		} else {
			return undefined;
		}
	}
}

class Game_Manager {
	_Blit_Manager: Blit_Manager;
	_Asset_Manager: Asset_Manager;
	_Tilemap_Manager: Tilemap_Manager;
	game_state: Game_State;
	
	/*
		We need to handle individual turns progressing, so we'll need something to track modality.  We'll need a set of flags indicating what our mode is - are we watching a turn be animated, are we watching the enemy do a move?  Are we watching the player do their move?
		
		We also need to track the progression of turns themselves - each turn will be represented by a Game_Turn_State that represents the complete status of the map.  From a UI perspective, we'll need to handle tracking each player's *intended* moves, since a core design point of this game is that "you plan moves and your plans are interrupted by conflicting/contending with enemy action" - these are going to differ from what actually ends up happening (whereas in many game designs there's a 1-to-1 correlation.  I'm not sure if we'll need to actually track these in the history, but we definitely need to track them for the current turn, before it gets resolved.
	
	
		Our immediate goals should be as follows:
			- wire in the conceptual display of units on the map.  These need to be interleaved with and rendered as part of the terrain, since they can be behind plants and such.
			- set up the canvas event handling to treat individual clicks as issuing a move command for a unit (in this current iteration, there will be no "planning", and no "commit to ending a turn" - you will have a single unit, it will immediately issue its move for the turn when you click, and complete the turn.   Those other concepts are a good "next step".
			- stack up this successive turn propagation in the history
	*/

	constructor( _Blit_Manager: Blit_Manager, _Asset_Manager: Asset_Manager, _Tilemap_Manager: Tilemap_Manager ) {
		this._Blit_Manager = _Blit_Manager;
		this._Asset_Manager = _Asset_Manager;
		this._Tilemap_Manager = _Tilemap_Manager;


		this.game_state = {
			selected_object_index: undefined,
			creature_list: [{
				tile_pos: {x: 0, y: 6},
				creature_image: 'hermit',
			},{
				tile_pos: {x: 2, y: 4},
				creature_image: 'peasant',
			}]
		};
	}

	
	do_one_frame_of_rendering = () => {
		//const pos = this._Tilemap_Manager.convert_tile_coords_to_pixel_coords(0,4); 

		_.map(this.game_state.creature_list, (val,idx) => {
			this._Asset_Manager.draw_image_for_asset_name (
				/* asset_name */				val.creature_image,
				/* _BM */						this._Blit_Manager,
				/* pos */						this._Tilemap_Manager.convert_tile_coords_to_pixel_coords(val.tile_pos),
				/* zorder */					12,
				/* should_use_tile_offset */	true,
				/* current_milliseconds */		0
			)
			
			if(this.game_state.selected_object_index == idx){
				this._Asset_Manager.draw_image_for_asset_name (
					/* asset_name */				'cursor',
					/* _BM */						this._Blit_Manager,
					/* pos */						this._Tilemap_Manager.convert_tile_coords_to_pixel_coords(val.tile_pos),
					/* zorder */					10,
					/* should_use_tile_offset */	true,
					/* current_milliseconds */		0
				)
				
			}
		})
	}

	handle_click = (pos) => {
// 		this.game_state.creature_list = [{
// 			tile_pos: this._Tilemap_Manager.convert_pixel_coords_to_tile_coords( pos )
// 		}]
		this.select_object_based_on_tile_click(pos);
	}

	get_selected_creature = ():Creature|undefined => {
		const idx = this.game_state.selected_object_index;
		
		
		const returnVal = ıf(!_.isNil(idx),
			this.game_state.creature_list[idx as number],
			undefined
		)
		
		debugger;
		return returnVal;
	}
	
	select_object_based_on_tile_click = (pos) => {
		/*
			This handles two "modes" simultaneously.  If we click on an object, then we change the current selected object to be the one we clicked on (its position is occupied, and ostensibly can't be moved into - this might need to change with our game rules being what they are, but we'll cross that bridge later).  If we click on the ground, then we're intending to move the current object to that location.
		*/
		const new_pos = this._Tilemap_Manager.convert_pixel_coords_to_tile_coords( pos );
		
		const newly_selected_creature = _.findIndex( this.game_state.creature_list, {
			tile_pos: new_pos
		} );
		
		if(newly_selected_creature === -1){
			//do move command
			if( this.game_state.selected_object_index != undefined ){
				this.game_state.creature_list[ this.game_state.selected_object_index ].tile_pos = new_pos;
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
}


class Game_Status_Display extends React.Component <Game_Status_Display_Props> {
	render = () => {
		const _GM = this.props._Game_Manager;
	
	
		return (
			<div>
				<div>
					{`creatures: ${_.size(_GM.game_state.creature_list)}`}
				</div>
				<div>
					{ ıf(_GM.get_selected_creature() !== undefined, _GM.get_selected_creature()) }
				</div>
			</div>
		)
	}
}


export class Game_View extends React.Component <Game_View_Props> {
	render_loop_interval: number|undefined;
	_Game_Manager: Game_Manager;
	awaiting_render: boolean;

	constructor( props ) {
		super( props );

		this._Game_Manager = new Game_Manager(this.props._Blit_Manager, this.props._Asset_Manager, this.props._Tilemap_Manager);

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
				handle_canvas_click={ this._Game_Manager.handle_click }
				handle_canvas_keydown={ ()=>{ console.log('game_keydown')} }
				handle_canvas_mouse_move={ ()=>{ console.log('game_mouse_move')} }
			/>
			<Game_Status_Display
				_Game_Manager={this._Game_Manager}
			/>
		</div>;
	}

}