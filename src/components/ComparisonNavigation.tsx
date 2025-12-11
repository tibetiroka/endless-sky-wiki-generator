/*
 * Copyright (c) 2025 by tibetiroka.
 *
 * endless-sky-wiki-generator is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * endless-sky-wiki-generator is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


import {ReferenceSource} from "../data/ReferenceSource.ts";
import {useState} from "react";
import {Button, Toast} from "react-bootstrap";
import {createPath} from "../web_utils.ts";

type ComparisonSingleItemNavigationProps = { source: ReferenceSource }

export function ComparisonSingleItemNavigation(props: ComparisonSingleItemNavigationProps) {
	const [isAdded, setAdded] = useState(undefined as boolean | undefined);

	if (isAdded === undefined) {
		const itemsJson: string | null = localStorage.getItem('compare/' + props.source.type);
		if (itemsJson) {
			const items: string[] = JSON.parse(itemsJson);
			setAdded(items.includes(props.source.name as string));
		} else {
			setAdded(false);
			localStorage.setItem('compare/' + props.source.type, JSON.stringify([]));
		}
	}
	return <div>
		<Button className={isAdded ? 'comparison-button comparison-button-remove btn-danger' : 'comparison-button comparison-button-add btn-success'}
				onClick={() => {
					const itemsJson: string | null = localStorage.getItem('compare/' + props.source.type);
					if (itemsJson) {
						let items: string[] = JSON.parse(itemsJson);
						if (isAdded) {
							items = items.filter(item => item !== props.source.name);
						} else {
							items.push(props.source.name as string);
						}
						setAdded(!isAdded);
						localStorage.setItem('compare/' + props.source.type, JSON.stringify(items));
					}
				}}>
			<i className={isAdded ? 'bi bi-dash-square-dotted' : 'bi bi-plus-square-dotted'}></i>
			{' Compare'}
		</Button>
		<Button className='comparison-button comparison-button-view'
				onClick={() => {
					window.location.href = createPath('compare/' + props.source.type).toString();
				}}>
			<i className='bi bi-square-half'></i>
			{' View comparison'}
		</Button>
	</div>
}

type ComparisonBulkItemNavigationProps = { type: string, isLocal: boolean, sources: string[] }

export function ComparisonBulkNavigation(props: ComparisonBulkItemNavigationProps) {
	const [showShare, setShowShare] = useState(false);

	return <div className='comparison-bulk-navigation'>
		{props.isLocal ?
			<Button className={'comparison-button comparison-button-remove btn-danger'}
					onClick={() => {
						localStorage.setItem('compare/' + props.type, JSON.stringify([]));
						window.location.href = createPath('').toString();
					}}>
				<i className='bi bi-dash-square'></i>
				{' Clear comparison'}
			</Button> :
			<Button className={'comparison-button comparison-button-import'}
					onClick={() => {
						const urlParams = new URLSearchParams(window.location.search);
						const sourcesString: string | null = urlParams.get('sources');
						localStorage.setItem('compare/' + props.type, sourcesString as string);
						window.location.href = createPath('compare/' + props.type).toString();
					}}>
				<i className='bi bi-box-arrow-in-left'></i>
				{' Import'}
			</Button>}
		<Button className={'comparison-button comparison-button-share btn-success'}
				onClick={() => {
					const path: string = createPath('compare/' + props.type + '?sources=' + encodeURIComponent(JSON.stringify(props.sources))).toString();
					navigator.clipboard.writeText(path).then(()=>{setShowShare(true)});
				}}>
			<i className='bi bi-share'></i>
			{' Share'}
		</Button>
		<Toast onClose={() => setShowShare(false)} show={showShare} delay={1000} autohide className='position-relative right-0'>
			<Toast.Body>
				<i className='bi bi-copy'></i>
				{' Copied link!'}
			</Toast.Body>
		</Toast>
	</div>
}