import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";

import Asset_Manager from "./Asset_Manager";


interface Props {
	asset_manager: Asset_Manager,
	selected_tile_type: string,
	tile_name: string,
	handle_click(): void, 
}


class Tile_Palette_Element extends React.Component <Props> {
	ctx: CanvasRenderingContext2D;
	canvas: HTMLCanvasElement;

/*----------------------- initialization and asset loading -----------------------*/
	constructor( props ) {
		super( props );
		
		this.state = {
		};
		
	}

	componentDidMount() {
		this.ctx = this.canvas!.getContext("2d")!;
		this.draw_canvas();
	}

	componentDidUpdate() {
		this.draw_canvas();
	}

/*----------------------- draw ops -----------------------*/
	fill_canvas_with_solid_color = () => {
		this.ctx.save();
	    this.ctx.fillStyle = "#000000";
		this.ctx.fillRect(0,0, this.ctx.canvas.width, this.ctx.canvas.height);
		this.ctx.restore();
	}

	draw_headline_text = () => {
		this.ctx.save();
		this.ctx.font = '32px Helvetica, sans-serif';
		this.ctx.textAlign = 'center';
		this.ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
	    this.ctx.shadowOffsetY = 2;
	    this.ctx.shadowBlur = 3;
	    this.ctx.fillStyle = "#ffffff";
		this.ctx.textBaseline = 'middle';
		this.ctx.fillText("test", this.ctx.canvas.width / 2.0, this.ctx.canvas.height /2.0);
		this.ctx.restore();
	}
	
	draw_canvas = () => {
		let { consts } = this.props.asset_manager;

		this.fill_canvas_with_solid_color();					

		this.ctx.save();

			this.ctx.translate	(
									50,
									50
								);
			this.props.asset_manager.draw_all_assets_for_tile_type( this.props.tile_name, this.ctx, false );

		this.ctx.restore();
	}
	
	handle_mouse_click = (e) => {
		this.props.handle_click();
	}
	

	render() {
		return <div className={`tile_cell${ this.props.selected_tile_type == this.props.tile_name ? ' active' : ''}`}>
			<canvas
				ref={(node) => {this.canvas = node!;}}
				width="100"
				height="100"
			
				onClick={ this.handle_mouse_click }
			/>
		</div>;
	}
}

export default Tile_Palette_Element;