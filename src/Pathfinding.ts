import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";

import { PriorityQueue } from 'ts-pq';

import { ƒ } from "./Utils";

import { TileComparatorSample, TilePositionComparatorSample } from "./Asset_Manager";
import { Tilemap_Manager } from "./Tilemap_Manager";
import { Creature } from "./Creature";
import { Point2D, Rectangle } from './interfaces';

interface tileViewState {
	tileStatus: TileGrid,
	initialized: boolean,
}

interface NodeGraph {
	[index: string]: Array<string>
}

interface NodeAddrToNodeAddrDict {
	[index: string]: string
}

interface NodeAddrToNumberDict {
	[index: string]: number
}


type TileGrid = [[string]];

export class Node_Graph_Generator {
	_TM: Tilemap_Manager;
	_Creature: Creature;

	constructor( _TM: Tilemap_Manager, _Creature: Creature ) {
		
		this._TM = _TM;
		this._Creature = _Creature;
	}
	
	
/*----------------------- core functionality -----------------------*/
	is_open = ( _grid: TileGrid, _coords: Point2D ): boolean => (
		//this is going to be incredibly subjective and data-dependent; this is sort of a placeholder for the time being
		this._Creature.yield_move_cost_for_tile_type( _grid[_coords.y][_coords.x] ) !== null
	)
	
	
	push_if_not_null = (_array: Array<string>, _push_val: string|null): void => {
		if(_push_val != null){
			_array.push( _push_val );
		}
	}
	
	check_tile = ( _grid: TileGrid, _coords: Point2D ): string|null => {
		if( this._TM.is_within_map_bounds( _coords ) && this.is_open( _grid, _coords ) ){
			/*
				If the tile we're checking is out of bounds, then it's blocked.
				If the tile we're checking is open, it's a valid node connection, so we return it (so we can add it to the graph).
			*/
			return _coords.x + "," + _coords.y;
		} else {
			return null;
		}
	};


	check_adjacencies = ( _grid: TileGrid, _coords: Point2D ): Array<string> => {
		const tile_data: TilePositionComparatorSample = this._TM.get_tile_position_comparator_for_pos(_coords);
		var adjacent_nodes = [];

		/*
			Check every adjacent tile in clockwise order, starting from the north.
			Skip the very middle tile [1][1] in the comparator, because we're attempting to build a graph of "vectors" (i.e. directions we can move towards), and this will break the algorithm if we include it.  Probably. 
		*/
		this.push_if_not_null( adjacent_nodes, this.check_tile ( _grid, tile_data[0][0] ));
		this.push_if_not_null( adjacent_nodes, this.check_tile ( _grid, tile_data[0][1] ));
		this.push_if_not_null( adjacent_nodes, this.check_tile ( _grid, tile_data[1][0] ));
		this.push_if_not_null( adjacent_nodes, this.check_tile ( _grid, tile_data[1][2] ));
		this.push_if_not_null( adjacent_nodes, this.check_tile ( _grid, tile_data[2][0] ));
		this.push_if_not_null( adjacent_nodes, this.check_tile ( _grid, tile_data[2][1] ));

		return adjacent_nodes;
	}
	
	build_node_graph_from_grid = ( _grid: TileGrid ): NodeGraph => {
		var graph_as_adjacency_list = [];
		
		_.map( _grid, (row_value: Array<string>, row_index) => {
			_.map( row_value, (col_value, col_index) => {

				//using this to skip solid tiles; we already handle tracking adjacencies *into* solid tile in the check_adjacencies function, but we need to skip looking *outwards* from solid tiles as well.
				if( this.is_open( _grid, {x: col_index, y: row_index} ) ){
					graph_as_adjacency_list[col_index + "," + row_index] = this.check_adjacencies( _grid, { x: col_index, y: row_index } );
				}
			})
		});
		
		return graph_as_adjacency_list as unknown as NodeGraph;
	}
}

const addr_to_tuple = (the_string: string): Point2D => {
	return{ x: Number(the_string.split(',')[0]), y: Number(the_string.split(',')[1]) }
}

const tuple_to_addr = (the_tuple: Point2D): string => {
	return  the_tuple.x + ',' + the_tuple.y;
}
			


const a_star_search = ( _graph: NodeGraph, _start_coords: Point2D, _end_coords: Point2D ) => {
	var discarded_nodes = [];
	let search_was_aborted_early : boolean = false;
	let search_has_succeeded : boolean = false;


	var frontier = new PriorityQueue<Point2D>();
	var costs_so_far: NodeAddrToNumberDict = {};  //a map of node addresses (keys) to move cost (values)
	var came_from: NodeAddrToNodeAddrDict = {}; //a map of node addresses (keys) to node addresses (values) 
	
	const remove_item_from_obj = (obj, victim) => _.pick(obj, _.filter(_.keys(obj), (val)=> val != victim ))
	
	const compute_node_heuristic = ( _node_coords, _end_coords ) => {
		return Math.hypot( _node_coords.x - _end_coords.x, _node_coords.y - _end_coords.y);
	}
	
	//search a queue for whatever node has the highest value, and extract that node's coords
	const get_lowest_value = (obj) => {
		return _.keys(obj).reduce((a, b) => obj[a] < obj[b] ? a : b);
	}

	//do some bigtime sanity checks so we don't crash
	if(
		!(tuple_to_addr(_start_coords) in _graph)

		//I'm really not sure if we should have end_coords in this check.  Sort of a todo for later.
	){
		/*
			We're testing to see if the start coords were somehow blocked.  If they're not available as one of the graph keys it means they're not a passable tile.
		
			Remember that the graph isn't merely list of connections, but it's specifically a list of one-way connections; that is, indications that "if you were in tile A, you could go to tile B" - and that the reverse of that, the B->A case, is stored separately and NOT automatically the same as A->B in a node graph.  It's possible to have one-way connections in a node graph, even though we don't currently use them (but say, jumping off a cliff might count, and a lot more prosaic movement constraints might kick this rule into play when units have pretty limited moves-per-turn, and when there's a 'rounded' move cost for entering a tile).
		
			So if a node isn't in the graph, we know for sure the whole path reconstruction thing will fail.
		*/
		search_was_aborted_early = true;
	} 
	
	if( !search_was_aborted_early ){
		frontier.insert( _start_coords, 0 );
		costs_so_far[ tuple_to_addr(_start_coords) ] = 0;
		while( (frontier.size() > 0) ){
	
			const _current_node = frontier.pop(false) as Point2D;
			const current_node = tuple_to_addr(_current_node);
	
			if(current_node == tuple_to_addr(_end_coords)){
				search_has_succeeded = true;
				break;
			}
	
			_.map( _graph[ current_node ], (next_node, index) => {
				var new_cost = costs_so_far[ current_node ] + 1; //this is where we'd add a weighted graph lookup for movecost.
			
				if(
					!_.includes(_.keys(costs_so_far), next_node)
					||
					new_cost < costs_so_far[next_node]
				){
					costs_so_far[next_node] = new_cost;
			
					frontier.insert(addr_to_tuple(next_node), new_cost + compute_node_heuristic( addr_to_tuple(next_node), _end_coords ));
					came_from[next_node] = current_node;
			
				}

			})
		}
	}
	

	const reconstruct_path = (came_from: NodeAddrToNodeAddrDict, start_node: string, goal_node: string): Array<string> => {
		let current_node = goal_node;
		let path: Array<string>  = [];
		while( current_node != start_node ){
			path.push(current_node);
			current_node = came_from[current_node];
		}
		path.push(start_node);
		
		let path_as_tuples = _.map(path, (val,idx) => ( addr_to_tuple(val) ) );
		return path_as_tuples;
	}


	return {
		successful_path:	ƒ.if(search_has_succeeded,
								()=>( reconstruct_path(came_from, tuple_to_addr(_start_coords), tuple_to_addr(_end_coords) )),
								[]
							),
		discarded_nodes: _.keys(came_from)
	};
	
}




export class Pathfinder {
	constructor(  ) {
		
	}

	find_path_between_map_tiles = (_TM: Tilemap_Manager, _start_coords: Point2D, _end_coords: Point2D, _Creature: Creature) => {
		/*
			We're going to go ahead and pass in the creature as a constructor argument; the idea here is that we can't really "reuse" an existing node graph generator and just pass in a new creature type; the moment anything changes about the creature we're using, we need to completely rebuild the node graph from scratch.  So there's no sense in pipelining it into the whole function tree inside the class - we have to nuke and rebuild anyways, so why not make the interface a bit simpler?
		*/
		const _Node_Graph_Generator = new Node_Graph_Generator(_TM, _Creature);

	
		const _graph = _Node_Graph_Generator.build_node_graph_from_grid( _TM.state.tileStatus );
	
		return a_star_search( _graph, _start_coords, _end_coords );
	}
}

