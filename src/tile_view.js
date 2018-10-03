import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";

var PATH_PREFIX = "/dist/assets/"

class Tile_View {
/*----------------------- initialization and asset loading -----------------------*/
	constructor( ctx, _Asset_Manager ) {
		this.ctx = ctx;
		
		this.state = {
			tileStatus: [],
			initialized: false,
		};
		
		this._AM = _Asset_Manager;

	}

	initialize_tiles = () => {
		let { consts, dice, static_vals } = this._AM;

		this.state.tileStatus = _.range(consts.col_height).map( (row_value, row_index) => {
			return _.range(consts.row_length).map( (col_value, col_index) => {
				return 'tile' + (dice( _.size( static_vals.asset_list ) )).toString();
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
		let { consts } = this._AM;

		this.state.tileStatus.map( (row_value, row_index) => {
			row_value.map( (col_value, col_index) => {

				this.ctx.save();

					let tile_name = this.get_tile_name_for_tile_at_pos_with_data( {x: col_index, y: row_index}, col_value);
					let universal_hex_offset = col_index % 2 == 1 ? Math.floor(consts.tile_width / 2) : 0;

					this.ctx.translate	(
											(row_index + 0) * consts.tile_width + universal_hex_offset,
											(col_index + 0) * consts.tile_height
										);
										
					this.draw_image_for_tile_type( tile_name );

				this.ctx.restore();
			
			});
		});
	}
	
	draw_image_for_tile_type = (tile_name) => {
		let { static_vals: {assets, asset_list, assets_meta}, consts } = this._AM;
		/*
			This assumes the canvas is pre-translated so our draw position is at the final point, so we don't have to do any calculation for that, here.
			
			This is the place where we do all 'spritesheet' handling, and also where we do all animation handling.
		*/
	
		let dim = assets_meta[ tile_name ] ? assets_meta[ tile_name ].dim : { w: 20, h: 20 };  //safe-access
		
		
		if( !assets_meta[ tile_name ].bounds ){
			this.ctx.drawImage	(
									assets[ tile_name ],
									-(dim.w/2) + consts.tile_width/2,
									-(dim.h/2) + consts.tile_height/2,
								);
		} else {
			this.ctx.drawImage	(
				/* file */			assets[ tile_name ],

									
				/* src xy */		assets_meta[ tile_name ].bounds.x,
									assets_meta[ tile_name ].bounds.y,
				/* src wh */		assets_meta[ tile_name ].bounds.w,
									assets_meta[ tile_name ].bounds.h,

									
				/* dst xy */		-Math.floor(assets_meta[ tile_name ].bounds.w/2) + Math.floor(consts.tile_width/2),
									-Math.floor(assets_meta[ tile_name ].bounds.h/2) + Math.floor(consts.tile_height/2),
				/* dst wh */		assets_meta[ tile_name ].bounds.w,
									assets_meta[ tile_name ].bounds.h,
								);
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
		} else {
			this.initialize_tiles();
		}
	}
	
	handle_mouse_click = (x_pos, y_pos, selected_tile_type) => {
		let { consts } = this._AM;
	
		let click_coords = {
			y: Math.floor( x_pos / consts.tile_width ),
			x: Math.floor( y_pos / consts.tile_height ),
		};		
		
		this.modify_tile_status( click_coords, selected_tile_type );
	}
	
	annul_current_drag_operation = () => {
	
	}
	
	dice = (sides) => {
		return Math.floor( Math.random() * sides ) + 1;
	}
}

export default Tile_View;