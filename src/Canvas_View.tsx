import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";

var PATH_PREFIX = "/dist/assets/";
import { Tilemap_Manager } from "./Tilemap_Manager";
import Asset_Manager from "./Asset_Manager";


interface Props {
	asset_manager: Asset_Manager,
	assets_loaded: boolean,
	selected_tile_type: string,
}

interface State {
	mousedown_pos?: {x: number, y: number},
}


class Canvas_View extends React.Component <Props, State> {
	ctx: CanvasRenderingContext2D;
	render_loop_interval: number;
	_Tilemap: Tilemap_Manager;
	canvas: HTMLCanvasElement;

/*----------------------- initialization and asset loading -----------------------*/
	constructor( props ) {
		super( props );
		
		this.state = {
			mousedown_pos: undefined,
		}
		
//		this._Tilemap = null;
//		this.render_loop_interval = null;
	}


	componentDidMount() {
		this.ctx = this.canvas!.getContext("2d")!;
		this._Tilemap = new Tilemap_Manager(this.ctx, this.props.asset_manager);
		document.addEventListener('keydown', this.keyPressHandler);
	}


	componentDidUpdate() {
		if(this.props.assets_loaded){
			this.start_render_loop();
		}
	}


/*----------------------- core drawing routines -----------------------*/
	start_render_loop = () => {
		if( !this.render_loop_interval ){
			this.render_loop_interval = window.setInterval( this.render_canvas, 16.666 );
		}
	}

	render_canvas = () => {
		this._Tilemap.do_core_render_loop();
	}
	

/*----------------------- event handling -----------------------*/
	/*
		The big-picture view of event-handling in this app is that, to prevent event dropping, we do almost no event-handling in the actual final objects themselves - everything about tracking the mouse when you're doing an operation is handled on the main canvas itself.  The one thing we track in the objects themselves is the act of *starting* an event; of recording which event is being performed.  I.e. if you click on one of the rotate grabbers and start rotating an image, we'll use that to record (in this, the parent object) that a rotation event has started, but all of the actual tracking of the movement of the mouse (ergo, of what angle you're rotating to, and when you let go of the mouse) happens here.

		Events, like in photoshop, are modal; once you start rotating an image, the program is essentially 'locked' into a rotation mode until you let go of the mouse.  Because of this, we handle everything basically as a central 'switchboard', right here.
	*/
	track_canvas_move = ( e ) => {
		var mousePosUnconstrained = this.get_mouse_pos_for_action(e, false);
		var mousePos = this.get_mouse_pos_for_action(e, true);

		//this is where we had the giant switch statement of actions to perform.
		//console.log("MousePos:", mousePos);
		this._Tilemap.handle_mouse_move( mousePos.x, mousePos.y );
	}

	constrain = ( min_limit, value, max_limit ) => {
		return Math.min( Math.max(min_limit, value), max_limit);
	}

	handle_canvas_click = ( e ) => {
		var mousePos = this.get_mouse_pos_for_action(e, true);
	
		//start_any_operation( opname, mousePos.x, mousePos.y );
		this._Tilemap.handle_mouse_click( mousePos.x, mousePos.y, this.props.selected_tile_type );
	}

	get_mouse_pos_for_action = ( e, should_constrain ) => {
		//const mousePos = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY };
		/*
			Possible TODO: e.offsetX is an experimental feature that may not be available in IE; if it's not, we'll need to calculate a similar value by getting our canvas's position on the page, and calculating an equivalent of the same value by subtracting the canvas position from e.pageX
		*/
		const bgRectSrc = this.canvas.getBoundingClientRect();
		const bgRect = { x: bgRectSrc.left, y: bgRectSrc.top, w: bgRectSrc.right - bgRectSrc.left, h: bgRectSrc.bottom - bgRectSrc.top };
		const mousePos = (() => { if(e.nativeEvent !== undefined) {
			return { x: e.nativeEvent.clientX - bgRect.x, y: e.nativeEvent.clientY - bgRect.y };
		} else {
			return { x: e.clientX - bgRect.x, y: e.clientY - bgRect.y };
		}})();

		if( should_constrain ){
			return {
				x: this.constrain(0, mousePos.x, bgRect.w),
				y: this.constrain(0, mousePos.y, bgRect.h)
			};
		} else {
			return {
				x: mousePos.x,
				y: mousePos.y,
			};
		}
	}



	mousedownListener = (e) => {
		this.handle_canvas_click(e);
		this.captureMouseEvents(e);
	}

	mousemoveListener = (e) => {
		this.track_canvas_move(e);
		e.stopPropagation();
		// do whatever is needed while the user is moving the cursor around
	}

	mouseupListener = (e) => {
		var restoreGlobalMouseEvents = () => {
			document.body.style['pointer-events'] = 'auto';
		}

		restoreGlobalMouseEvents ();
		document.removeEventListener ('mouseup',   this.mouseupListener,   {capture: true});
		document.removeEventListener ('mousemove', this.mousemoveListener, {capture: true});
		e.stopPropagation ();

		//annul any in-progress operations here
		this._Tilemap.annul_current_drag_operation();

		this.setState({mousedown_pos: undefined});
	}

	captureMouseEvents = (e) => {
		var preventGlobalMouseEvents = () => {
			document.body.style['pointer-events'] = 'none';
		};

		preventGlobalMouseEvents ();
		document.addEventListener ('mouseup',   this.mouseupListener,   {capture: true});
		document.addEventListener ('mousemove', this.mousemoveListener, {capture: true});
		e.preventDefault ();
		e.stopPropagation ();
	}
	
	keyPressHandler = (event) => {
		switch (event.key) {
			case "Down": // IE/Edge specific value
			case "ArrowDown":
				this._Tilemap.adjust_viewport_pos(0,40);
				break;
			case "Up": // IE/Edge specific value
			case "ArrowUp":
				this._Tilemap.adjust_viewport_pos(0,-40);
				break;
			case "Left": // IE/Edge specific value
			case "ArrowLeft":
				this._Tilemap.adjust_viewport_pos(-40,0);
				break;
			case "Right": // IE/Edge specific value
			case "ArrowRight":
				this._Tilemap.adjust_viewport_pos(40,0);
				break;
		}
	}
/*----------------------- state manipulation -----------------------*/

/*----------------------- react render -----------------------*/

	render() {
		return <div className="canvas_holder">
			<canvas
				ref={(node) => {this.canvas = node!;}}
				width="567"
				height="325"
			
				onMouseDown={ this.mousedownListener }
				onMouseMove={ this.mousemoveListener }
				
			/>
		</div>;
	}
}

export default Canvas_View;