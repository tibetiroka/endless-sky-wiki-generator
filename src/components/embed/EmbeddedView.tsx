/*
 * Copyright (c) 2026 by tibetiroka.
 *
 * endless-sky-wiki-generator is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * endless-sky-wiki-generator is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import {ReactElement, useEffect, useState} from "react";
import {Point} from "../../data/DataScheme.tsx";
import {Button} from "react-bootstrap";

export type ViewRendererProps = { scale: number, offset: Point, passthroughProps: any };
type RenderFunction = (props: ViewRendererProps) => ReactElement | undefined;
type EmbeddedViewRendererProps = {
	scale?: number,
	offset?: Point,
	className?: string,
	render: RenderFunction,
	passthroughProps: any
}

export function EmbeddedViewRenderer(props: EmbeddedViewRendererProps): ReactElement | undefined {
	const [scale, setScale] = useState(props.scale ?? 1);
	const [scaleSteps, setScaleSteps] = useState(0);
	const [offset, setOffset] = useState(props.offset ?? new Point());
	const [render, setRender] = useState(undefined as undefined | ReactElement);

	useEffect(() => {
		const div = <div
			className={`embedded-view-renderer ${props.className}`}
			onMouseMove={event => {
				if (event.buttons & 1) {
					const newOffset: Point = new Point([event.movementX, event.movementY]);
					newOffset.multiply(1 / scale);
					newOffset.add(offset);
					setOffset(newOffset);
					event.preventDefault();
				}
			}}
			style={{
				position: 'relative',
				containerType: 'size'
			}}>
			<props.render scale={scale} offset={offset} passthroughProps={props.passthroughProps}/>
			<Button variant='secondary' className='embedded-view-renderer-button zoom-button' style={{
				top: '0',
				left: '100%',
				translate: '-32px 2px'
			}} onClick={event => {
				const newScaleSteps = scaleSteps + (event.ctrlKey ? 5 : 1);
				setScaleSteps(newScaleSteps);
				setScale((props.scale ?? 1) * Math.pow(1.3, newScaleSteps));
			}}>+</Button>
			<Button variant='secondary' className='embedded-view-renderer-button zoom-button' style={{
				top: '30px',
				left: '100%',
				translate: '-32px 2px'
			}} onClick={event => {
				const newScaleSteps = scaleSteps - (event.ctrlKey ? 5 : 1);
				setScaleSteps(newScaleSteps);
				setScale((props.scale ?? 1) * Math.pow(1.3, newScaleSteps));
			}}>‒</Button>
		</div> as ReactElement;
		setRender(div);
	}, [props, scale, offset, scaleSteps]);

	return render;
}