import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";

var PATH_PREFIX = "/dist/assets/"

class Tile_View {
/*----------------------- initialization and asset loading -----------------------*/
	constructor( ctx ) {
		this.ctx = ctx;
		
		this.state = {
			tileStatus: null,
		};
		
		this.consts = {
			tile_width: 38, //38
			tile_height: 15, //21
			row_length: 8,
			col_height: 6,
		}

		this.static = {
			asset_list: [{
				url: "test2.png",
				name: "tile1",
			},{
				url: "hex-tile-experiment-tiles.png",
				name: "tile2",
				bounds: {
					x: 1,
					y: 61,
					w: 54,
					h: 34,
				},
			},{
				url: "hex-tile-experiment-tiles.png",
				name: "tile3",
				bounds: {
					x: 1,
					y: 97,
					w: 54,
					h: 34,
				},
			},{
				url: "hex-tile-experiment-tiles.png",
				name: "tile4",
				bounds: {
					x: 1,
					y: 133,
					w: 54,
					h: 34,
				},
			},{
				url: "hex-tile-experiment-tiles.png",
				name: "tile5",
				bounds: {
					x: 1,
					y: 169,
					w: 54,
					h: 34,
				},
			},{
				url: "hex-tile-experiment-tiles.png",
				name: "tile6",
				bounds: {
					x: 1,
					y: 241,
					w: 54,
					h: 34,
				},
			}],
			assets: {},
			assets_meta: {},
		};
		
	}

	initialize_tiles = () => {
		this.state.tileStatus = _.range(this.consts.col_height).map( (row_value, row_index) => {
			return _.range(this.consts.row_length).map( (col_value, col_index) => {
				return 'tile' + (this.dice( _.size( this.static.asset_list ) )).toString();
			});
		});
	}

	launch_app = ( do_once_app_ready ) => {
		this.static.asset_list.map( ( value, index ) => {

			var temp_image = new Image();
			var temp_url = PATH_PREFIX + value.url;
			
			temp_image.src = temp_url;

			temp_image.onload = () => {
				this.static.assets[ value.name ] = temp_image;
				
				this.static.assets_meta[ value.name ] = {
					dim: {
						w: temp_image.naturalWidth,
						h: temp_image.naturalHeight
					},
					bounds: value.bounds,
				};
				this.launch_if_all_assets_are_loaded(do_once_app_ready);
			};
		});
	}

	launch_if_all_assets_are_loaded = ( do_once_app_ready ) => {
		/*
			There's a big problem most canvas apps have, which is that the canvas will start doing its thing right away and start trying to render, even if you haven't loaded any of the images yet.  What we want to do is have it wait until all the images are done loading, so we're rolling a minimalist "asset manager" here.  The only way (I'm aware of) to tell if an image has loaded is the onload callback.  Thus, we register one of these on each and every image, before attempting to load it.

			Because we carefully wait to populate the values of `loadedAssets` until we're actually **in** the callback, we can just do a size comparison to determine if all of the loaded images are there.
		*/

		if( _.size( this.static.asset_list ) == _.size( this.static.assets ) ) {
			this.initialize_tiles();


			do_once_app_ready();
		}
	}


/*----------------------- state mutation -----------------------*/
	modify_tile_status = ( pos ) => {
		if(
			pos.x >= 0 &&
			pos.y >= 0 && 
			pos.x < this.consts.row_length &&
			pos.y < this.consts.col_height 
		){
			this.state.tileStatus[pos.y][pos.x] =
				'tile' + (
					(( ( this.state.tileStatus[pos.y][pos.x] ).match(/\d+/g).map(Number)[0] )  //really javascript?
					%
					_.size( this.static.asset_list )) + 1
				).toString();
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
		let { assets, asset_list, assets_meta } = this.static;

		this.state.tileStatus.map( (row_value, row_index) => {
			row_value.map( (col_value, col_index) => {

				this.ctx.save();

					let tile_name = this.get_tile_name_for_tile_at_pos_with_data( {x: col_index, y: row_index}, col_value);
					let universal_hex_offset = col_index % 2 == 1 ? Math.floor(this.consts.tile_width / 2) : 0;

					this.ctx.translate	(
											(row_index + 0) * this.consts.tile_width + universal_hex_offset,
											(col_index + 0) * this.consts.tile_height
										);
										
					this.draw_image_for_tile_type( tile_name );

				this.ctx.restore();
			
			});
		});
	}
	
	draw_image_for_tile_type = (tile_name) => {
		let { assets, asset_list, assets_meta } = this.static;
		/*
			This assumes the canvas is pre-translated so our draw position is at the final point, so we don't have to do any calculation for that, here.
			
			This is the place where we do all 'spritesheet' handling, and also where we do all animation handling.
		*/
	
		let dim = assets_meta[ tile_name ] ? assets_meta[ tile_name ].dim : { w: 20, h: 20 };  //safe-access
		
		
		if( !assets_meta[ tile_name ].bounds ){
			this.ctx.drawImage	(
									assets[ tile_name ],
									-(dim.w/2) + this.consts.tile_width/2,
									-(dim.h/2) + this.consts.tile_height/2,
								);
		} else {
			this.ctx.drawImage	(
				/* file */			assets[ tile_name ],

									
				/* src xy */		assets_meta[ tile_name ].bounds.x,
									assets_meta[ tile_name ].bounds.y,
				/* src wh */		assets_meta[ tile_name ].bounds.w,
									assets_meta[ tile_name ].bounds.h,

									
				/* dst xy */		-Math.floor(assets_meta[ tile_name ].bounds.w/2) + Math.floor(this.consts.tile_width/2),
									-Math.floor(assets_meta[ tile_name ].bounds.h/2) + Math.floor(this.consts.tile_height/2),
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
		this.fill_canvas_with_solid_color();
		this.draw_headline_text();
		this.draw_tiles();
	}
	
	handle_mouse_click = (x_pos, y_pos) => {
	
		let click_coords = {
			y: Math.floor( x_pos / this.consts.tile_width ),
			x: Math.floor( y_pos / this.consts.tile_height ),
		};		
		
		this.modify_tile_status( click_coords );
	}
	
	annul_current_drag_operation = () => {
	
	}
	
	dice = (sides) => {
		return Math.floor( Math.random() * sides ) + 1;
	}
}

export default Tile_View;