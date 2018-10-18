import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";

import Asset_Manager from "./asset_manager";


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
			this.draw_image_for_tile_type( this.props.tile_name );

		this.ctx.restore();
	}
	
	draw_image_for_tile_type = (tile_name) => {
		let { static_vals: {assets, asset_list, assets_meta}, consts, get_asset_name_for_tile_at_zorder } = this.props.asset_manager;


		/*
			This assumes the canvas is pre-translated so our draw position is at the final point, so we don't have to do any calculation for that, here.
			
			This is the place where we do all 'spritesheet' handling, and also where we do all animation handling.
		*/
		let asset_name = get_asset_name_for_tile_at_zorder(tile_name, 0);

		let asset = assets[ asset_name ]!;
		let metadata = assets_meta[ asset_name ]!;
	
		let dim = metadata ? metadata.dim : { w: 20, h: 20 };  //safe-access
		
		if( !this.props.asset_manager.isAssetSpritesheet(metadata) ){
			this.ctx.drawImage	(
									asset,
									-(dim.w/2),
									-(dim.h/2),
								);
		} else {
			this.ctx.drawImage	(
				/* file */			asset,

									
				/* src xy */		metadata.bounds.x,
									metadata.bounds.y,
				/* src wh */		metadata.bounds.w,
									metadata.bounds.h,

									
				/* dst xy */		-Math.floor(metadata.bounds.w/2),
									-Math.floor(metadata.bounds.h/2),
				/* dst wh */		metadata.bounds.w,
									metadata.bounds.h,
								);
		}	}
	
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