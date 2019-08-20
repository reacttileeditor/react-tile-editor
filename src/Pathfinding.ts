import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";



import { Tilemap_Manager, TileComparatorSample, TilePositionComparatorSample } from "./Tilemap_Manager";
import { Point2D, Rectangle } from './interfaces';

interface tileViewState {
	tileStatus: TileGrid,
	initialized: boolean,
}

interface NodeGraph {
	[index: string]: Array<string>
}

type TileGrid = [[string]];

export class Node_Graph {
	_TM: Tilemap_Manager;

	constructor( _TM: Tilemap_Manager ) {
		
		this._TM = _TM;
	}
	
	
/*----------------------- core functionality -----------------------*/
	is_open = ( _grid: TileGrid, _coords: Point2D ): boolean => (
		//this is going to be incredibly subjective and data-dependent; this is sort of a placeholder for the time being
		_grid[_coords.y][_coords.x] != 'water'
	)
	
	
	push_if_not_null = (_array: Array<string>, _push_val: string|null): void => {
		if(_push_val != null){
			_array.push( _push_val );
		}
	}
	
	check_tile = ( _grid: TileGrid, _coords: Point2D ): string|null => {
		if( this._TM.is_within_map_bounds( _coords ) && this.is_open( _grid: TileGrid, _coords: Point2D ) ){
			/*
				If the tile we're checking is out of bounds, then it's blocked.
				If the tile we're checking is open, it's a valid node connection, so we return it (so we can add it to the graph).
			*/
			return _coords.x + "," + _coords.y;
		} else {
			return null;
		}
	};


	check_adjacencies = ( tile_identifier: string, _coords: Point2D ): Array<string> => {
		const tile_data = this._TM.get_tile_position_comparator_for_pos(_coords) :: TilePositionComparatorSample;
		var adjacent_nodes = [];

		/*
			Check every adjacent tile in clockwise order, starting from the north.
			Skip the very middle tile [1][1] in the comparator, because we're attempting to build a graph of "vectors" (i.e. directions we can move towards), and this will break the algorithm if we include it.  Probably. 
		*/
		push_if_not_null( adjacent_nodes, this.check_tile ( _grid, tile_data[0][0] ));
		push_if_not_null( adjacent_nodes, this.check_tile ( _grid, tile_data[0][1] ));
		push_if_not_null( adjacent_nodes, this.check_tile ( _grid, tile_data[1][0] ));
		push_if_not_null( adjacent_nodes, this.check_tile ( _grid, tile_data[1][2] ));
		push_if_not_null( adjacent_nodes, this.check_tile ( _grid, tile_data[2][0] ));
		push_if_not_null( adjacent_nodes, this.check_tile ( _grid, tile_data[2][1] ));

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

