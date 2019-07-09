import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";

import { Canvas_View } from "./Canvas_View";
import { Asset_Manager } from "./Asset_Manager";
import { Blit_Manager } from "./Blit_Manager";
import { Tile_Palette_Element } from "./Tile_Palette_Element";
import { Tilemap_Manager } from "./Tilemap_Manager";
import { Game_View } from "./Game_View";

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

interface Editor_View_Props {
	_Asset_Manager: Asset_Manager,
	_Blit_Manager: Blit_Manager,
	assets_loaded: boolean,
	initialize_tilemap_manager: Function,
	_Tilemap_Manager: Tilemap_Manager,
}

interface Editor_View_State {
	selected_tile_type: string,
}

class Editor_View extends React.Component <Editor_View_Props, Editor_View_State> {
	render_loop_interval: number|undefined;

	constructor( props ) {
		super( props );

		this.state = {
			selected_tile_type: '',
		};
	}

/*----------------------- core drawing routines -----------------------*/
	start_render_loop = () => {
		if( !this.render_loop_interval ){
			this.render_loop_interval = window.setInterval( this.render_canvas, 16.666 );
		}
	}

	render_canvas = () => {
		this.props._Tilemap_Manager.do_one_frame_of_rendering();
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
	handle_canvas_click = (x: number, y: number) => {
		this.props._Tilemap_Manager.handle_mouse_click( x, y, this.state.selected_tile_type );
	
	}

	handle_canvas_keydown = (event) => {
		switch (event.key) {
			case "Down": // IE/Edge specific value
			case "ArrowDown":
				this.props._Tilemap_Manager.adjust_viewport_pos(0,40);
				break;
			case "Up": // IE/Edge specific value
			case "ArrowUp":
				this.props._Tilemap_Manager.adjust_viewport_pos(0,-40);
				break;
			case "Left": // IE/Edge specific value
			case "ArrowLeft":
				this.props._Tilemap_Manager.adjust_viewport_pos(-40,0);
				break;
			case "Right": // IE/Edge specific value
			case "ArrowRight":
				this.props._Tilemap_Manager.adjust_viewport_pos(40,0);
				break;
		}
	}

	render() {
		return <div className="master_node">
			
			<Canvas_View
				{...this.props}
				handle_canvas_click={this.handle_canvas_click}
				handle_canvas_keydown={this.handle_canvas_keydown}
			/>
			<div className="tile_palette">
			{
				false
				&&
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