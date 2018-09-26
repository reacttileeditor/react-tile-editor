import React from "react";
import ReactDOM from "react-dom";

class Canvas_View extends React.Component {
/*----------------------- initialization and asset loading -----------------------*/
	constructor( props ) {
		super( props );
		
		this.state = {
			assets_loaded: false,
			mousedown_pos: null,
		}
	}


	componentWillMount() {
		this.static = {
			asset_list: [
			],
			assets: {},
			assets_meta: {},
		};
	}
	


	componentDidMount() {
		this.ctx = this.canvas.getContext("2d");
//		this.launch_app();
		this.launch_if_all_assets_are_loaded();
	}


	componentDidUpdate() {
		this.render_canvas();
	}


	launch_app = () => {
		this.static.asset_list.map( ( value, index ) => {

			var temp_image = new Image();
			var temp_url = PATH_PREFIX + value.url;
			
			temp_image.src = temp_url;

			temp_image.onload = () => {
				this.static.assets[ value.name ] = temp_image;
				
				this.static.assets_meta[ value.name ] = { dim: { w: temp_image.scrollWidth, h: temp_image.scrollHeight }};
				this.launch_if_all_assets_are_loaded();
			};
		});
	}

	launch_if_all_assets_are_loaded = () => {
		/*
			There's a big problem most canvas apps have, which is that the canvas will start doing its thing right away and start trying to render, even if you haven't loaded any of the images yet.  What we want to do is have it wait until all the images are done loading, so we're rolling a minimalist "asset manager" here.  The only way (I'm aware of) to tell if an image has loaded is the onload callback.  Thus, we register one of these on each and every image, before attempting to load it.

			Because we carefully wait to populate the values of `loadedAssets` until we're actually **in** the callback, we can just do a size comparison to determine if all of the loaded images are there.
		*/

		//if( size( this.static.asset_list ) == size( this.static.assets ) ) {
			this.setState({assets_loaded: true});
		//}
	}


/*----------------------- core drawing routines -----------------------*/
	render_canvas = () => {
		//let { assets, asset_list, assets_meta } = this.static;
		//let { sticker_name_to_be_placed, ghost_sticker } = this.state;
		this.fill_canvas_with_solid_color();

		/*this.state.applied_stickers.map( (value) => {
			let dim = assets_meta[ value.name ] ? assets_meta[ value.name ].dim : { w: 20, h: 20 };  //safe-access

			this.ctx.save();
			this.ctx.translate( value.x, value.y );
			this.ctx.rotate( value.rotation );
			this.ctx.scale( value.x_scale, value.y_scale );
			
			this.ctx.drawImage( assets[value.name],  -(dim.w/2),  -(dim.h/2));
			this.ctx.restore();
		});*/

	
		this.draw_headline_text();
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
	

	fill_canvas_with_solid_color = () => {
		this.ctx.save();
		this.ctx.fillRect(0,0, this.ctx.canvas.width, this.ctx.canvas.height);
		this.ctx.restore();
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
		console.log("MousePos:", mousePos);
	}

	constrain = ( min_limit, value, max_limit ) => {
		return Math.min( Math.max(min_limit, value), max_limit);
	}

	handle_canvas_click = ( e ) => {
		var mousePos = this.get_mouse_pos_for_action(e, true);
	
		//start_any_operation( opname, mousePos.x, mousePos.y );
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
		//this.set_secondary_operation_mode(null);
		//this.set_operation_grabber_index(null);
		this.setState({mousedown_pos: null});
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
/*----------------------- state manipulation -----------------------*/

/*----------------------- react render -----------------------*/

	render() {
		return <div>
			Canvas:
			<canvas ref={(node) => {this.canvas = node;}} width="567" height="325"/>
		</div>;
	}
}

export default Canvas_View;