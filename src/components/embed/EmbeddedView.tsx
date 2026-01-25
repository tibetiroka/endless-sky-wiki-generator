/*
 * Copyright (c) 2026 by tibetiroka.
 *
 * endless-sky-wiki-generator is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * endless-sky-wiki-generator is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import {ReactElement, useCallback, useEffect, useRef, useState} from "react";
import {Point} from "../../data/DataScheme.tsx";
import {Button} from "react-bootstrap";

export type ViewRendererProps = {
	readonly scale: number,
	readonly offset: Point,
	readonly customToggleStates?: boolean[],
	readonly passthroughProps: any
};
type RenderFunction = (props: ViewRendererProps) => ReactElement | undefined;
type EmbeddedViewRendererProps = {
	readonly scale?: number,
	readonly minScale?: number,
	readonly maxScale?: number,
	readonly offset?: Point,
	readonly className?: string,
	readonly render: RenderFunction,
	readonly initialButtonStates?: boolean[],
	readonly buttonTitles?: string[],
	readonly buttonContentGenerators?: ((state: boolean) => ReactElement | undefined)[],
	readonly passthroughProps: any
};

export function EmbeddedViewRenderer(props: EmbeddedViewRendererProps): ReactElement | undefined {
	const [scale, setScale] = useState(props.scale ?? 1);
	const [scaleSteps, setScaleSteps] = useState(0);
	const [offset, setOffset] = useState(props.offset ?? new Point());
	const latestOffset = useRef(new Point(offset));
	const latestOffsetTicking = useRef(false);
	const previousTouchPos = useRef(new Point());
	const [customButtonStates, setCustomButtonStates] = useState(props.initialButtonStates);
	const [render, setRender] = useState(undefined as undefined | ReactElement);

	const addScale = useCallback((steps: number) => {
		const scaleFactor = 1.3;
		const scaleBase = props.scale ?? 1;
		let newScaleSteps = scaleSteps + steps;
		let scale = Math.pow(scaleFactor, newScaleSteps);
		if (props.minScale && scale < props.minScale) {
			newScaleSteps = Math.log(props.minScale) / Math.log(scaleFactor);
			scale = Math.pow(scaleFactor, newScaleSteps);
		} else if (props.maxScale && scale > props.maxScale) {
			newScaleSteps = Math.log(props.maxScale) / Math.log(scaleFactor);
			scale = Math.pow(scaleFactor, newScaleSteps);
		}
		setScaleSteps(newScaleSteps);
		setScale(scale * scaleBase);
	}, [props, scaleSteps]);

	const addOffset = useCallback((delta: Point) => {
		delta.add(latestOffset.current);
		latestOffset.current = delta;
		if (!latestOffsetTicking.current) {
			latestOffsetTicking.current = true;
			requestAnimationFrame(() => {
				setOffset(latestOffset.current);
				latestOffsetTicking.current = false;
			});
		}
	}, [latestOffset, latestOffsetTicking]);

	useEffect(() => {
		const div = <div
			className={`embedded-view-renderer ${props.className}`}
			onMouseMove={event => {
				if (event.buttons & 1) {
					const delta: Point = new Point([event.movementX, event.movementY]);
					delta.multiply(1 / scale);
					addOffset(delta);
					event.preventDefault();
					event.stopPropagation();
				}
			}}
			onTouchStart={event => {
				previousTouchPos.current = new Point([event.touches[0].pageX, event.touches[0].pageY]);
			}}
			onTouchMove={event => {
				const currPos = new Point([event.touches[0].pageX, event.touches[0].pageY]);
				const prevPos = previousTouchPos.current ? previousTouchPos.current : currPos;
				const delta = new Point(currPos);
				delta.subtract(prevPos);
				delta.multiply(1 / scale);
				addOffset(delta);
				previousTouchPos.current = currPos;
				event.preventDefault();
				event.stopPropagation();
			}}
			onDrag={event => event.preventDefault()}
			style={{
				position: 'relative',
				containerType: 'size'
			}}>
			<props.render scale={scale} offset={offset} customToggleStates={customButtonStates} passthroughProps={props.passthroughProps}/>
			<Button variant='secondary' className='embedded-view-renderer-button renderer-small-button' title='Zoom in' style={{
				top: '0',
				left: '100%',
				translate: '-32px 2px'
			}} onClick={event => addScale(event.ctrlKey ? 5 : 1)}>+</Button>
			<Button variant='secondary' className='embedded-view-renderer-button renderer-small-button' title='Zoom out' style={{
				top: '30px',
				left: '100%',
				translate: '-32px 2px'
			}} onClick={event => addScale(event.ctrlKey ? -5 : -1)}>‒</Button>
			{
				customButtonStates?.map((buttonState, index) =>
					<Button key={'custom-button-' + index}
							variant='secondary'
							className='embedded-view-renderer-button renderer-small-button'
							title={props.buttonTitles ? props.buttonTitles[index] : undefined}
							style={{
								top: (30 * (index + 2)) + 'px',
								left: '100%',
								translate: '-32px 2px'
							}}
							onClick={_ => {
								const states = [...customButtonStates ?? []];
								states[index] = !states[index];
								setCustomButtonStates(states);
							}}>
						{props.buttonContentGenerators ? props.buttonContentGenerators[index](buttonState) : undefined}
					</Button>)
			}
		</div> as ReactElement;
		setRender(div);
	}, [props, scale, offset, customButtonStates, addOffset, addScale]);

	return render;
}