import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";

import { Canvas_View } from "./Canvas_View";
import { Asset_Manager } from "./Asset_Manager";
import { Blit_Manager } from "./Blit_Manager";
import { Tile_Palette_Element } from "./Tile_Palette_Element";
import { Tilemap_Manager } from "./Tilemap_Manager";

import "./Primary_View.scss";

interface Editor_View_Props {
	asset_manager: Asset_Manager,
	blit_manager: Blit_Manager,
	assets_loaded: boolean,
	initialize_tilemap_manager: Function,
	Tilemap: Tilemap_Manager,
}

class Game_Manager {
	/*
		We need to handle individual turns progressing, so we'll need something to track modality.  We'll need a set of flags indicating what our mode is - are we watching a turn be animated, are we watching the enemy do a move?  Are we watching the player do their move?
		
		We also need to track the progression of turns themselves - each turn will be represented by a Game_Turn_State that represents the complete status of the map.  From a UI perspective, we'll need to handle tracking each player's *intended* moves, since a core design point of this game is that "you plan moves and your plans are interrupted by conflicting/contending with enemy action" - these are going to differ from what actually ends up happening (whereas in many game designs there's a 1-to-1 correlation.  I'm not sure if we'll need to actually track these in the history, but we definitely need to track them for the current turn, before it gets resolved.
	
	
		Our immediate goals should be as follows:
			- wire in the conceptual display of units on the map.  These need to be interleaved with and rendered as part of the terrain, since they can be behind plants and such.
			- set up the canvas event handling to treat individual clicks as issuing a move command for a unit (in this current iteration, there will be no "planning", and no "commit to ending a turn" - you will have a single unit, it will immediately issue its move for the turn when you click, and complete the turn.   Those other concepts are a good "next step".
			- stack up this successive turn propagation in the history
	*/
	
// 	draw_frame = () => {
// 		//const img = this.props.asset_manager.get_image_data_for_object('hermit');
// 		
// 		draw_image_for_asset_name = (
// 			/* asset_name */				'hermit',
// 			/* _BM */						this.props.blit_manager,
// 			/* pos */						{ x: 20, y: 20 },
// 			/* zorder */					12,
// 			/* should_use_tile_offset */	false,
// 			/* current_milliseconds */		0
// 		)
// 	}
}

class Game_Turn_State {
	/* state of an individual turn */

}


export class Game_View extends React.Component <Editor_View_Props> {
	constructor( props ) {
		super( props );

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