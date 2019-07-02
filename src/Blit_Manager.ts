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



interface fpsTrackerData {
	current_second: number,
	current_millisecond: number,
	current_frame_count: number,
	prior_frame_count: number,
}



/*
	The main thrust of this component is to house a list of commingled objects that are going to be drawn in a given frame.  These objects are layered, and are given draw coords in the world's coordinate space.  They have no knowledge of "what" they are, nor of subsequent frames/animations/etc.   All they know is what image, what location, and what z-index.
	
	By doing this, we're able to commingle totally disparate kinds of objects - whether they're tiles being drawn at fixed "grid" locations, or players/enemies/props being drawn at arbitrary locations, and still have these objects interleave into z-layered order, so that i.e. an enemy can appear to stand *behind* a tree.

	The goal here is to allow shots and creatures to travel on fully freefrom paths, using tile locations as a mere "recommendation" that a path can either smoothly bezier along, or even ignore entirely.   We'd like to avoid the "hard grid-locked" nature of drawing engines like Civ 2 or Wesnoth, who at best could do tile-relative drawing positions.
*/



export class Blit_Manager {
	ctx: CanvasRenderingContext2D;
	fps_tracker: fpsTrackerData;

	_Draw_List: Array<DrawEntity>;

/*----------------------- initialization and asset loading -----------------------*/
	constructor( ctx: CanvasRenderingContext2D ) {
		this.ctx = ctx;
		
		
		this._Draw_List = [];
		this.fps_tracker = {
			current_second: 0,
			current_millisecond: 0,
			current_frame_count: 0,
			prior_frame_count: 0,
		};
	}

	reset_context = ( ctx: CanvasRenderingContext2D ) => {
		this.ctx = ctx;
	}


	queue_draw_op = (pos: Point2D, z_index: number, drawing_data: DrawData ) => {
		this._Draw_List.push({
			pos: pos,
			z_index: z_index,
			drawing_data: drawing_data
		});
	}
	
	
	draw_entire_frame = () => {
		//sort it all by painter's algorithm
		console.log(_.size(this._Draw_List));
		//then blit it
		_.map(this._Draw_List, (value,index) => {
			if( this.isDrawDataWithBounds(value.drawing_data) ){

				this.ctx.save();

				this.ctx.translate( value.pos.x, value.pos.y );
				this.ctx.drawImage	(
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
				this.ctx.restore();
			} else {

				this.ctx.save();

				this.ctx.translate( value.pos.x, value.pos.y );
				this.ctx.drawImage	(
					/* file */			value.drawing_data.image_ref,
										value.drawing_data.dest_point.x,
										value.drawing_data.dest_point.y,
									);
				this.ctx.restore();
			}
		})


		
		//then clear it, because the next frame needs to start from scratch
		this._Draw_List = [];
	}

	isDrawDataWithBounds( data: DrawData | DrawDataNoBounds ): data is DrawData {
		return (<DrawData>data).src_rect !== undefined;
	}

/*----------------------- utility draw ops -----------------------*/
	fill_canvas_with_solid_color = () => {
		this.ctx.save();
	    this.ctx.fillStyle = "#000000";
		this.ctx.fillRect(0,0, this.ctx.canvas.width, this.ctx.canvas.height);
		this.ctx.restore();
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
		this.ctx.save();
		this.ctx.font = '12px Helvetica, sans-serif';
		this.ctx.textAlign = 'center';
		this.ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
	    this.ctx.shadowOffsetY = 2;
	    this.ctx.shadowBlur = 3;
	    this.ctx.fillStyle = "#ffffff";
		this.ctx.textBaseline = 'middle';
		this.ctx.fillText(value.toString(), (this.ctx.canvas.width - 10), 10);
		this.ctx.restore();
	}


}