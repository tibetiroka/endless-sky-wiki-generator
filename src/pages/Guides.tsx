/*
 * Copyright (c) 2025 by tibetiroka.
 *
 * endless-sky-wiki-generator is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * endless-sky-wiki-generator is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import {ReactElement} from "react";

export function Guides(): ReactElement {
	return <>
		<h1>Guides</h1>
		This page is a list of guides and tools that can help you in the game or with creating content.

		<h2>Official Guides</h2>
		<ul>
			<li>
				<a href='https://github.com/endless-sky/endless-sky/wiki/PlayersManual'>Players Manual</a> Useful for any new players to the game, check this out.
			</li>
			<li>
				<a href='https://steamcommunity.com/sharedfiles/filedetails/?id=545464233%7C'>Official FAQ</a> The main developer of the game goes over many of the frequently asked questions.
			</li>
			<li>
				<a href='https://github.com/endless-sky/endless-sky/blob/master/docs/CONTRIBUTING.md'>Contributing How To</a> How to submit bugs and feature request using Github. You can also do this by posting in one of the places linked below in the community section.
			</li>
		</ul>

		<h2>Player Guides</h2>
		<ul>
			<li>
				<a href='https://steamcommunity.com/app/404410/discussions/0/2295094308079855933/'>Continuous build and the ESLauncher2</a> How to access the continuous version of the game, which is not stable but provides immediate access the newest additions to the game.
			</li>
			<li>
				<a href='https://steamcommunity.com/sharedfiles/filedetails/?id=572414719'>Complete Guide to All Things Alien</a> by <a href='https://steamcommunity.com/profiles/76561198050662341'>KATANA</a> This guide is unfortunately several years old, and therefore does not include the more recent alien races. However, it is a very high quality guide and goes in depth on the aliens it does cover.
			</li>
			<li>
				<a href='https://steamcommunity.com/sharedfiles/filedetails/?id=726997424'>Complete Mission Walkthrough</a> by <a href='https://steamcommunity.com/id/jafdy'>Jafdy</a> This guide isn't actually complete, but it does have a great walkthrough of the Free Worlds campaign.
			</li>
			<li>
				<a href='https://endless-sky.fandom.com/wiki/User_blog:CarbonPhoenix/Guide_to_Proper_Energy_Use'>Energy Guide</a> by <a href='https://endless-sky.fandom.com/wiki/User:CarbonPhoenix'>CarbonPhoenix</a> This is an in depth guide going over energy and how to manage it, from early game to late game. Provides comparisons between all of the different options and what will work best.
			</li>
			<li>
				<a href='https://steamcommunity.com/sharedfiles/filedetails/?id=723485559'>Save file help</a> by <a href='https://github.com/Amazinite'>Amazinite</a> A guide about what your save file is, how to find it, and what you can do with it.
			</li>
			<li>
				<a href='https://steamcommunity.com/sharedfiles/filedetails/?id=1753468591'>Remnant Guide</a> by <a href='https://github.com/Zitchas'>Zitchas</a> A guide about the Remnant and how to get started with their storyline. It does not include the more recent additions.
			</li>
			<li>
				<a href='https://endless-sky.fandom.com/wiki/Message_Wall:Litrevan?threadId=4400000000000023128'>Burst Weapons</a> by <a href='https://endless-sky.fandom.com/wiki/Message_Wall:Litrevan'>Litrevan</a> A full explanation of how burst weapons work.
			</li>
		</ul>

		<h2>Spreadsheets of Ship/Outfit data</h2>
		<div className='table-responsive'>
			<table style={{overflow: 'scroll', maxWidth: '100%'}} className='table table-hover table-striped-columns table-bordered' id='guides-spreadsheet-table'>
				<thead>
				<tr>
					<td>Updated (checked: 2025-07-15)</td>
					<td>Name</td>
					<td>Author</td>
					<td>Comparisons</td>
					<td>Ships</td>
					<td>Engine (Th/St)</td>
					<td>Cool</td>
					<td>Power / Batt</td>
					<td>Shield / Hull</td>
					<td>Gun</td>
					<td>2ry</td>
					<td>Turrets</td>
					<td>Fuel Regen</td>
					<td>AntiM</td>
				</tr>
				</thead>
				<tbody>
				<tr>
					<td></td>
					<td>
						<a href="https://discord.com/channels/251118043411775489/360922185319317504">James (Discord/bot-spam)</a>
					</td>
					<td>MCOfficer</td><td>None</td><td>all</td><td>all</td><td>all</td><td>all</td><td>all</td><td>all</td><td>all</td><td>all</td><td>all</td><td>1</td>
				</tr>
				<tr>
					<td>2025-04-11</td>
					<td>
						<a href="https://drive.google.com/drive/folders/0B635z_nU19WfQllrM2V2dWpFSFk">My Personal Spreadsheets</a> / <a href="https://docs.google.com/document/d/14xp7IT7bT3NPZFs6agepW0zY90wgOUH8Nf9etCQHOCE/edit">Notes &amp; Equations</a>
					</td>
					<td>Amazinite</td><td>'O/Efficiency'<br/>'$/Efficiency'<br/>etc...<br/>(VERY USEFUL!)</td><td>187</td><td>54/50</td><td>22</td><td>45/27</td><td>29</td><td>30</td><td>18</td><td>34</td><td>4</td><td>12</td>
				</tr>
				<tr>
					<td>2024-07-28</td>
					<td>
						<a href="https://docs.google.com/spreadsheets/d/1I1ns1pYfEZfOL8toM8R46zdjdEAK0ABfSoHLjB0Vtxg/edit#gid=334296101">Endless Sky Outfits Comparison</a>
					</td>
					<td>narf0708</td><td>'Size Efficiency'<br/>based on best-in-class?<br/>equation is ...?</td><th>0</th><td>60</td><td>16</td><td>42</td><td>26</td><td>30</td><th>0</th><td>33</td><th>0</th><td>10</td>
				</tr>
				<tr>
					<td>2021-05-14</td>
					<td>
						<a href="https://docs.google.com/spreadsheets/d/1YuBabYzi5wa8Bcvox7j_q_zttsQeEcvJF-i3mmwa9XU/edit#gid=681400681">ES Database</a>
					</td>
					<td>Arkhne</td><td>'X adjusted'<br/>with multipliers,<br/>equation is ...?</td><th>0</th><td>75</td><td>14</td><td>41/27</td><td>25</td><td>26</td><td>3</td><td>29</td><th>0</th><td>11</td>
				</tr>
				</tbody>
			</table>
		</div>

		<h2>Mod/Content Creating</h2>
		<ul>
			<li>
				<a href='https://github.com/endless-sky/endless-sky/wiki/CreatingShips'>Creating Ships</a>
				<ul>
					<li><a href='https://endless-sky.github.io/ship_builder.html'>Ship Builder</a></li>
					<li><a href='https://endless-sky-tools.github.io/Endless-Sky-Ship-Viewer/'>Ship Builder 2</a></li>
				</ul>
				<li><a href='https://github.com/endless-sky/endless-sky/wiki/CreatingOutfits'>Creating Outfits</a></li>
				<li><a href='https://github.com/endless-sky/endless-sky/wiki/CreatingPlugins'>Creating Plugins</a></li>
				<li>
					<a href='https://github.com/endless-sky/endless-sky/wiki/CreatingMissions'>Creating Missions</a>
					<ul>
						<li><a href='https://github.com/shitwolfymakes/Endless-Sky-Mission-Builder/releases'>Mission Builder</a> by <a href='shitwolfymakes'>https://github.com/shitwolfymakes</a></li>
					</ul>
				</li>
			</li>
		</ul>
		<hr/>
		<h6>Guides and Learning Material</h6>
		<ul>
			<li><a href='https://github.com/endless-sky/endless-sky/wiki'>Official Wiki</a>: The official wiki of the game on GitHub to learn about everything from mission creating to outfit making.</li>
			<li><a href='https://steamcommunity.com/sharedfiles/filedetails/?id=723485559'>How To: Save</a>: A guide at Steam community on everything you need to know about the save file; entry level game modding kind of stuff.</li>
		</ul>
		<h6>Modding Tools</h6>
		<ul>
			<li><a href='https://github.com/endless-sky/endless-sky-editor/releases'>Map Editor</a>: A tool that allows you to easily create and edit systems in the galaxy.</li>
			<li><a href='https://github.com/Wrzlprnft/world-forge'>World Forge</a>: A super sandbox mod which places every outfit and ship in the game on a single planet for testing purposes.</li>
		</ul>

		<h2>Community</h2>
		You can meet and get help from other Endless Sky players.
		<ul>
			<li>
				<a href='https://discord.gg/ZeuASSx'>Endless Sky Discord</a>
				<ul>
					<li>Lots of content here, with updates every day.</li>
					<li>The current game developers and content creators are on discord, as well as many other experienced players.</li>
				</ul>
			</li>
			<li><a href='https://steamcommunity.com/app/404410'>Steam Page</a></li>
			<li><a href='https://www.reddit.com/r/endlesssky/hot/'>Reddit</a></li>
		</ul>
	</>
}