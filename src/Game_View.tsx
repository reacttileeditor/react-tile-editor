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
	creature_list: Array<Creature>
	//turn_num
}

class Creature {
	tile_pos: Point2D
	//type
	//team
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
			creature_list: [{
				tile_pos: {x: 0, y: 6}
			}]
		};
	}

	
	do_one_frame_of_rendering = () => {
		//const pos = this._Tilemap_Manager.convert_tile_coords_to_pixel_coords(0,4); 

		_.map(this.game_state.creature_list, (val,idx) => {
			this._Asset_Manager.draw_image_for_asset_name (
				/* asset_name */				'hermit',
				/* _BM */						this._Blit_Manager,
				/* pos */						this._Tilemap_Manager.convert_tile_coords_to_pixel_coords(val.tile_pos),
				/* zorder */					12,
				/* should_use_tile_offset */	true,
				/* current_milliseconds */		0
			)
		})
	}


}

class Game_Turn_State {
	/* state of an individual turn */

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
				handle_canvas_click={  ()=>{ console.log('click')} }
				handle_canvas_keydown={ ()=>{ console.log('keydown')} }
			/>
		</div>;
	}

}