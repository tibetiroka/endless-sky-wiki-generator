/*
 * Copyright (c) 2025 by tibetiroka.
 *
 * endless-sky-wiki-generator is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * endless-sky-wiki-generator is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import {ReferenceSource, toString} from "../data/ReferenceSource.ts";
import {getData} from "../data/DataFetcher.ts";
import {ReactElement, useState} from "react";
import {ObjectData} from "../data/ObjectData.ts";
import {AnimationDisplay} from "./AnimationDisplay.tsx"
import {Tab, Tabs} from "react-bootstrap";

type StatBoxProps = { elements: ReferenceSource[] }

export function StatBox(props: StatBoxProps) {
	let [data, setData] = useState(undefined as ObjectData[] | undefined);

	if (props.elements.length === 0) {
		return;
	}
	const type: string = props.elements[0].type;
	if (!props.elements.every(source => source.type === type)) {
		console.log("Mixed types in stat box");
		props.elements = props.elements.filter(source => source.type === type);
	}
	const supportedTypes = ['ship', 'outfit'];
	if (!supportedTypes.includes(type)) {
		return undefined;
	}
	if (!data) {
		Promise.all(props.elements.map(source => getData(source))).then(data => setData(data));
	}

	function toKey(object: ObjectData): string {
		return object.getSource().type + '/' + object.getSource().name;
	}

	function toCols(functor: (object: ObjectData) => any) {
		return data?.map(object => <td key={toKey(object)}>
			{functor(object)}
		</td>)
	}

	function capitalizeWords(str: string): string {
		return str.split(' ')
			.map(word => word[0].toUpperCase() + word.slice(1))
			.join(' ');
	}

	function StatRow(hideIfDefault: boolean, attribute: string, name?: string, source: string[] = ['attributes'], computeMode?: string, defaultValue: any = '0') {
		if (!name) {
			name = capitalizeWords(attribute);
		}

		function getValues() {
			return data?.map(object => {
				let dataSource: any = object.getData();
				console.log(dataSource);
				for (const key of source) {
					dataSource = (dataSource && dataSource[key]) ? dataSource[key] : dataSource;
				}
				console.log(dataSource);
				let result = dataSource ? (dataSource[attribute] ?? defaultValue) : defaultValue;
				if (computeMode) {
					const attributes = object.getData()['attributes'] ?? object.getData();
					result = Number.parseFloat(result);
					if (computeMode === 'lifetime') {
						result *= Number.parseFloat(attributes['weapon']['lifetime']);
					} else if (computeMode === 'per second') {
						const multiplier = 60. / Number.parseFloat(attributes['weapon']['reload']);
						if (attribute === 'reload') {
							if (multiplier === 60 && Number.parseFloat(attributes['weapon']['lifetime']) <= 1.0) {
								result = 'continuous';
							} else {
								result = multiplier;
							}
						} else {
							result *= multiplier;
						}
					}
				}
				if (result) {
					const parsed = Number.parseFloat(result);
					if (!isNaN(parsed)) {
						result = parsed.toLocaleString();
					}
				}
				return result ?? defaultValue;
			});
		}

		const values = getValues() ?? [];

		if (hideIfDefault && values.every(value => value === defaultValue || value === Number.parseFloat(defaultValue).toLocaleString())) {
			return undefined;
		}

		return <tr key={attribute + '_' + name + '_' + (computeMode ?? '')}>
			<td>{name}</td>
			{toCols(object => values[data?.indexOf(object) ?? 0])}
		</tr>
	}

	const rows: (ReactElement | undefined)[] = [];
	if (data) {
		rows.push(<tr key='image'>
			{data.length === 1 ? undefined : <td></td>}
			{data.map(object => <td key={toKey(object)} colSpan={data?.length === 1 ? 2 : 1}>
				<CombinedImageDisplay data={object}/>
			</td>)}
		</tr>);
		switch (type) {
			case 'ship': {
				rows.push(StatRow(false, 'category', 'Class'));
				rows.push(StatRow(false, 'cost', 'Hull Cost'));
				rows.push(StatRow(false, 'total cost', 'Standard Cost', []));
				rows.push(StatRow(false, 'shields'));
				rows.push(StatRow(false, 'hull'));
				rows.push(StatRow(false, 'mass'));
				rows.push(StatRow(false, 'drag'));
				rows.push(StatRow(false, 'required crew'));
				rows.push(StatRow(false, 'bunks'));
				rows.push(StatRow(false, 'fuel capacity'));
				rows.push(StatRow(false, 'heat dissipation'));
				rows.push(StatRow(false, 'cargo space'));
				rows.push(StatRow(false, 'outfit space'));
				rows.push(StatRow(false, 'weapon capacity'));
				rows.push(StatRow(false, 'engine capacity'));
				rows.push(<tr key='gun ports'>
					<td>Gun Ports</td>
					{toCols(object => object.getData()['gun']?.length ?? 0)}
				</tr>);
				rows.push(<tr key='turret mounts'>
					<td>Turret Mounts</td>
					{toCols(object => object.getData()['turret']?.length ?? 0)}
				</tr>);
				break;
			}
			case 'outfit': {
				rows.push(StatRow(false, 'cost'));
				rows.push(StatRow(true, 'mass'));
				rows.push(StatRow(false, 'outfit space'));
				if (data.some(object => (object.getData()['attributes'] ?? object.getData())['weapon'])) {
					rows.push(StatRow(true, 'velocity', 'Range', ['attributes', 'weapon'], 'lifetime'));
					rows.push(StatRow(true, 'firing force', undefined, ['attributes', 'weapon']));
					rows.push(StatRow(true, 'hit force', undefined, ['attributes', 'weapon']));
					// extra weapon stats
					const modes = ['per second', undefined];
					for (const mode of modes) {
						rows.push(
							<tr key={'header' + (mode ?? '')}>
								<td className='header' colSpan={data.length + 1}>{capitalizeWords(mode ?? 'per shot')}</td>
							</tr>)
						rows.push(StatRow(false, 'shield damage', undefined, ['attributes', 'weapon'], mode));
						rows.push(StatRow(false, 'hull damage', undefined, ['attributes', 'weapon'], mode));
						rows.push(StatRow(false, 'firing energy', undefined, ['attributes', 'weapon'], mode));
						rows.push(StatRow(false, 'firing heat', undefined, ['attributes', 'weapon'], mode));
						if (mode) {
							rows.push(StatRow(false, 'reload', 'Shots', ['attributes', 'weapon'], mode));
						}
					}
				}
				break;
			}
		}
	}

	let headers: undefined | ReactElement[] | ReactElement = undefined;
	if (data) {
		if (data.length === 1) {
			headers = <th colSpan={2}>{data[0].displayName}</th>;
		} else {
			headers = [];
			headers.push(<th key='data'>Attributes</th>)
			data.forEach(object => {
				(headers as ReactElement[]).push(<th key={toKey(object)}>{object.displayName}</th>);
			});
		}
	}

	return <div>
		<table className='stats'>
			<thead>
			<tr>
				{headers}
			</tr>
			</thead>
			<tbody>
			{rows}
			</tbody>
		</table>
	</div>
}

type CombinedImageDisplayProps = { data: ObjectData };

function CombinedImageDisplay(props: CombinedImageDisplayProps) {
	const images: { name: string, animation?: string }[] = [];
	images.push({
		name: 'Thumbnail',
		animation: props.data.getData()['thumbnail'] ? toString(props.data.getSource()) + '/thumbnail' : undefined
	});
	images.push({
		name: 'Overhead',
		animation: props.data.getData()['sprite'] ? toString(props.data.getSource()) + '/sprite' : undefined
	});

	const existingImages = images.filter(image => image.animation);
	if (existingImages.length > 1) {
		return <Tabs className='combined-image-display-tabs'>
			{existingImages.map(image => <Tab key={image.name} eventKey={image.name} title={image.name}>
				<AnimationDisplay source={image.animation as string}/>
			</Tab>)}
		</Tabs>
	} else if (existingImages.length === 1) {
		return <AnimationDisplay source={existingImages[0].animation as string}></AnimationDisplay>
	} else {
		return <AnimationDisplay source={'outfits/cloaking device/sprite'}></AnimationDisplay>
	}
}
