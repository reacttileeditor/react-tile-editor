import _ from "lodash";
import Prando from 'prando';


/*----------------------- utility functions -----------------------*/
export const dice = (sides) => (
	Math.floor( Math.random() * sides ) + 1
)

export const dice_anchored_on_specific_random_seed = (sides: number, seed: Prando) => (
	Math.floor( seed.next() * sides ) + 1
)

export const is_even = (value : number) => (
	value % 2 == 0
)
