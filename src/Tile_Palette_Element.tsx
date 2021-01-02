import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";

import { Asset_Manager } from "./Asset_Manager";
import { Blit_Manager } from "./Blit_Manager";
import { Tilemap_Manager } from "./Tilemap_Manager";
import { Point2D, Rectangle } from './interfaces';


interface Props {
	asset_manager: Asset_Manager,
	selected_tile_type: string,
	tile_name: string,
	handle_click(): void, 
}


export class Tile_Palette_Element extends React.Component <Props> {
	ctx!: CanvasRenderingContext2D;
	canvas!: HTMLCanvasElement;
	_Blit_Manager!: Blit_Manager;
	_Tilemap_Manager!: Tilemap_Manager;
	default_canvas_size: Point2D;

/*----------------------- initialization and asset loading -----------------------*/
	constructor( props: Props ) {
		super( props );
		
		this.state = {
		};
		
		this.default_canvas_size = {x: 50, y: 50};
	}

	componentDidMount() {
		this.ctx = this.canvas!.getContext("2d")!;
		this.initialize_tilemap_manager(this.ctx);
		
		this.draw_canvas();
	}

	componentDidUpdate() {
		this.ctx = this.canvas!.getContext("2d")!;
		this.initialize_tilemap_manager(this.ctx);
		this.draw_canvas();
	}

	initialize_tilemap_manager = (ctx: CanvasRenderingContext2D) => {
		if( !this._Tilemap_Manager ){
			this._Blit_Manager = new Blit_Manager(ctx, this.default_canvas_size, false);
			this._Tilemap_Manager = new Tilemap_Manager(this.props.asset_manager, this._Blit_Manager);
		} else {
			this._Blit_Manager.reset_context(ctx);
		}
	}


/*----------------------- draw ops -----------------------*/

	
	draw_canvas = () => {
		let { consts } = this.props.asset_manager;

		this._Blit_Manager.fill_canvas_with_solid_color();
		this.props.asset_manager.draw_all_assets_for_tile_type(
			this.props.tile_name,
			this._Blit_Manager,
			{
				x: Math.floor(this.default_canvas_size.x/2),
				y: Math.floor(this.default_canvas_size.y/2)
			},
		);
		this._Blit_Manager.draw_entire_frame();
	}
	
	handle_mouse_click = (e: React.MouseEvent<HTMLCanvasElement>) => {
		this.props.handle_click();
	}
	

	render() {
		return <div className={`tile_cell${ this.props.selected_tile_type == this.props.tile_name ? ' active' : ''}`}>
			<canvas
				ref={(node) => {this.canvas = node!;}}
				width={this.default_canvas_size.x}
				height={this.default_canvas_size.y}
				style={ {
					width: this.default_canvas_size.x * 2,
					height: this.default_canvas_size.y * 2
				} }
			
				onClick={ this.handle_mouse_click }
			/>
		</div>;
	}
}