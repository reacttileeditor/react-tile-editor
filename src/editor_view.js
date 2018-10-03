import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";

import Canvas_View from "./canvas_view.js";
import Asset_Manager from "./asset_manager.js";
import Tile_Palette_Element from "./tile_palette_element.js";

import "./editor_view.scss";

class Editor_View extends React.Component {
/*----------------------- initialization and asset loading -----------------------*/
	constructor( props ) {
		super( props );
		
		this.state = {
			assets_loaded: false,
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
				ref={(node) => {this.canvas_view = node;}}
				assets_loaded={this.state.assets_loaded}
				asset_manager={this._Asset_Manager}
			/>
			<div className="tile_palette">
			{
				this.state.assets_loaded
				&&
				this._Asset_Manager.static_vals.asset_list.map( (value, index) => {
					return	<Tile_Palette_Element
								asset_manager={this._Asset_Manager}
								tile_name={value.name}
							/>
				})
			}
			</div>
		</div>;
	}

}

export default Editor_View;