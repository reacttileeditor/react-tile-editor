import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";



import { Tilemap_Manager } from "./Tilemap_Manager";
import { Point2D, Rectangle } from './interfaces';

interface tileViewState {
	tileStatus: [[string]],
	initialized: boolean,
}

interface NodeGraph {
	[index: string]: Array<string>
}

export class Node_Graph {
	_TM: Tilemap_Manager;
	
	
	is_open = ( _grid: tileStatus, _coords: Point2D): boolean => (
		//this is going to be incredibly subjective and data-dependent; this is sort of a placeholder for the time being
		_grid[ _coords.y ][ _coords.x ] != 'water'
	)
	
	
	push_if_not_null = (_array: Array<string>, _push_val: string): void => {
		if(_push_val != null){
			_array.push( _push_val );
		}
	}
	
	check_tile = ( _grid: tileStatus, _coords: Point2D ): string|null => {
		if( is_within_map_bounds( _coords ) && this.is_open( _grid, _coords ) ){
			/*
				If the tile we're checking is out of bounds, then it's blocked.
				If the tile we're checking is open, it's a valid node connection, so we return it (so we can add it to the graph).
			*/
			return _coords.x + "," + _coords.y;
		} else {
			return null;
		}
	};

	check_adjacencies = ( _grid: tileStatus, _coords: Point2D ): Array<string> => {
		var adjacent_nodes = [];

		//check every adjacent tile in clockwise order, starting from the north.
		push_if_not_null( adjacent_nodes, this.check_tile ( _grid, {x: _coords.x,		y: _coords.y - 1 }, ));
		push_if_not_null( adjacent_nodes, this.check_tile ( _grid, {x: _coords.x + 1,	y: _coords.y },		));
		push_if_not_null( adjacent_nodes, this.check_tile ( _grid, {x: _coords.x,		y: _coords.y + 1 }, ));
		push_if_not_null( adjacent_nodes, this.check_tile ( _grid, {x: _coords.x - 1,	y: _coords.y },		));
	
		return adjacent_nodes;
	}
	
	build_graph = ( _grid: tileStatus ): NodeGraph => {
		var graph_as_adjacency_list = [];
		
		_.map( _grid, (row_value, row_index) => {
			_.map( row_value, (col_value, col_index) => {

				//using this to skip solid tiles; we already handle tracking adjacencies *into* solid tile in the check_adjacencies function, but we need to skip looking *outwards* from solid tiles as well.
				if( this.is_open( _grid, _coords ) ){
					graph_as_adjacency_list[col_index + "," + row_index] = check_adjacencies( _grid, { x: col_index, y: row_index } );
				}	
			})
		});
		
		return graph_as_adjacency_list;
	}
	
	build_node_graph_from_grid = ( _grid: tileStatus ): NodeGraph => {
		return this.build_graph(_grid);
	}
}

