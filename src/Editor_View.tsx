import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";

import Canvas_View from "./canvas_view";
import Asset_Manager from "./asset_manager";
import Tile_Palette_Element from "./tile_palette_element";

import "./editor_view.scss";

interface Props {
}

interface State {
	assets_loaded: boolean,
	selected_tile_type: string,
}


class Editor_View extends React.Component <Props, State> {
/*----------------------- initialization and asset loading -----------------------*/
	_Asset_Manager: Asset_Manager;

	constructor( props ) {
		super( props );
		
		this.state = {
			assets_loaded: false,
			selected_tile_type: '',
		};
		
		this._Asset_Manager = new Asset_Manager();
	}


	componentDidMount() {
		this._Asset_Manager.launch_app( 
			() => { this.setState({assets_loaded: true}); }
		);
	}


	render() {
		return <div className="master_node">
			<Canvas_View
				assets_loaded={this.state.assets_loaded}
				asset_manager={this._Asset_Manager}
				selected_tile_type={this.state.selected_tile_type}
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

export default Editor_View;