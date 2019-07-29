import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";

import { Asset_Manager } from "./Asset_Manager";
import { Blit_Manager } from "./Blit_Manager";
import * as Utils from "./Utils";

var PATH_PREFIX = "/dist/assets/"

import { TileComparatorSample } from "./Asset_Manager";
import { Point2D, Rectangle } from './interfaces';

interface tileViewState {
	tileStatus: [[string]],
	initialized: boolean,
	cursor_pos: Point2D,
}


export class Tilemap_Manager {
	state: tileViewState;
	_AM: Asset_Manager;
	_BM: Blit_Manager;

/*----------------------- initialization and asset loading -----------------------*/
	constructor(_Asset_Manager: Asset_Manager, _Blit_Manager : Blit_Manager ) {
		
		this.state = {
			tileStatus: [['']],
			initialized: false,
			cursor_pos: {x:0, y:0},
		};
		
		this._AM = _Asset_Manager;
		this._BM = _Blit_Manager;
	}


	initialize_tiles = () => {
		let { consts, yield_tile_name_list, static_vals } = this._AM;


		this.state.tileStatus = _.range(consts.col_height).map( (row_value, row_index) => {
			return _.range(consts.row_length).map( (col_value, col_index) => {
				return yield_tile_name_list()[
					Utils.dice( _.size( yield_tile_name_list() ) ) -1 
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
		}
	}

	set_cursor_pos = (coords) => {
		this.state.cursor_pos = coords;
	}



/*----------------------- draw ops -----------------------*/

	
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
				let pos = {x: col_index, y: row_index};
					
				this.draw_tile_at_coords(
											pos,
											tile_name,
											zorder
										);
			});
		});
	}

	
	draw_tile_at_coords = ( pos: Point2D, tile_name: string, zorder: number) => {
		let { consts } = this._AM;

			/*
				This is the special bit of logic which makes the different rows (since we're hex tiles) be offset from each other by "half" a tile.
			*/
			let universal_hex_offset = Utils.modulo(pos.y, 2) == 1 ? Math.floor(consts.tile_width / 2) : 0;

								
			this._AM.draw_image_for_tile_type_at_zorder_and_pos	(
															tile_name,
															this._BM,
															zorder,
						/* x */								(pos.x + 0) * consts.tile_width + universal_hex_offset,
						/* y */								(pos.y + 0) * consts.tile_height,
						/* should_use_tile_offset */		true,
						/* comparator */					this.get_tile_comparator_sample_for_pos(pos),
															this._BM.fps_tracker.current_millisecond
														);
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
												Utils.is_even( pos.y )
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
	
	
	do_one_frame_of_rendering = () => {
		if(this.state.initialized){
			this._BM.fill_canvas_with_solid_color();
			this.draw_tiles();
			this.draw_cursor();
			this._BM.draw_entire_frame();
			this._BM.draw_fps();
		} else {
			this.initialize_tiles();
		}
	}

	convert_pixel_coords_to_tile_coords = (x_pos, y_pos) => {
		let { consts } = this._AM;
		let position = this._BM.yield_world_coords_for_absolute_coords({x: x_pos, y: y_pos});

		let universal_hex_offset = Utils.modulo(y_pos, 2) == 1 ? Math.floor(consts.tile_width / 2) : 0;
	
		let tile_coords = {
			x: Math.floor( (position.x) / consts.tile_width ),
			y: Math.floor( (position.y) / consts.tile_height ),
		};
		
		//now we do the odd-row offset for the hex tiles
		let final_coords = {
			x: tile_coords.x + (( Utils.modulo(tile_coords.y, 2) == 1) && ( Utils.modulo(x_pos, consts.tile_width) < consts.tile_width / 2) ? -1 : 0),
			y: tile_coords.y
		};
		
		return final_coords;
	}
	
	convert_tile_coords_to_pixel_coords = (pos : Point2D) => ({
		x:	pos.x * this._AM.consts.tile_width +
			(( Utils.modulo(pos.y, 2) == 1) ? Math.floor(-this._AM.consts.tile_width / 2) : 0),
		y:	pos.y * this._AM.consts.tile_height
	})

}