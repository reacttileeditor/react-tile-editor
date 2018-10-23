import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";

import Asset_Manager from "./asset_manager";

var PATH_PREFIX = "/dist/assets/"

import { TileComparatorSample, Point2D } from "./asset_manager";

interface tileViewState {
	tileStatus: [[string]],
	initialized: boolean,
	cursor_pos: Point2D,
}

class Tile_View {
	ctx: CanvasRenderingContext2D;
	state: tileViewState;
	_AM: Asset_Manager;

/*----------------------- initialization and asset loading -----------------------*/
	constructor( ctx: CanvasRenderingContext2D, _Asset_Manager: Asset_Manager ) {
		this.ctx = ctx;
		
		this.state = {
			tileStatus: [['']],
			initialized: false,
			cursor_pos: {x:0, y:0},
		};
		
		this._AM = _Asset_Manager;

	}

	initialize_tiles = () => {
		let { consts, dice, yield_tile_name_list, static_vals } = this._AM;


		this.state.tileStatus = _.range(consts.col_height).map( (row_value, row_index) => {
			return _.range(consts.row_length).map( (col_value, col_index) => {
				return yield_tile_name_list()[
					dice( _.size( yield_tile_name_list() ) ) -1 
				];
			});
		});
	
		this.state.initialized = true;
	}


/*----------------------- state mutation -----------------------*/
	modify_tile_status = ( pos, selected_tile_type ) => {
		let { consts, static_vals } = this._AM;
		
		if(
			pos.x >= 0 &&
			pos.y >= 0 && 
			pos.x < consts.row_length &&
			pos.y < consts.col_height 
		){
			if(selected_tile_type && selected_tile_type != ''){
				this.state.tileStatus[pos.y][pos.x] = selected_tile_type;
			}
			/*this.state.tileStatus[pos.y][pos.x] =
				'tile' + (
					(( ( this.state.tileStatus[pos.y][pos.x] ).match(/\d+/g).map(Number)[0] )  //really javascript?
					%
					_.size( static_vals.asset_list )) + 1
				).toString();*/
		}
	}

	set_cursor_pos = (coords) => {
		this.state.cursor_pos = coords;
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
	
	draw_tiles = () => {
		let zorder_list = this._AM.yield_full_zorder_list();

		zorder_list.map( (value,index) => {
			this.draw_tiles_for_zorder(value);
		})
		
		this._AM.TileRNG.reset();
	}

	draw_tiles_for_zorder = (zorder) => {

		this.state.tileStatus.map( (row_value, row_index) => {
			row_value.map( (col_value, col_index) => {

				let tile_name = this.get_tile_name_for_tile_at_pos_with_data( {x: row_index, y: col_index}, col_value);
					
				this.draw_tile_at_coords(
											{x: col_index, y: row_index},
											tile_name,
											zorder
										);
			});
		});
	}

	
	draw_tile_at_coords = ( pos: Point2D, tile_name, zorder) => {
		let { consts } = this._AM;
		this.ctx.save();

			let universal_hex_offset = pos.y % 2 == 1 ? Math.floor(consts.tile_width / 2) : 0;

			this.ctx.translate	(
									(pos.x + 0) * consts.tile_width + universal_hex_offset,
									(pos.y + 0) * consts.tile_height
								);
								
			this._AM.draw_image_for_tile_type_at_zorder( tile_name, this.ctx, zorder, true );

		this.ctx.restore();	
	}
	
	draw_cursor = () => {
		this.draw_tile_at_coords( this.state.cursor_pos, 'cursor', 0);
	}
	

	get_tile_comparator_sample_for_pos = ( pos: Point2D ): TileComparatorSample => {
		/*
			This would simply grab all 8 adjacent tiles (and ourselves, for a total of 9 tiles) as a square sample.  The problem here is that, although our tiles are in fact stored as "square" data in an array, we're actually a hex grid.  Because we're a hex grid, we're actually just looking for 7 tiles, so we'll need to adjust the result.  Depending on whether we're on an even or odd row, we need to lop off the first (or last) member of the first and last rows. 	
		*/
	
		return _.range(pos.y - 1, pos.y + 2).map( (row_value, row_index) => {
			let horizontal_tile_indices =	row_index == 1
											?
											_.range(pos.x - 1, pos.x + 2)
											:
											(	
												this._AM.is_even( pos.y )
												?
												_.range(pos.x - 1, pos.x + 1)
												:
												_.range(pos.x - 0, pos.x + 2)
											);
			
			return horizontal_tile_indices.map( (col_value, col_index) => {
				return this.get_tile_name_for_pos({x: col_value, y: row_value});
			});
		});
	}
	
	get_tile_name_for_pos = ( pos: Point2D ) => {
		/*
			This enforces "safe access", and will always return a string.  If it's outside the bounds of the tile map, we return an empty string.
		*/
		if(
			pos.y > (_.size(this.state.tileStatus) - 1) ||
			pos.y < 0 ||
			pos.x > (_.size(this.state.tileStatus[pos.y]) - 1) ||
			pos.x < 0
		){
			return '';
		} else {
			return this.state.tileStatus[pos.y][pos.x];
		}
	}
	
	
	
	get_tile_name_for_tile_at_pos_with_data = ( pos, tile_entry ) => {
		/*
			Tile_entry is whatever mnemonic or other indicator is stored at that position in the array. 
			Currently we're just doing 1 0 values because we're in the midst of hacking, but we'll decide on a more 'real' markup later.
			
			We may have to transition away from having this passed in, since auto-tiling (if/when it comes) may require us to query adjacent tiles.
		*/
		return tile_entry;
	}
	
	
	do_core_render_loop = () => {
		if(this.state.initialized){
			this.fill_canvas_with_solid_color();
			this.draw_headline_text();
			this.draw_tiles();
			this.draw_cursor();
		} else {
			this.initialize_tiles();
		}
	}

	convert_pixel_coords_to_tile_coords = (x_pos, y_pos) => {
		let { consts } = this._AM;

		let universal_hex_offset = y_pos % 2 == 1 ? Math.floor(consts.tile_width / 2) : 0;
	
		let tile_coords = {
			x: Math.floor( x_pos / consts.tile_width ),
			y: Math.floor( y_pos / consts.tile_height ),
		};
		
		//now we do the odd-row offset for the hex tiles
		let final_coords = {
			x: tile_coords.x + ((tile_coords.y % 2 == 1) && (x_pos % consts.tile_width < consts.tile_width / 2) ? -1 : 0),
			y: tile_coords.y
		};
		
		return final_coords;
	}
	
	handle_mouse_click = (x_pos, y_pos, selected_tile_type) => {
		this.modify_tile_status( this.convert_pixel_coords_to_tile_coords(x_pos, y_pos), selected_tile_type );
	}

	handle_mouse_move = (x_pos, y_pos) => {
		this.set_cursor_pos( this.convert_pixel_coords_to_tile_coords(x_pos, y_pos) );
	}

	
	annul_current_drag_operation = () => {
	
	}
	
	dice = (sides) => {
		return Math.floor( Math.random() * sides ) + 1;
	}
}

export default Tile_View;