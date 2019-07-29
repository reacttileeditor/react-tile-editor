import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";

import { Canvas_View } from "./Canvas_View";
import { Asset_Manager } from "./Asset_Manager";
import { Blit_Manager } from "./Blit_Manager";
import { Tile_Palette_Element } from "./Tile_Palette_Element";
import { Tilemap_Manager } from "./Tilemap_Manager";
import { Game_View } from "./Game_View";
import { Editor_View } from "./Editor_View";

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
	_Tilemap_Manager: Tilemap_Manager;

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
		if( !this._Tilemap_Manager ){
			this._Blit_Manager = new Blit_Manager(ctx);
			this._Tilemap_Manager = new Tilemap_Manager(this._Asset_Manager, this._Blit_Manager);
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
						_Asset_Manager={this._Asset_Manager}
						_Blit_Manager={this._Blit_Manager}
						_Tilemap_Manager={this._Tilemap_Manager}
						initialize_tilemap_manager={this.initialize_tilemap_manager}
					/>
					:
					<Game_View
						assets_loaded={this.state.assets_loaded}
						_Asset_Manager={this._Asset_Manager}
						_Blit_Manager={this._Blit_Manager}
						_Tilemap_Manager={this._Tilemap_Manager}
						initialize_tilemap_manager={this.initialize_tilemap_manager}
					/>
				}
			</div>
		</div>
		);
	}

}
