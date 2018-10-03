import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";

import Canvas_View from "./canvas_view.js";

import "./editor_view.scss";

class Editor_View extends React.Component {
/*----------------------- initialization and asset loading -----------------------*/
	constructor( props ) {
		super( props );
		
		this.state = {
		};
		
		
	}

	render() {
		return <div className="master_node">
			<Canvas_View
				ref={(node) => {this.canvas_view = node;}}
			/>
			<div className="tile_palette">
			{
				_.range(7).map( (value, index) => {
					return	<div className="tile_cell" />
				})
			}
			</div>
		</div>;
	}

}

export default Editor_View;