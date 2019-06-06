import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";

import { Canvas_View } from "./Canvas_View";
import { Asset_Manager } from "./Asset_Manager";
import { Tile_Palette_Element } from "./Tile_Palette_Element";
import { Tilemap_Manager } from "./Tilemap_Manager";

import "./Primary_View.scss";

interface Props {
}

interface State {
	assets_loaded: boolean,
	selected_tile_type: string,
}


export class Primary_View extends React.Component <Props, State> {
/*----------------------- initialization and asset loading -----------------------*/
	_Asset_Manager: Asset_Manager;
	_Tilemap: Tilemap_Manager;

	constructor( props ) {
		super( props );
		
		this.state = {
			assets_loaded: false,
			selected_tile_type: '',
		};
		
		this._Asset_Manager = new Asset_Manager();
		this._Asset_Manager.launch_app( 
			() => { this.setState({assets_loaded: true}); }
		);
	}

	initialize_tilemap_manager = (ctx) => {
		console.warn('initialize_tilemap_manager')
		this._Tilemap = new Tilemap_Manager(ctx, this._Asset_Manager);
	}

	render() {
		return <div className="master_node">
			<Canvas_View
				assets_loaded={this.state.assets_loaded}
				asset_manager={this._Asset_Manager}
				selected_tile_type={this.state.selected_tile_type}
				initialize_tilemap_manager={this.initialize_tilemap_manager}
				Tilemap={this._Tilemap}
			/>
			<div className="tile_palette">
			{
				this.state.assets_loaded
				&&
				this._Asset_Manager.yield_tile_name_list().map( (value, index) => {
					return	<Tile_Palette_Element
								asset_manager={this._Asset_Manager}
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
