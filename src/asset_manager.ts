import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";

var PATH_PREFIX = "/dist/assets/"

interface Rectangle {
	x: number,
	y: number,
	w: number,
	h: number,
};


interface AssetItem {
	url: string,
	not_a_tile?: boolean, 
	name: string,
	bounds?: Rectangle,
};

interface StaticValues {
	asset_list: Array<AssetItem>,
	assets: AssetsDict,
	assets_meta: AssetsMetaDict,
	tile_types: Array<TileItem>,
};

interface AssetsDict {
	[index: string]: HTMLImageElement
}

interface AssetsMetaDict {
	[index: string]: AssetsMetaSpritesheetItem|AssetsMetaSingleImageItem,
}

interface AssetsMetaSpritesheetItem {
	dim: {
		w: number,
		h: number,
	},
	bounds: Rectangle,
}

interface AssetsMetaSingleImageItem {
	dim: {
		w: number,
		h: number,
	},
}




interface TileItem {
	name: string,
	variants: Array<VariantItem>,
};

interface VariantItem {
	graphics: Array<GraphicItem>,
};

interface GraphicItem {
	id: string,
	zorder: number,
};

class Asset_Manager {
	consts: {
		tile_width: number,
		tile_height: number,
		row_length: number,
		col_height: number,
	};
	state: {
	
	};
	static_vals: StaticValues;

/*----------------------- initialization and asset loading -----------------------*/
	constructor() {
		
//		this.state = {
//			tileStatus: null,
//		};
		
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

	//https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards
	isAssetSpritesheet( asset: AssetsMetaSpritesheetItem | AssetsMetaSingleImageItem ): asset is AssetsMetaSpritesheetItem {
		return (<AssetsMetaSpritesheetItem>asset).bounds !== undefined;
	}


	yield_asset_name_list = () => {
		return _.filter(
			this.static_vals.asset_list,
			(value, index) => {
				return value.not_a_tile !== true;
			}
		).map( (value,index) => {
			return value.name;
		})
	}

	yield_tile_name_list = () => {
		return _.sortedUniq(
			_.map( this.static_vals.tile_types, (value,index)=>{
				return value.name;
			})
		);
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
			console.log( this.static_vals.assets_meta );

			do_once_app_ready();
		}
	}



/*----------------------- draw ops -----------------------*/
	get_asset_name_for_tile_at_zorder = (tile_name, zorder) => {
		let { assets, asset_list, assets_meta, tile_types } = this.static_vals;
		
		
		if(tile_name == 'cursor'){
			return 'cursor';
		}

		let tile_data = _.find(
			_.first(
				_.find( tile_types, (value, index) => {
					return value.name == tile_name;
				}).variants
			).graphics,
			(value, index) => {return value.zorder == zorder}
		);
		
		if(tile_data) {
			return tile_data.id;
		} else {
			return undefined;
		}
	}

	yield_zorder_list_for_tile = (tile_name) => {
		let { assets, asset_list, assets_meta, tile_types } = this.static_vals;
		
		let _array = tile_name == 'cursor'
			?
			'cursor'
			:
			_.map(_.first(
				_.find( tile_types, (value, index) => {
					return value.name == tile_name;
				}).variants
			).graphics,
				(value,index) =>{ 
					return value.zorder
				});
		
		return _array;
	}

	
	draw_all_assets_for_tile_type = (tile_name, ctx, should_use_tile_offset) => {
		let zorders = this.yield_zorder_list_for_tile(tile_name); 
	
		zorders.map( (value,index) => {
			this.draw_image_for_tile_type_at_zorder(tile_name, ctx, value, should_use_tile_offset);
		});
	}
	
	draw_image_for_tile_type_at_zorder = (tile_name, ctx, zorder, should_use_tile_offset) => {
		let asset_name = this.get_asset_name_for_tile_at_zorder(tile_name, zorder);

		if( asset_name ){
			this.draw_image_for_asset_name(
				asset_name,
				ctx,
				should_use_tile_offset
			);
		}
	}
	
	draw_image_for_asset_name = (asset_name, ctx, should_use_tile_offset) => {
		let { assets, asset_list, assets_meta } = this.static_vals;
		let asset = assets[ asset_name ]!;
		let metadata = assets_meta[ asset_name ]!;
		
		/*
			This assumes the canvas is pre-translated so our draw position is at the final point, so we don't have to do any calculation for that, here.
			
			This is the place where we do all 'spritesheet' handling, and also where we do all animation handling.
		*/
	
		let dim = metadata ? metadata.dim : { w: 20, h: 20 };  //safe-access
		
		
		if( !this.isAssetSpritesheet(metadata) ){
			ctx.drawImage	(
									asset,
									-(dim.w/2) + (should_use_tile_offset ? this.consts.tile_width/2 : 0),
									-(dim.h/2) + (should_use_tile_offset ? this.consts.tile_height/2 : 0),
								);
		} else {
			ctx.drawImage	(
				/* file */			asset,

									
				/* src xy */		metadata.bounds.x,
									metadata.bounds.y,
				/* src wh */		metadata.bounds.w,
									metadata.bounds.h,

									
				/* dst xy */		-Math.floor(metadata.bounds.w/2) + (should_use_tile_offset ? Math.floor(this.consts.tile_width/2) : 0),
									-Math.floor(metadata.bounds.h/2) + (should_use_tile_offset ? Math.floor(this.consts.tile_height/2) : 0),
				/* dst wh */		metadata.bounds.w,
									metadata.bounds.h,
								);
		}
	}
	

	dice = (sides) => {
		return Math.floor( Math.random() * sides ) + 1;
	}
}

export default Asset_Manager;