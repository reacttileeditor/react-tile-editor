import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";

import { Asset_Manager } from "./Asset_Manager";

var PATH_PREFIX = "/dist/assets/"

import { TileComparatorSample } from "./Asset_Manager";

import { Point2D, Rectangle } from './interfaces';

interface DrawEntity {
	pos: Point2D,
	z_index: number,
	drawing_data: DrawData|DrawDataNoBounds,
}

interface DrawData {
	image_ref: HTMLImageElement,
	src_rect: Rectangle,
	dst_rect: Rectangle
}

interface DrawDataNoBounds {
	//images that are just direct references don't need rectangular dimensions to draw
	//honestly we probably want to remove this, but for now we'll support it to keep the code train rolling.
	image_ref: HTMLImageElement,
	dest_point: Point2D
}

interface BlitManagerState {
	viewport_offset: Point2D,
}


interface fpsTrackerData {
	current_second: number,
	current_millisecond: number,
	current_frame_count: number,
	prior_frame_count: number,
}

declare var OffscreenCanvas : any;

/*
	The main thrust of this component is to house a list of commingled objects that are going to be drawn in a given frame.  These objects are layered, and are given draw coords in the world's coordinate space.  They have no knowledge of "what" they are, nor of subsequent frames/animations/etc.   All they know is what image, what location, and what z-index.
	
	By doing this, we're able to commingle totally disparate kinds of objects - whether they're tiles being drawn at fixed "grid" locations, or players/enemies/props being drawn at arbitrary locations, and still have these objects interleave into z-layered order, so that i.e. an enemy can appear to stand *behind* a tree.

	The goal here is to allow shots and creatures to travel on fully freefrom paths, using tile locations as a mere "recommendation" that a path can either smoothly bezier along, or even ignore entirely.   We'd like to avoid the "hard grid-locked" nature of drawing engines like Civ 2 or Wesnoth, who at best could do tile-relative drawing positions.
*/



export class Blit_Manager {
	ctx: CanvasRenderingContext2D;
	fps_tracker: fpsTrackerData;
	state: BlitManagerState;
	_Draw_List: Array<DrawEntity>;
	_OffScreenBuffer: any;
	osb_ctx: CanvasRenderingContext2D;

/*----------------------- initialization and asset loading -----------------------*/
	constructor( ctx: CanvasRenderingContext2D ) {
		this.ctx = ctx;
		
		this._OffScreenBuffer = new OffscreenCanvas(567, 325);
		this.osb_ctx = this._OffScreenBuffer.getContext("2d");
		
		this._Draw_List = [];
		this.fps_tracker = {
			current_second: 0,
			current_millisecond: 0,
			current_frame_count: 0,
			prior_frame_count: 0,
		};

		this.state = {
			viewport_offset: {x: 200, y: 0},
		};
	}

	reset_context = ( ctx: CanvasRenderingContext2D ) => {
		this.ctx = ctx;
	}

/*----------------------- state manipulation -----------------------*/
	adjust_viewport_pos = (x, y) => {
		this.state.viewport_offset = {
			x: this.state.viewport_offset.x + x,
			y: this.state.viewport_offset.y + y
		};
	}

	yield_world_coords_for_absolute_coords = (pos: Point2D) => {
		return {
			x: pos.x - this.state.viewport_offset.x,
			y: pos.y - this.state.viewport_offset.y
		}
	} 

/*----------------------- draw ops -----------------------*/
	queue_draw_op = (pos: Point2D, z_index: number, drawing_data: DrawData ) => {
		this._Draw_List.push({
			pos: pos,
			z_index: z_index,
			drawing_data: drawing_data
		});
	}
	
	
	draw_entire_frame = () => {
		//sort it all by painter's algorithm

		//then blit it
		_.map(this._Draw_List, (value,index) => {
			if( this.isDrawDataWithBounds(value.drawing_data) ){

				this.osb_ctx.save();

				this.osb_ctx.translate( value.pos.x + this.state.viewport_offset.x, value.pos.y + this.state.viewport_offset.y );
				this.osb_ctx.drawImage	(
					/* file */			value.drawing_data.image_ref,

									
					/* src xy */		value.drawing_data.src_rect.x,
										value.drawing_data.src_rect.y,
					/* src wh */		value.drawing_data.src_rect.w,
										value.drawing_data.src_rect.h,

									
					/* dst xy */		value.drawing_data.dst_rect.x,
										value.drawing_data.dst_rect.y,
					/* dst wh */		value.drawing_data.dst_rect.w,
										value.drawing_data.dst_rect.h,
									);
				this.osb_ctx.restore();
			} else {

				this.osb_ctx.save();

				this.osb_ctx.translate( value.pos.x + this.state.viewport_offset.x, value.pos.y + this.state.viewport_offset.y );

				/*
					The savvy amongst us might wonder - what the hell are we doing providing non-zero xy coords inside this drawImage call if we're already translating the canvas?  These exist to draw the tile with its origin not as 0,0, but as the center of the sprite image.
				*/

				this.osb_ctx.drawImage	(
					/* file */				value.drawing_data.image_ref,
					/* dst upper-left x */	value.drawing_data.dest_point.x,
					/* dst upper-left y */	value.drawing_data.dest_point.y,
									);
				this.osb_ctx.restore();
			}
		})

		var bitmap = this._OffScreenBuffer.transferToImageBitmap();
		this.ctx.transferFromImageBitmap(bitmap);
		
		//then clear it, because the next frame needs to start from scratch
		this._Draw_List = [];
	}

	isDrawDataWithBounds( data: DrawData | DrawDataNoBounds ): data is DrawData {
		return (<DrawData>data).src_rect !== undefined;
	}

/*----------------------- utility draw ops -----------------------*/
	fill_canvas_with_solid_color = () => {
		this.osb_ctx.save();
	    this.osb_ctx.fillStyle = "#000000";
		this.osb_ctx.fillRect(0,0, this.ctx.canvas.width, this.ctx.canvas.height);
		this.osb_ctx.restore();
	}

	draw_fps = () => {
		var date = new Date();
		
		this.fps_tracker.current_frame_count += 1;
		
		if( this.fps_tracker.current_second < date.getSeconds() || (this.fps_tracker.current_second == 59 && date.getSeconds() == 0) ){
			this.fps_tracker.prior_frame_count = this.fps_tracker.current_frame_count;
			this.fps_tracker.current_frame_count = 0;
			this.fps_tracker.current_second = date.getSeconds();
		} else {
			
		}
		
		this.fps_tracker.current_millisecond = date.getTime();
		
		this.draw_fps_text(this.fps_tracker.prior_frame_count);

	}

	draw_fps_text = (value) => {
		this.osb_ctx.save();
		this.osb_ctx.font = '12px Helvetica, sans-serif';
		this.osb_ctx.textAlign = 'center';
		this.osb_ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
	    this.osb_ctx.shadowOffsetY = 2;
	    this.osb_ctx.shadowBlur = 3;
	    this.osb_ctx.fillStyle = "#ffffff";
		this.osb_ctx.textBaseline = 'middle';
		this.osb_ctx.fillText(value.toString(), (this.ctx.canvas.width - 10), 10);
		this.osb_ctx.restore();
	}


}