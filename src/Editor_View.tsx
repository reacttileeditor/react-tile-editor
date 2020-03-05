import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";

import { Canvas_View } from "./Canvas_View";
import { Asset_Manager } from "./Asset_Manager";
import { Blit_Manager } from "./Blit_Manager";
import { Tile_Palette_Element } from "./Tile_Palette_Element";
import { Tilemap_Manager } from "./Tilemap_Manager";

import "./Primary_View.scss";
import { Point2D, Rectangle } from './interfaces';


interface Editor_View_Props {
	_Asset_Manager: Asset_Manager,
	_Blit_Manager: Blit_Manager,
	assets_loaded: boolean,
	initialize_tilemap_manager: Function,
	_Tilemap_Manager: Tilemap_Manager,
	dimensions: Point2D,
}

interface Editor_View_State {
	selected_tile_type: string,
}

export class Editor_View extends React.Component <Editor_View_Props, Editor_View_State> {
	render_loop_interval: number|undefined;
	state: {
		selected_tile_type: string,
		cursor_pos: Point2D,
	}

	constructor( props: Editor_View_Props ) {
		super( props );

		this.state = {
			selected_tile_type: '',
			cursor_pos: { x: 0, y: 0 },
		};
	}

/*----------------------- cursor stuff -----------------------*/
	set_cursor_pos = (coords: Point2D) => {
		this.state.cursor_pos = coords;
	}

	draw_cursor = () => {
		//const pos = this._Tilemap_Manager.convert_tile_coords_to_pixel_coords(0,4); 

		this.props._Asset_Manager.draw_image_for_asset_name({
			asset_name:					'cursor',
			_BM:						this.props._Blit_Manager,
			pos:						this.props._Tilemap_Manager.convert_tile_coords_to_pixel_coords( this.state.cursor_pos ),
			zorder:						12,
			should_use_tile_offset:		true,
			current_milliseconds:		0,
			opacity:					1.0,
		})
	}


/*----------------------- core drawing routines -----------------------*/
	start_render_loop = () => {
		if( !this.render_loop_interval ){
			this.render_loop_interval = window.setInterval( this.render_canvas, 16.666 );
		}
	}

	render_canvas = () => {
		this.props._Tilemap_Manager.do_one_frame_of_rendering();
		this.draw_cursor();
	}



	componentDidMount() {
		if(this.props.assets_loaded){
			this.start_render_loop();
		}
	}

	componentDidUpdate() {
		if(this.props.assets_loaded){
			this.start_render_loop();
		}
	}
	
	componentWillUnmount(){
		window.clearInterval(this.render_loop_interval);
		this.render_loop_interval = undefined;
	}

/*----------------------- I/O routines -----------------------*/
	handle_canvas_click = (pos: Point2D) => {
		this.props._Tilemap_Manager.modify_tile_status(
			this.props._Tilemap_Manager.convert_pixel_coords_to_tile_coords(pos),
			this.state.selected_tile_type
		);
	}

	handle_canvas_mouse_move = (mouse_pos: Point2D) => {
		this.set_cursor_pos(
			this.props._Tilemap_Manager.convert_pixel_coords_to_tile_coords(mouse_pos)
		);
		
	}

	handle_canvas_keydown = (event:  React.KeyboardEvent<HTMLCanvasElement>) => {
		switch (event.key) {
			case "Down": // IE/Edge specific value
			case "ArrowDown":
				this.props._Blit_Manager.adjust_viewport_pos(0,40);
				break;
			case "Up": // IE/Edge specific value
			case "ArrowUp":
				this.props._Blit_Manager.adjust_viewport_pos(0,-40);
				break;
			case "Left": // IE/Edge specific value
			case "ArrowLeft":
				this.props._Blit_Manager.adjust_viewport_pos(-40,0);
				break;
			case "Right": // IE/Edge specific value
			case "ArrowRight":
				this.props._Blit_Manager.adjust_viewport_pos(40,0);
				break;
		}
	}

	render() {
		return <div className="master_node">
			
			<Canvas_View
				{...this.props}
				dimensions={this.props.dimensions}
				handle_canvas_click={this.handle_canvas_click}
				handle_canvas_keydown={this.handle_canvas_keydown}
				handle_canvas_mouse_move={this.handle_canvas_mouse_move}
			/>
			<div className="tile_palette">
			{
				this.props.assets_loaded
				&&
				this.props._Asset_Manager.yield_tile_name_list().map( (value, index) => {
					return	<Tile_Palette_Element
								asset_manager={this.props._Asset_Manager}
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