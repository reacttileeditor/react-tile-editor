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
	is_edit_mode: boolean,
}


export class Primary_View extends React.Component <Props, State> {
/*----------------------- initialization and asset loading -----------------------*/
	_Asset_Manager: Asset_Manager;
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
		this._Tilemap = new Tilemap_Manager(ctx, this._Asset_Manager);
	}

	render() {
		return <div className="master_node">
			
			<Editor_View
				assets_loaded={this.state.assets_loaded}
				asset_manager={this._Asset_Manager}
				initialize_tilemap_manager={this.initialize_tilemap_manager}
				Tilemap={this._Tilemap}
			/>
		</div>;
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

	render() {
		return <div className="master_node">
			
			<Canvas_View
				{...this.props}
				selected_tile_type={this.state.selected_tile_type}
			/>
			<div className="tile_palette">
			{
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