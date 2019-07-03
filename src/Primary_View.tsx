import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";

import { Canvas_View } from "./Canvas_View";
import { Asset_Manager } from "./Asset_Manager";
import { Blit_Manager } from "./Blit_Manager";
import { Tile_Palette_Element } from "./Tile_Palette_Element";
import { Tilemap_Manager } from "./Tilemap_Manager";
import { Game_View } from "./Game_View";

import "./Primary_View.scss";

interface Props {
}

interface State {
	assets_loaded: boolean,
	is_edit_mode: boolean,
}


export class Primary_View extends React.Component <Props, State> {
/*----------------------- initialization and asset loading -----------------------*/
	_Asset_Manager: Asset_Manager;
	_Blit_Manager: Blit_Manager;
	_Tilemap: Tilemap_Manager;

	constructor( props ) {
		super( props );
		
		this.state = {
			assets_loaded: false,
			is_edit_mode: true,
		};
		
		this._Asset_Manager = new Asset_Manager();
		this._Asset_Manager.launch_app( 
			() => { this.setState({assets_loaded: true}); }
		);
	}

	initialize_tilemap_manager = (ctx) => {
		console.warn('initialize_tilemap_manager')
		if( !this._Tilemap ){
			this._Blit_Manager = new Blit_Manager(ctx);
			this._Tilemap = new Tilemap_Manager(this._Asset_Manager, this._Blit_Manager);
		} else {
			this._Blit_Manager.reset_context(ctx);
		}
	}

	render() {
		return (
		<div>
			<button onClick={ () => { this.setState({is_edit_mode: !this.state.is_edit_mode}); } }>Toggle</button>
			<div className="master_node">
				{
					this.state.is_edit_mode
					?
					<Editor_View
						assets_loaded={this.state.assets_loaded}
						asset_manager={this._Asset_Manager}
						blit_manager={this._Blit_Manager}
						initialize_tilemap_manager={this.initialize_tilemap_manager}
						Tilemap={this._Tilemap}
					/>
					:
					<Game_View
						assets_loaded={this.state.assets_loaded}
						asset_manager={this._Asset_Manager}
						blit_manager={this._Blit_Manager}
						initialize_tilemap_manager={this.initialize_tilemap_manager}
						Tilemap={this._Tilemap}
					/>
				}
			</div>
		</div>
		);
	}

}

interface Editor_View_Props {
	asset_manager: Asset_Manager,
	assets_loaded: boolean,
	initialize_tilemap_manager: Function,
	Tilemap: Tilemap_Manager,
}

interface Editor_View_State {
	selected_tile_type: string,
}

class Editor_View extends React.Component <Editor_View_Props, Editor_View_State> {
	constructor( props ) {
		super( props );

		this.state = {
			selected_tile_type: '',
		};
	}

	handle_canvas_click = (x: number, y: number) => {
		this.props.Tilemap.handle_mouse_click( x, y, this.state.selected_tile_type );
	
	}

	handle_canvas_keydown = (event) => {
		switch (event.key) {
			case "Down": // IE/Edge specific value
			case "ArrowDown":
				this.props.Tilemap.adjust_viewport_pos(0,40);
				break;
			case "Up": // IE/Edge specific value
			case "ArrowUp":
				this.props.Tilemap.adjust_viewport_pos(0,-40);
				break;
			case "Left": // IE/Edge specific value
			case "ArrowLeft":
				this.props.Tilemap.adjust_viewport_pos(-40,0);
				break;
			case "Right": // IE/Edge specific value
			case "ArrowRight":
				this.props.Tilemap.adjust_viewport_pos(40,0);
				break;
		}
	}

	render() {
		return <div className="master_node">
			
			<Canvas_View
				{...this.props}
				handle_canvas_click={this.handle_canvas_click}
				handle_canvas_keydown={this.handle_canvas_keydown}
			/>
			<div className="tile_palette">
			{
				false
				&&
				this.props.assets_loaded
				&&
				this.props.asset_manager.yield_tile_name_list().map( (value, index) => {
					return	<Tile_Palette_Element
								asset_manager={this.props.asset_manager}
								tile_name={value}
								key={value}
								selected_tile_type={this.state.selected_tile_type}
								handle_click={ () => this.setState({selected_tile_type: value}) }
							/>
				})
			}
			</div>
		</div>;
	}

}