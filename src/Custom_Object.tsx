import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";
import { v4 as uuid } from "uuid";

import { ƒ } from "./Utils";

import { Tilemap_Manager, Direction } from "./Tilemap_Manager";

import { Point2D, Rectangle } from './interfaces';


type CustomObjectTypeName = 'red_dot';

export class Custom_Object {
	pixel_pos: Point2D;
	unique_id: string;
	type_name: string;




	constructor(p: {
		pixel_pos: Point2D,
		type_name: CustomObjectTypeName,
		unique_id?: string,
	}) {
		this.pixel_pos = p.pixel_pos;
		this.type_name = p.type_name;
		
		if(p.unique_id != undefined){
			this.unique_id = p.unique_id;
		} else {
			this.unique_id = uuid();
		}
	}






/*----------------------- basetype management -----------------------*/

	// get_info = ():CreatureType => (
	// 	this.creature_basetype_delegate
	// )


/*----------------------- movement -----------------------*/


	process_single_frame = (_Tilemap_Manager: Tilemap_Manager, offset_in_ms: number): Custom_Object => {

		let newObj = _.cloneDeep(this);


		newObj.pixel_pos.y += 3;

		console.log(this.pixel_pos.y, newObj.pixel_pos.y)
		return newObj;
	}

	yield_image = () => (
		'red_dot'
	)

}