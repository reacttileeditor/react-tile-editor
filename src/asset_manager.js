import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";

var PATH_PREFIX = "/dist/assets/"

class Asset_Manager {
/*----------------------- initialization and asset loading -----------------------*/
	constructor() {
		
		this.state = {
			tileStatus: null,
		};
		
		this.consts = {
			tile_width: 38, //38
			tile_height: 15, //21
			row_length: 8,
			col_height: 6,
		}

		this.static_vals = {
			asset_list: [{
				url: "map-cursor.png",
				name: "cursor",
				not_a_tile: true,
			},{
				url: "test2.png",
				name: "dirt1",
			},{
				url: "hex-tile-experiment-tiles.png",
				name: "menhir1",
				bounds: {
					x: 1,
					y: 1,
					w: 54,
					h: 58,
				},
			},{
				url: "hex-tile-experiment-tiles.png",
				name: "grass1",
				bounds: {
					x: 1,
					y: 61,
					w: 54,
					h: 34,
				},
			},{
				url: "hex-tile-experiment-tiles.png",
				name: "grass2",
				bounds: {
					x: 1,
					y: 97,
					w: 54,
					h: 34,
				},
			},{
				url: "hex-tile-experiment-tiles.png",
				name: "grass3",
				bounds: {
					x: 1,
					y: 133,
					w: 54,
					h: 34,
				},
			},{
				url: "hex-tile-experiment-tiles.png",
				name: "grass4",
				bounds: {
					x: 1,
					y: 169,
					w: 54,
					h: 34,
				},
			},{
				url: "hex-tile-experiment-tiles.png",
				name: "dirt2",
				bounds: {
					x: 1,
					y: 241,
					w: 54,
					h: 34,
				},
			}],
			assets: {},
			assets_meta: {},
			
			tile_types: [
				{
					name: "grass",
					variants: [{
							graphics: [{
								id: 'grass1',
								zorder: 0,
							}],
						},{
							graphics: [{
								id: 'grass2',
								zorder: 0,
							}],
						},{
							graphics: [{
								id: 'grass3',
								zorder: 0,
							}],
						},{
							graphics: [{
								id: 'grass4',
								zorder: 0,
							}],
						}
					],
				},{
					name: "dirt",
					variants: [{
						graphics: [{
							id: 'dirt1',
							zorder: 0,
						}],
					},{
						graphics: [{
							id: 'dirt2',
							zorder: 0,
						}],
					}],
				},{
					name: "menhir",
					variants: [{
						graphics: [{
							id: 'dirt1',
							zorder: 0,
						},{
							id: 'menhir1',
							zorder: 1,
						}],
					}],
				}
			]
		};
		
	}

	yield_tile_name_list = () => {
		return _.filter(
			this.static_vals.asset_list,
			(value, index) => {
				return value.not_a_tile !== true;
			}
		).map( (value,index) => {
			return value.name;
		})
	}

	yield_full_zorder_list = () => {
			/*
				Step through each of the levels of the tile_types list, and spit out just the zorder values.   This leaves us with a nested structure (the same as the original tile data object's structure), and what we really want to do is just boil it down to a straight list, and figure out which ones are unique. 
			*/
		return _.sortedUniq(
				_.flatten(
				_.flatten(
					_.map( this.static_vals.tile_types, (value,index)=>{
						return _.map( value.variants,  (value,index)=>{
							return _.map( value.graphics, (value,index)=>{
								return value.zorder;
							});
						}) 
					} )
			)));
	}


	launch_app = ( do_once_app_ready ) => {
		this.static_vals.asset_list.map( ( value, index ) => {

			var temp_image = new Image();
			var temp_url = PATH_PREFIX + value.url;
			
			temp_image.src = temp_url;

			temp_image.onload = () => {
				this.static_vals.assets[ value.name ] = temp_image;
				
				this.static_vals.assets_meta[ value.name ] = {
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

		if( _.size( this.static_vals.asset_list ) == _.size( this.static_vals.assets ) ) {
			console.log( this.yield_full_zorder_list() );

			do_once_app_ready();
		}
	}



/*----------------------- draw ops -----------------------*/
	
	
	draw_image_for_tile_type = (tile_name, ctx) => {
		let { assets, asset_list, assets_meta } = this.static_vals;
		/*
			This assumes the canvas is pre-translated so our draw position is at the final point, so we don't have to do any calculation for that, here.
			
			This is the place where we do all 'spritesheet' handling, and also where we do all animation handling.
		*/
	
		let dim = assets_meta[ tile_name ] ? assets_meta[ tile_name ].dim : { w: 20, h: 20 };  //safe-access
		
		
		if( !assets_meta[ tile_name ].bounds ){
			ctx.drawImage	(
									assets[ tile_name ],
									-(dim.w/2) + this.consts.tile_width/2,
									-(dim.h/2) + this.consts.tile_height/2,
								);
		} else {
			ctx.drawImage	(
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
	

	dice = (sides) => {
		return Math.floor( Math.random() * sides ) + 1;
	}
}

export default Asset_Manager;